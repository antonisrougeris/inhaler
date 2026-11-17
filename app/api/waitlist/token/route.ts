import { z } from "zod";
import { db } from "@/lib/db";
import {
  apiError,
  assertOrigin,
  readJson,
  hash,
  token,
  AppError,
} from "@/lib/security";
import { queueEmail } from "@/lib/email";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const input = z
      .object({
        token: z.string().length(64),
        action: z.enum(["confirm", "unsubscribe"]),
      })
      .parse(await readJson(request));
    const record = await db.subscriber.findUnique({
      where:
        input.action === "confirm"
          ? { tokenHash: hash(input.token) }
          : { unsubscribeHash: hash(input.token) },
    });
    if (!record) throw new AppError("LINK_INVALID", 400);
    if (input.action === "confirm") {
      if (record.tokenExpiresAt < new Date())
        throw new AppError("LINK_EXPIRED", 400);
      if (record.status === "PENDING") {
        const unsub = token();
        await db.subscriber.update({
          where: { id: record.id },
          data: {
            status: "CONFIRMED",
            confirmedAt: new Date(),
            unsubscribeHash: hash(unsub),
          },
        });
        await queueEmail(
          record.email,
          "You are on the list / Η εγγραφή ολοκληρώθηκε",
          "You will receive launch updates. Unsubscribe using the link below.",
          `${process.env.APP_URL}/${record.locale}/waitlist/unsubscribe?token=${unsub}`,
          `confirmed:${record.id}`,
        );
      }
    } else
      await db.subscriber.update({
        where: { id: record.id },
        data: { status: "UNSUBSCRIBED" },
      });
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
