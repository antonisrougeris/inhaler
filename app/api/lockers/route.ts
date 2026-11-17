import { shippingProvider } from "@/lib/integrations/shipping";
import { commerceGate, serial } from "@/lib/services/commerce";
import { apiError } from "@/lib/security";
export async function GET(request: Request) {
  try {
    await serial(commerceGate);
    const q = new URL(request.url).searchParams.get("q") ?? "";
    return Response.json(await shippingProvider().lockers(q.slice(0, 80)));
  } catch (e) {
    return apiError(e);
  }
}
