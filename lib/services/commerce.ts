import { z } from "zod";
import { db } from "../db";
import { Prisma } from "@/generated/prisma/client";
import { AppError, hash } from "../security";
import { taxIncluded, discounted, allocateDiscount } from "../money";
import {
  isMock,
  paymentProvider,
  type VerifiedPayment,
} from "../integrations/payments";
import { shippingProvider, mockShipping } from "../integrations/shipping";
import { emailTemplate, queueEmail } from "../email";
export const configurationSchema = z.object({
  refillVariantIds: z.array(z.string().min(1)).max(4).default([]),
});
export const cartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
  configuration: configurationSchema.default({ refillVariantIds: [] }),
});
export const checkoutSchema = z.object({
  idempotencyKey: z.uuid(),
  email: z
    .email()
    .max(254)
    .transform((x) => x.toLowerCase()),
  name: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^\+?[0-9 ()-]{9,20}$/),
  street: z.string().trim().min(3).max(150),
  city: z.string().trim().min(2).max(80),
  postalCode: z.string().regex(/^\d{5}$/),
  lockerId: z.string().min(1).max(80),
  coupon: z.string().max(40).default(""),
  terms: z.literal(true),
});
export async function serial<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(fn, {
        isolationLevel: "Serializable",
        timeout: 15000,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2034" &&
        attempt < 4
      )
        continue;
      throw e;
    }
  }
}
export async function commerceGate(tx: Prisma.TransactionClient) {
  const settings = await tx.storeSettings.findUniqueOrThrow({
    where: { id: "store" },
  });
  const test =
    settings.mode === "TEST" &&
    process.env.ALLOW_TEST_COMMERCE === "true" &&
    ["development", "test", "staging"].includes(process.env.APP_ENV ?? "");
  if (settings.mode !== "LIVE" && !test)
    throw new AppError("PRELAUNCH_PURCHASES_DISABLED", 403);
  if (
    !test &&
    (!settings.complianceApproved ||
      !settings.merchantApproved ||
      process.env.LIVE_COMMERCE_APPROVED !== "true" ||
      process.env.VIVA_ENV !== "live" ||
      isMock() ||
      mockShipping() ||
      !process.env.SMTP_HOST ||
      !process.env.BOXNOW_CLIENT_ID ||
      !process.env.VIVA_CLIENT_ID)
  )
    throw new AppError("STORE_NOT_APPROVED", 403);
  return { settings, test };
}
async function purchasable(
  tx: Prisma.TransactionClient,
  id: string,
  test: boolean,
) {
  const variant = await tx.variant.findUnique({
    where: { id },
    include: { product: { include: { compliance: true } }, bundleParts: true },
  });
  if (
    !variant ||
    !variant.active ||
    !variant.product.published ||
    variant.price <= 0
  )
    throw new AppError("PRODUCT_UNAVAILABLE", 409);
  if (
    !test &&
    (variant.product.demo ||
      variant.product.complianceStatus !== "APPROVED" ||
      !variant.confirmedSpecifications ||
      !variant.product.manufacturer ||
      !variant.product.responsibleOperator ||
      !variant.product.warningsEl ||
      !variant.product.instructionsEl ||
      !variant.product.compliance.some(
        (x) =>
          x.type === "INHALATION_ASSESSMENT" &&
          x.status === "APPROVED" &&
          x.reviewAt > new Date(),
      ))
  )
    throw new AppError("PRODUCT_NOT_APPROVED", 409);
  if (
    !test &&
    variant.flavorId &&
    !variant.product.compliance.some(
      (x) =>
        x.flavorId === variant.flavorId &&
        x.type === "INHALATION_ASSESSMENT" &&
        x.status === "APPROVED" &&
        x.reviewAt > new Date(),
    )
  )
    throw new AppError("FLAVOR_NOT_APPROVED", 409);
  return variant;
}
export async function quoteItems(
  tx: Prisma.TransactionClient,
  items: z.infer<typeof cartItemSchema>[],
  test: boolean,
) {
  if (!items.length || items.length > 30) throw new AppError("INVALID_CART");
  const components = new Map<string, number>();
  const add = (id: string, qty: number) =>
    components.set(id, (components.get(id) ?? 0) + qty);
  const lines = [];
  for (const item of items) {
    const v = await purchasable(tx, item.variantId, test);
    let unitPrice = v.price;
    const refillIds = item.configuration.refillVariantIds;
    if (
      refillIds.length &&
      (v.product.kind !== "DEVICE" || refillIds.length < 2)
    )
      throw new AppError("INVALID_KIT");
    if (v.bundleParts.length) {
      for (const part of v.bundleParts) {
        const component = await purchasable(tx, part.componentId, test);
        if (component.bundleParts.length)
          throw new AppError("NESTED_BUNDLES_UNSUPPORTED");
        add(part.componentId, part.quantity * item.quantity);
      }
    } else add(v.id, item.quantity);
    for (const id of refillIds) {
      const refill = await purchasable(tx, id, test);
      if (refill.product.kind !== "REFILL" || refill.bundleParts.length)
        throw new AppError("INVALID_REFILL");
      unitPrice += refill.price;
      add(id, item.quantity);
    }
    const refillNames = refillIds.length
      ? await tx.variant.findMany({
          where: { id: { in: refillIds } },
          select: { id: true, name: true },
        })
      : [];
    const configuration = {
      ...item.configuration,
      refillNames: refillIds.map(
        (id) => refillNames.find((x) => x.id === id)?.name ?? id,
      ),
    };
    lines.push({
      variantId: v.id,
      name: `${v.product.nameEn} · ${v.name}`,
      sku: v.sku,
      unitPrice,
      vatBps: v.vatBps,
      quantity: item.quantity,
      configuration,
    });
  }
  return { lines, components };
}
export async function releaseExpired(tx: Prisma.TransactionClient) {
  const orders = await tx.order.findMany({
    where: {
      status: { in: ["PENDING", "PAYMENT_ERROR"] },
      expiresAt: { lt: new Date() },
    },
    include: { reservations: true },
  });
  for (const order of orders) {
    await releaseOrder(tx, order.id, "EXPIRED");
  }
}
export async function releaseOrder(
  tx: Prisma.TransactionClient,
  id: string,
  status: string,
) {
  const order = await tx.order.findUniqueOrThrow({
    where: { id },
    include: { reservations: true },
  });
  if (!["PENDING", "PAYMENT_ERROR"].includes(order.status)) return;
  for (const r of order.reservations.filter((x) => !x.released)) {
    await tx.inventory.update({
      where: { variantId: r.variantId },
      data: { reserved: { decrement: r.quantity } },
    });
    await tx.reservation.update({
      where: { id: r.id },
      data: { released: true },
    });
  }
  if (order.couponId)
    await tx.coupon.update({
      where: { id: order.couponId },
      data: { used: { decrement: 1 } },
    });
  await tx.order.update({
    where: { id },
    data: {
      status,
      history: { create: { status, note: "Reservation released" } },
    },
  });
}
export async function createCheckout(
  cartToken: string,
  input: z.infer<typeof checkoutSchema>,
  userId?: string,
) {
  const accessHash = hash(cartToken);
  const parsed = checkoutSchema.parse(input);
  const result = await serial(async (tx) => {
    const { settings, test } = await commerceGate(tx);
    await releaseExpired(tx);
    const existing = await tx.order.findUnique({
      where: { idempotencyKey: parsed.idempotencyKey },
      include: { payment: true },
    });
    if (existing) {
      if (existing.accessHash !== accessHash)
        throw new AppError("CONFLICT", 409);
      return existing;
    }
    const cart = await tx.cart.findUnique({
      where: { tokenHash: accessHash },
      include: { items: true },
    });
    if (!cart || cart.expiresAt < new Date())
      throw new AppError("CART_EXPIRED", 409);
    const active = await tx.order.findFirst({
      where: { cartId: cart.id, status: "PENDING" },
      include: { payment: true },
    });
    if (active) return active;
    const items = cart.items.map((item) => cartItemSchema.parse(item));
    const { lines, components } = await quoteItems(tx, items, test);
    const subtotal = lines.reduce(
      (sum, line) => sum + line.unitPrice * line.quantity,
      0,
    );
    let discount = 0,
      couponId: string | undefined;
    if (parsed.coupon) {
      const coupon = await tx.coupon.findUnique({
        where: { code: parsed.coupon.toUpperCase() },
      });
      if (
        !coupon ||
        !coupon.active ||
        coupon.used >= coupon.maxUses ||
        (coupon.expiresAt && coupon.expiresAt < new Date()) ||
        subtotal < coupon.minSpend
      )
        throw new AppError("INVALID_COUPON");
      discount = discounted(subtotal, coupon.type, coupon.amount);
      couponId = coupon.id;
      await tx.coupon.update({
        where: { id: coupon.id },
        data: { used: { increment: 1 } },
      });
    }
    for (const [variantId, quantity] of [...components].sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      const rows =
        await tx.$executeRaw`UPDATE "Inventory" SET "reserved"="reserved"+${quantity} WHERE "variantId"=${variantId} AND "onHand"-"reserved">=${quantity}`;
      if (rows !== 1) throw new AppError("OUT_OF_STOCK", 409);
    }
    const shipping = settings.shippingPrice;
    const tax =
      allocateDiscount(
        lines.map((x) => ({
          gross: x.unitPrice * x.quantity,
          vatBps: x.vatBps,
        })),
        discount,
      ).reduce((a, x) => a + taxIncluded(x.gross, x.vatBps), 0) +
      taxIncluded(shipping, settings.vatBps);
    // Locker is verified against server-fetched destinations before entering this transaction (API route).
    return tx.order.create({
      data: {
        number: `FA-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
        idempotencyKey: parsed.idempotencyKey,
        accessHash,
        cartId: cart.id,
        userId,
        email: parsed.email,
        name: parsed.name,
        phone: parsed.phone,
        address: {
          street: parsed.street,
          city: parsed.city,
          postalCode: parsed.postalCode,
          country: "GR",
        },
        lockerId: parsed.lockerId,
        subtotal,
        discount,
        couponId,
        shipping,
        tax,
        total: subtotal - discount + shipping,
        test,
        expiresAt: new Date(Date.now() + 15 * 60000),
        items: { create: lines },
        reservations: {
          create: [...components].map(([variantId, quantity]) => ({
            variantId,
            quantity,
          })),
        },
        history: {
          create: {
            status: "PENDING",
            note: "Checkout created; stock reserved for 15 minutes",
          },
        },
        payment: {
          create: {
            provider: isMock()
              ? "mock"
              : process.env.VIVA_ENV === "live"
                ? "viva"
                : "viva_sandbox",
          },
        },
      },
      include: { payment: true },
    });
  });
  if (result.payment?.status !== "CREATING") return result;
  // Atomic claim prevents concurrent requests from creating two provider orders.
  const claimed = await db.payment.updateMany({
    where: { orderId: result.id, status: "CREATING" },
    data: { status: "INITIATING" },
  });
  if (!claimed.count)
    return db.order.findUniqueOrThrow({
      where: { id: result.id },
      include: { payment: true },
    });
  try {
    const payment = await paymentProvider().create(result);
    await db.payment.update({
      where: { orderId: result.id },
      data: {
        providerOrderId: payment.orderCode,
        checkoutUrl: payment.url,
        status: "PENDING",
      },
    });
  } catch {
    await db.payment.update({
      where: { orderId: result.id },
      data: { status: "RECONCILIATION_REQUIRED" },
    });
    throw new AppError("PAYMENT_REQUIRES_RECONCILIATION", 502);
  }
  await queueEmail(
    result.email,
    "Order received / Λήψη παραγγελίας",
    `Order ${result.number} is awaiting payment. ${result.test ? "TEST ORDER — no real transaction." : ""}`,
    undefined,
    `order:${result.id}`,
  );
  return db.order.findUniqueOrThrow({
    where: { id: result.id },
    include: { payment: true },
  });
}
export async function settlePayment(verified: VerifiedPayment) {
  return serial(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { providerOrderId: verified.orderCode },
      include: { order: { include: { reservations: true } } },
    });
    if (!payment) throw new AppError("PAYMENT_NOT_FOUND", 404);
    if (
      verified.amount !== payment.order.total ||
      !["978", "EUR"].includes(verified.currency) ||
      verified.status !== "F"
    )
      throw new AppError("PAYMENT_MISMATCH", 409);
    const externalId = `paid:${verified.transactionId}`;
    if (await tx.paymentEvent.findUnique({ where: { externalId } }))
      return payment.order;
    if (payment.status === "PAID")
      throw new AppError("DUPLICATE_PAYMENT_REVIEW", 409);
    const late =
      payment.order.status !== "PENDING" ||
      payment.order.expiresAt < new Date();
    await tx.paymentEvent.create({
      data: {
        externalId,
        paymentId: payment.id,
        kind: late ? "LATE_PAYMENT" : "PAID",
      },
    });
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        transactionId: verified.transactionId,
        status: late ? "REVIEW_REQUIRED" : "PAID",
      },
    });
    if (late) {
      await releaseOrder(tx, payment.orderId, "EXPIRED");
      return tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: "PAYMENT_REVIEW",
          history: {
            create: {
              status: "PAYMENT_REVIEW",
              note: "Payment arrived after reservation; manual refund/reconciliation required",
            },
          },
        },
      });
    }
    for (const r of payment.order.reservations) {
      await tx.inventory.update({
        where: { variantId: r.variantId },
        data: {
          reserved: { decrement: r.quantity },
          onHand: { decrement: r.quantity },
          sold: { increment: r.quantity },
        },
      });
      await tx.reservation.update({
        where: { id: r.id },
        data: { released: true },
      });
      await tx.inventoryMovement.create({
        data: {
          variantId: r.variantId,
          delta: -r.quantity,
          reason: "SALE",
          reference: payment.orderId,
        },
      });
    }
    await tx.cartItem.deleteMany({ where: { cartId: payment.order.cartId } });
    const settings = await tx.storeSettings.findUniqueOrThrow({
      where: { id: "store" },
    });
    await tx.emailJob.create({
      data: {
        dedupeKey: `paid:${payment.orderId}`,
        to: payment.order.email,
        subject: `${payment.order.number} — payment confirmed`,
        html: emailTemplate(
          settings.brandName,
          "Payment confirmed / Επιβεβαίωση πληρωμής",
          `Order ${payment.order.number}. ${payment.order.test ? "TEST ORDER — no real payment or shipment." : ""}`,
        ),
      },
    });
    return tx.order.update({
      where: { id: payment.orderId },
      data: {
        status: "PAID",
        history: {
          create: { status: "PAID", note: "Server-verified payment" },
        },
      },
    });
  });
}
export async function createShipment(id: string, actorId: string) {
  const claim = await db.order.updateMany({
    where: { id, status: "PAID", shipments: { none: {} } },
    data: { status: "SHIPPING_REQUESTED" },
  });
  if (!claim.count) throw new AppError("SHIPMENT_ALREADY_REQUESTED", 409);
  const order = await db.order.findUniqueOrThrow({ where: { id } });
  try {
    const result = await shippingProvider().create(order);
    return await db.$transaction(async (tx) => {
      const shipment = await tx.shipment.create({
        data: {
          orderId: id,
          provider: mockShipping() ? "mock" : "boxnow",
          ...result,
          status: "CREATED",
          tracking: { create: { status: "CREATED" } },
        },
      });
      await tx.order.update({
        where: { id },
        data: {
          status: "SHIPPED",
          history: { create: { status: "SHIPPED", note: "Shipment created" } },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          action: "CREATE_SHIPMENT",
          entity: "order",
          entityId: id,
          details: { reference: result.reference },
        },
      });
      return shipment;
    });
  } catch {
    await db.orderHistory.create({
      data: {
        orderId: id,
        status: "SHIPPING_REQUESTED",
        note: "Provider result uncertain. Reconcile before retrying; no automatic duplicate shipment.",
      },
    });
    throw new AppError("SHIPMENT_RECONCILIATION_REQUIRED", 502);
  }
}
export async function refundOrder(id: string, actorId: string) {
  const order = await db.order.findUniqueOrThrow({
    where: { id },
    include: { payment: true },
  });
  if (
    !order.payment?.transactionId ||
    !["PAID", "SHIPPED", "PAYMENT_REVIEW"].includes(order.status)
  )
    throw new AppError("REFUND_NOT_ALLOWED", 409);
  const claim = await db.payment.updateMany({
    where: {
      id: order.payment.id,
      status: { in: ["PAID", "REVIEW_REQUIRED"] },
    },
    data: { status: "REFUND_PENDING" },
  });
  if (!claim.count) throw new AppError("REFUND_ALREADY_REQUESTED", 409);
  // Never automatically retry a timeout: the provider may already have refunded.
  const reference = await paymentProvider().refund(
    order.payment.transactionId,
    order.total,
  );
  return db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: order.payment!.id },
      data: { status: "REFUNDED", refunded: order.total },
    });
    await tx.auditLog.create({
      data: {
        actorId,
        action: "REFUND",
        entity: "order",
        entityId: id,
        details: { amount: order.total, reference },
      },
    });
    return tx.order.update({
      where: { id },
      data: {
        status: "REFUNDED",
        history: {
          create: {
            status: "REFUNDED",
            note: "Full refund confirmed; returned goods require separate stock adjustment",
          },
        },
      },
    });
  });
}
