import "dotenv/config";
import { db } from "../lib/db";
import { serial, releaseExpired } from "../lib/services/commerce";
import { sendPendingEmails } from "../lib/email";
await serial(releaseExpired);
const result = await sendPendingEmails();
await db.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } });
await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
await db.cart.deleteMany({ where: { expiresAt: { lt: new Date() } } });
// PENDING subscriptions expire after 30 days; confirmed consent is retained until withdrawal.
const cutoff = new Date(Date.now() - 30 * 86400000);
await db.subscriber.deleteMany({
  where: { status: "PENDING", createdAt: { lt: cutoff } },
});
await db.emailJob.deleteMany({
  where: { status: "SENT", createdAt: { lt: cutoff } },
});
console.log(JSON.stringify({ email: result }));
await db.$disconnect();
