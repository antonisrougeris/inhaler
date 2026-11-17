import { z } from "zod";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { isMock } from "@/lib/integrations/payments";
import {
  settlePayment,
  serial,
  releaseOrder,
  commerceGate,
} from "@/lib/services/commerce";
import {
  apiError,
  assertOrigin,
  hash,
  readJson,
  AppError,
} from "@/lib/security";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    if (!isMock()) throw new AppError("NOT_FOUND", 404);
    await serial(commerceGate);
    const { id, action } = z
      .object({ id: z.string(), action: z.enum(["pay", "cancel"]) })
      .parse(await readJson(request));
    const cart = (await cookies()).get("fa-cart")?.value;
    const order = await db.order.findUnique({
      where: { id },
      include: { payment: true },
    });
    if (
      !order ||
      !order.test ||
      !cart ||
      hash(cart) !== order.accessHash ||
      order.payment?.provider !== "mock"
    )
      throw new AppError("FORBIDDEN", 403);
    if (action === "cancel")
      await serial((tx) => releaseOrder(tx, id, "CANCELLED"));
    else
      await settlePayment({
        transactionId: `test-${id}`,
        orderCode: order.payment.providerOrderId!,
        amount: order.total,
        currency: "EUR",
        status: "F",
      });
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
