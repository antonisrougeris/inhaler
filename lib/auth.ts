import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";
import { queueEmail } from "./email";
export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.APP_URL ?? "http://localhost:3000",
  trustedOrigins: [process.env.APP_URL ?? "http://localhost:3000"],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 12,
    sendResetPassword: async ({ user, url }) => {
      await queueEmail(
        user.email,
        "Reset your password / Επαναφορά κωδικού",
        "Follow this link to reset your password.",
        url,
      );
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await queueEmail(
        user.email,
        "Verify your email / Επιβεβαίωση email",
        "Confirm your email address to activate your account.",
        url,
      );
    },
  },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "CUSTOMER", input: false },
    },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "authRateLimit",
    window: 60,
    max: 30,
  },
  advanced: {
    useSecureCookies: process.env.APP_URL?.startsWith("https://") ?? false,
  },
});
