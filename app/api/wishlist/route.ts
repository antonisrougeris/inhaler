import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/admin-auth";
import { apiError, assertOrigin, readJson } from "@/lib/security";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const user = await requireUser();
    const { productId } = z
      .object({ productId: z.string() })
      .parse(await readJson(request));
    const where = { userId_productId: { userId: user.id, productId } };
    const existing = await db.wishlist.findUnique({ where });
    if (existing) await db.wishlist.delete({ where });
    else await db.wishlist.create({ data: { userId: user.id, productId } });
    return Response.json({ saved: !existing });
  } catch (e) {
    return apiError(e);
  }
}
