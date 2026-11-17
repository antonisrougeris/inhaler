import { sendPendingEmails } from "@/lib/email";
import { z } from "zod";
import { VivaProvider } from "@/lib/integrations/payments";
import { settlePayment } from "@/lib/services/commerce";
import { apiError, readJson, AppError } from "@/lib/security";
export async function GET() {
  try {
    return Response.json(await new VivaProvider().webhookKey());
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    const event = z
      .object({
        EventData: z.object({ TransactionId: z.uuid() }),
        EventTypeId: z.number(),
      })
      .parse(await readJson(request));
    if (event.EventTypeId !== 1796)
      return Response.json({ received: true, ignored: true });
    // Webhook registration key is NOT a notification signature. Authenticate the financial fact by server-side retrieval, never by the incoming body.
    const verified = await new VivaProvider().verify(
      event.EventData.TransactionId,
    );
    if (verified.status !== "F")
      throw new AppError("PAYMENT_NOT_COMPLETE", 409);
    await settlePayment(verified);
    await sendPendingEmails();
    return Response.json({ received: true });
  } catch (e) {
    return apiError(e);
  }
}
