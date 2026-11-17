import "dotenv/config";
import { auth } from "../lib/auth";
import { db } from "../lib/db";
const email = process.env.ADMIN_EMAIL,
  password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 16)
  throw new Error(
    "Set ADMIN_EMAIL and ADMIN_PASSWORD (16+ chars) for this command only.",
  );
const existing = await db.user.findUnique({ where: { email } });
if (!existing)
  await auth.api.signUpEmail({
    body: { email, password, name: "Store owner" },
  });
await db.user.update({
  where: { email },
  data: { role: "OWNER", emailVerified: true },
});
console.log("Owner account provisioned. Remove bootstrap variables.");
await db.$disconnect();
