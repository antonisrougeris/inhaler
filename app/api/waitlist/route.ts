import { z } from "zod";
import { db } from "@/lib/db";
import {
  assertOrigin,
  rateLimit,
  requestKey,
  readJson,
  apiError,
  token,
  hash,
} from "@/lib/security";
import { queueEmail } from "@/lib/email";
const schema = z.object({
  email: z
    .email()
    .max(254)
    .transform((x) => x.trim().toLowerCase()),
  locale: z.enum(["el", "en"]),
  consent: z.literal(true),
  source: z.string().max(80),
  website: z.literal("").default(""),
});
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    await rateLimit(`waitlist:${requestKey(request)}`, 10);
    const input = schema.parse(await readJson(request));
    const settings = await db.storeSettings.findUniqueOrThrow({
      where: { id: "store" },
    });
    const existing = await db.subscriber.findUnique({
      where: { email: input.email },
    });
    if (!existing) {
      const confirm = token(),
        unsubscribe = token();
      const created = await db.subscriber.create({
        data: {
          email: input.email,
          locale: input.locale,
          source: input.source,
          consentAt: new Date(),
          consentVersion: "waitlist-v1",
          status: settings.doubleOptIn ? "PENDING" : "CONFIRMED",
          confirmedAt: settings.doubleOptIn ? null : new Date(),
          tokenHash: hash(confirm),
          tokenExpiresAt: new Date(Date.now() + 48 * 3600000),
          unsubscribeHash: hash(unsubscribe),
        },
      });
      await queueEmail(
        input.email,
        settings.doubleOptIn
          ? "Confirm your interest / Επιβεβαίωση εγγραφής"
          : "Welcome / Καλώς ήρθες",
        settings.doubleOptIn
          ? "Confirm that you want to receive launch updates."
          : "You can unsubscribe at any time.",
        `${process.env.APP_URL}/${input.locale}/waitlist/${settings.doubleOptIn ? "confirm" : "unsubscribe"}?token=${settings.doubleOptIn ? confirm : unsubscribe}`,
        `waitlist:${created.id}`,
      );
    }
    return Response.json({
      message: settings.doubleOptIn ? "CHECK_EMAIL" : "SUBSCRIBED",
    });
  } catch (e) {
    return apiError(e);
  }
}
