import "dotenv/config";
import { it, expect, vi, afterAll } from "vitest";
import { db } from "../lib/db";
import { POST as waitlist } from "../app/api/waitlist/route";
import { POST as feedback } from "../app/api/feedback/route";
import { GET as admin } from "../app/api/admin/[resource]/route";
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
const origin = process.env.APP_URL ?? "http://localhost:3000";
const email = `api-${Date.now()}@example.invalid`;
const request = (body: unknown, site = origin) =>
  new Request(`${origin}/api/waitlist`, {
    method: "POST",
    headers: { origin: site, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
afterAll(async () => {
  await db.subscriber.deleteMany({ where: { email } });
  await db.emailJob.deleteMany({ where: { to: email } });
  await db.feedback.deleteMany({ where: { email } });
  await db.$disconnect();
});
it("rejects cross-origin writes", async () => {
  expect((await waitlist(request({}, "https://attacker.invalid"))).status).toBe(
    403,
  );
});
it("rejects waitlist without explicit consent", async () => {
  expect(
    (
      await waitlist(
        request({ email, locale: "en", source: "integration", consent: false }),
      )
    ).status,
  ).toBe(400);
});
it("persists consent and a hashed confirmation token", async () => {
  const body = { email, locale: "en", source: "integration", consent: true };
  expect((await waitlist(request(body))).status).toBe(200);
  expect((await waitlist(request(body))).status).toBe(200);
  const record = await db.subscriber.findUniqueOrThrow({ where: { email } });
  expect(record.status).toBe("PENDING");
  expect(record.consentVersion).toBe("waitlist-v1");
  expect(record.tokenHash).toHaveLength(64);
  expect(await db.emailJob.count({ where: { to: email } })).toBe(1);
});
it("does not subscribe survey participants", async () => {
  const surveyEmail = `survey-${email}`;
  expect(
    (
      await feedback(
        request({
          kind: "SURVEY",
          email: surveyEmail,
          answers: { interest: "Yes" },
          website: "",
        }),
      )
    ).status,
  ).toBe(200);
  expect(
    await db.subscriber.findUnique({ where: { email: surveyEmail } }),
  ).toBeNull();
  await db.feedback.deleteMany({ where: { email: surveyEmail } });
});
it("denies unauthenticated admin API access", async () => {
  const response = await admin(new Request(`${origin}/api/admin/products`), {
    params: Promise.resolve({ resource: "products" }),
  });
  expect(response.status).toBe(401);
});
