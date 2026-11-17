import { cookies } from "next/headers";
import { db } from "@/lib/db";
import {
  apiError,
  assertOrigin,
  token,
  hash,
  readJson,
  AppError,
} from "@/lib/security";
import {
  cartItemSchema,
  commerceGate,
  quoteItems,
  serial,
} from "@/lib/services/commerce";
export async function GET() {
  try {
    const jar = await cookies();
    const value = jar.get("fa-cart")?.value;
    if (!value) return Response.json({ items: [] });
    const cart = await db.cart.findUnique({
      where: { tokenHash: hash(value) },
      include: { items: true },
    });
    return Response.json(
      cart && cart.expiresAt > new Date() ? cart : { items: [] },
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const input = cartItemSchema.parse(await readJson(request));
    const jar = await cookies();
    let value = jar.get("fa-cart")?.value;
    if (!value) value = token();
    const tokenHash = hash(value);
    const result = await serial(async (tx) => {
      const { test } = await commerceGate(tx);
      await quoteItems(tx, [input], test);
      const cart = await tx.cart.upsert({
        where: { tokenHash },
        create: { tokenHash, expiresAt: new Date(Date.now() + 7 * 86400000) },
        update: { expiresAt: new Date(Date.now() + 7 * 86400000) },
      });
      const count = await tx.cartItem.count({ where: { cartId: cart.id } });
      if (count >= 30) throw new AppError("CART_LIMIT");
      return tx.cartItem.create({ data: { cartId: cart.id, ...input } });
    });
    jar.set("fa-cart", value, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.APP_URL?.startsWith("https://"),
      path: "/",
      maxAge: 7 * 86400,
    });
    return Response.json(result);
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(request: Request) {
  try {
    assertOrigin(request);
    const value = (await cookies()).get("fa-cart")?.value;
    if (!value) return Response.json({ ok: true });
    const id = new URL(request.url).searchParams.get("id");
    if (id)
      await db.cartItem.deleteMany({
        where: { id, cart: { tokenHash: hash(value) } },
      });
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
