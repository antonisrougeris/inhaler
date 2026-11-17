import { cookies } from "next/headers";
import { z } from "zod";
import {
  apiError,
  assertOrigin,
  readJson,
  hash,
  AppError,
} from "@/lib/security";
import {
  serial,
  commerceGate,
  cartItemSchema,
  quoteItems,
} from "@/lib/services/commerce";
import { taxIncluded, discounted, allocateDiscount } from "@/lib/money";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const { coupon: code } = z
      .object({ coupon: z.string().max(40).default("") })
      .parse(await readJson(request));
    const value = (await cookies()).get("fa-cart")?.value;
    if (!value) throw new AppError("CART_EMPTY");
    const result = await serial(async (tx) => {
      const { settings, test } = await commerceGate(tx);
      const cart = await tx.cart.findUnique({
        where: { tokenHash: hash(value) },
        include: { items: true },
      });
      if (!cart || cart.expiresAt < new Date())
        throw new AppError("CART_EXPIRED");
      const { lines } = await quoteItems(
        tx,
        cart.items.map((x) => cartItemSchema.parse(x)),
        test,
      );
      const subtotal = lines.reduce((a, x) => a + x.unitPrice * x.quantity, 0);
      let discount = 0;
      if (code) {
        const coupon = await tx.coupon.findUnique({
          where: { code: code.toUpperCase() },
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
      return {
        lines,
        subtotal,
        discount,
        shipping,
        tax,
        total: subtotal - discount + shipping,
      };
    });
    return Response.json(result);
  } catch (e) {
    return apiError(e);
  }
}
