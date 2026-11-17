import "dotenv/config";
import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import { db } from "../lib/db";
import { hash, token } from "../lib/security";
import {
  createCheckout,
  settlePayment,
  releaseExpired,
  serial,
  commerceGate,
  quoteItems,
} from "../lib/services/commerce";
let variantId: string;
const orders: string[] = [];
const carts: string[] = [];
const input = () => ({
  idempotencyKey: crypto.randomUUID(),
  email: "integration@example.invalid",
  name: "Integration Fixture",
  phone: "+306900000000",
  street: "Fixture street",
  city: "Athens",
  postalCode: "10551",
  lockerId: "TEST-ATHENS",
  coupon: "",
  terms: true as const,
});
async function cart(quantity = 1, refills: string[] = []) {
  const value = token();
  const c = await db.cart.create({
    data: {
      tokenHash: hash(value),
      expiresAt: new Date(Date.now() + 3600000),
      items: {
        create: {
          variantId,
          quantity,
          configuration: { refillVariantIds: refills },
        },
      },
    },
  });
  carts.push(c.id);
  return value;
}
beforeAll(async () => {
  process.env.APP_ENV = "test";
  process.env.ALLOW_TEST_COMMERCE = "true";
  process.env.PAYMENT_PROVIDER = "mock";
  process.env.SHIPPING_PROVIDER = "mock";
  variantId = (
    await db.variant.findUniqueOrThrow({ where: { sku: "form-01-walnut" } })
  ).id;
});
beforeEach(async () => {
  await db.storeSettings.update({
    where: { id: "store" },
    data: { mode: "TEST" },
  });
  await db.inventory.updateMany({ data: { onHand: 10, reserved: 0, sold: 0 } });
});
afterAll(async () => {
  for (const id of orders) {
    await db.paymentEvent.deleteMany({ where: { payment: { orderId: id } } });
    await db.payment.deleteMany({ where: { orderId: id } });
    await db.orderHistory.deleteMany({ where: { orderId: id } });
    await db.reservation.deleteMany({ where: { orderId: id } });
    await db.orderItem.deleteMany({ where: { orderId: id } });
    await db.emailJob.deleteMany({ where: { dedupeKey: `paid:${id}` } });
    await db.order.delete({ where: { id } });
  }
  await db.cart.deleteMany({ where: { id: { in: carts } } });
  await db.inventoryMovement.deleteMany({
    where: { reference: { in: orders } },
  });
  await db.inventory.updateMany({ data: { onHand: 0, reserved: 0, sold: 0 } });
  await db.storeSettings.update({
    where: { id: "store" },
    data: { mode: "PRELAUNCH" },
  });
  await db.$disconnect();
});
describe("real PostgreSQL checkout transactions", () => {
  it("blocks purchase on the server in pre-launch", async () => {
    await db.storeSettings.update({
      where: { id: "store" },
      data: { mode: "PRELAUNCH" },
    });
    await expect(createCheckout(await cart(), input())).rejects.toThrow(
      "PRELAUNCH_PURCHASES_DISABLED",
    );
  });
  it("refuses LIVE when approvals or credentials are missing", async () => {
    await db.storeSettings.update({
      where: { id: "store" },
      data: { mode: "LIVE" },
    });
    await expect(serial(commerceGate)).rejects.toThrow("STORE_NOT_APPROVED");
  });
  it("prevents overselling under concurrent checkout", async () => {
    await db.inventory.update({ where: { variantId }, data: { onHand: 1 } });
    const tokens = await Promise.all([cart(), cart()]);
    const result = await Promise.allSettled(
      tokens.map((t) => createCheckout(t, input())),
    );
    expect(result.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    for (const r of result)
      if (r.status === "fulfilled") orders.push(r.value.id);
    expect(
      (await db.inventory.findUniqueOrThrow({ where: { variantId } })).reserved,
    ).toBe(1);
  });
  it("makes checkout and successful webhooks idempotent", async () => {
    const value = await cart(),
      body = input();
    const first = await createCheckout(value, body);
    orders.push(first.id);
    const second = await createCheckout(value, body);
    expect(second.id).toBe(first.id);
    const event = {
      transactionId: `test-${first.id}`,
      orderCode: first.payment!.providerOrderId!,
      amount: first.total,
      currency: "EUR",
      status: "F",
    };
    await Promise.all([settlePayment(event), settlePayment(event)]);
    expect(
      await db.paymentEvent.count({ where: { paymentId: first.payment!.id } }),
    ).toBe(1);
    expect(
      (await db.inventory.findUniqueOrThrow({ where: { variantId } })).sold,
    ).toBe(1);
    expect(
      await db.emailJob.count({ where: { dedupeKey: `paid:${first.id}` } }),
    ).toBe(1);
  });
  it("rejects forged amount and currency without reducing stock", async () => {
    const order = await createCheckout(await cart(), input());
    orders.push(order.id);
    await expect(
      settlePayment({
        transactionId: "forged",
        orderCode: order.payment!.providerOrderId!,
        amount: 1,
        currency: "USD",
        status: "F",
      }),
    ).rejects.toThrow("PAYMENT_MISMATCH");
    expect(
      (await db.order.findUniqueOrThrow({ where: { id: order.id } })).status,
    ).toBe("PENDING");
  });
  it("reserves exact repeated kit components and retains their names", async () => {
    const refill = (
      await db.variant.findUniqueOrThrow({ where: { sku: "core-lemon" } })
    ).id;
    const order = await createCheckout(
      await cart(2, [refill, refill]),
      input(),
    );
    orders.push(order.id);
    const reservations = await db.reservation.findMany({
      where: { orderId: order.id },
    });
    expect(reservations.find((x) => x.variantId === variantId)?.quantity).toBe(
      2,
    );
    expect(reservations.find((x) => x.variantId === refill)?.quantity).toBe(4);
    expect(order.subtotal).toBe((3900 + 800 + 800) * 2);
    const item = await db.orderItem.findFirstOrThrow({
      where: { orderId: order.id },
    });
    expect(item.configuration).toMatchObject({
      refillNames: ["Lemon", "Lemon"],
    });
  });
  it("releases expired stock once and quarantines late payment", async () => {
    const order = await createCheckout(await cart(), input());
    orders.push(order.id);
    await db.order.update({
      where: { id: order.id },
      data: { expiresAt: new Date(0) },
    });
    await serial(releaseExpired);
    await serial(releaseExpired);
    expect(
      (await db.inventory.findUniqueOrThrow({ where: { variantId } })).reserved,
    ).toBe(0);
    await settlePayment({
      transactionId: `late-${order.id}`,
      orderCode: order.payment!.providerOrderId!,
      amount: order.total,
      currency: "EUR",
      status: "F",
    });
    expect(
      (await db.order.findUniqueOrThrow({ where: { id: order.id } })).status,
    ).toBe("PAYMENT_REVIEW");
    expect(
      (await db.inventory.findUniqueOrThrow({ where: { variantId } })).sold,
    ).toBe(0);
  });
  it("rejects a manipulated kit containing a device as refill", async () => {
    await expect(
      serial((tx) =>
        quoteItems(
          tx,
          [
            {
              variantId,
              quantity: 1,
              configuration: { refillVariantIds: [variantId, variantId] },
            },
          ],
          true,
        ),
      ),
    ).rejects.toThrow("INVALID_REFILL");
  });
});
