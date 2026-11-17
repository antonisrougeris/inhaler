import { it, expect, vi, afterEach } from "vitest";
import {
  VivaProvider,
  MockPaymentProvider,
  isMock,
} from "../lib/integrations/payments";
import { BoxNowProvider } from "../lib/integrations/shipping";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("never permits mock payments in production", async () => {
  vi.stubEnv("PAYMENT_PROVIDER", "mock");
  vi.stubEnv("APP_ENV", "production");
  expect(isMock()).toBe(false);
  await expect(
    new MockPaymentProvider().create({
      id: "x",
      email: "test@example.com",
      name: "Test",
      total: 100,
    }),
  ).rejects.toThrow();
});
it("verifies Viva through the API, normalizing major units", async () => {
  vi.stubEnv("VIVA_ENV", "sandbox");
  vi.stubEnv("VIVA_CLIENT_ID", "fixture");
  vi.stubEnv("VIVA_CLIENT_SECRET", "fixture");
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ access_token: "fixture-token" }))
    .mockResolvedValueOnce(
      Response.json({
        orderCode: 123456,
        amount: 12.4,
        currencyCode: 978,
        statusId: "F",
      }),
    );
  vi.stubGlobal("fetch", fetch);
  const id = "af1677e0-3759-4653-bf1c-bd2d1d551088";
  const result = await new VivaProvider().verify(id);
  expect(result).toEqual({
    transactionId: id,
    orderCode: "123456",
    amount: 1240,
    currency: "978",
    status: "F",
  });
  expect(fetch.mock.calls[1][0]).toBe(
    `https://demo-api.vivapayments.com/checkout/v2/transactions/${id}`,
  );
});
it("rejects a malformed provider response", async () => {
  vi.stubEnv("VIVA_CLIENT_ID", "fixture");
  vi.stubEnv("VIVA_CLIENT_SECRET", "fixture");
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(Response.json({ access_token: "x" }))
      .mockResolvedValueOnce(Response.json({ paid: true })),
  );
  await expect(
    new VivaProvider().verify("af1677e0-3759-4653-bf1c-bd2d1d551088"),
  ).rejects.toThrow();
});
it("validates BOX NOW responses and excludes other countries", async () => {
  vi.stubEnv("BOXNOW_BASE_URL", "https://api-stage.boxnow.gr/api/v1");
  vi.stubEnv("BOXNOW_CLIENT_ID", "fixture");
  vi.stubEnv("BOXNOW_CLIENT_SECRET", "fixture");
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(Response.json({ access_token: "x" }))
      .mockResolvedValueOnce(
        Response.json({
          data: [
            {
              id: "1",
              name: "Athens",
              addressLine1: "Test",
              postalCode: "10551",
              country: "GR",
            },
            {
              id: "2",
              name: "Other",
              addressLine1: "Test",
              postalCode: "00000",
              country: "BG",
            },
          ],
        }),
      ),
  );
  expect(await new BoxNowProvider().lockers("Athens")).toHaveLength(1);
});
