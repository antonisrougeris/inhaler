import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  apiError,
  assertOrigin,
  readJson,
  AppError,
  rateLimit,
  requestKey,
} from "@/lib/security";
import {
  checkoutSchema,
  createCheckout,
  commerceGate,
  serial,
} from "@/lib/services/commerce";
import { shippingProvider } from "@/lib/integrations/shipping";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    await rateLimit(`checkout:${requestKey(request)}`, 20);
    await serial(commerceGate);
    const input = checkoutSchema.parse(await readJson(request));
    const cart = (await cookies()).get("fa-cart")?.value;
    if (!cart) throw new AppError("CART_EMPTY");
    const lockers = await shippingProvider().lockers("");
    if (!lockers.some((x) => x.id === input.lockerId))
      throw new AppError("INVALID_LOCKER");
    const session = await auth.api.getSession({ headers: await headers() });
    const result = await createCheckout(cart, input, session?.user.id);
    return Response.json({
      id: result.id,
      url: result.payment?.checkoutUrl,
      status: result.payment?.status,
    });
  } catch (e) {
    return apiError(e);
  }
}
