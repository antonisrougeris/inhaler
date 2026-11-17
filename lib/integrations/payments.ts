import { z } from "zod";
import { AppError } from "../security";
export type PaymentInput = {
  id: string;
  total: number;
  email: string;
  name: string;
};
export type VerifiedPayment = {
  transactionId: string;
  orderCode: string;
  amount: number;
  currency: string;
  status: string;
};
export interface PaymentProvider {
  create(input: PaymentInput): Promise<{ orderCode: string; url: string }>;
  verify(transactionId: string): Promise<VerifiedPayment>;
  refund(transactionId: string, amount: number): Promise<string>;
}
export const isMock = () =>
  process.env.PAYMENT_PROVIDER === "mock" &&
  ["development", "test"].includes(process.env.APP_ENV ?? "");
const required = (key: string) => {
  const value = process.env[key];
  if (!value) throw new AppError("PAYMENT_NOT_CONFIGURED", 503);
  return value;
};
async function checked(response: Response) {
  if (!response.ok) throw new AppError("PAYMENT_PROVIDER_ERROR", 502);
  return response.json();
}
export class VivaProvider implements PaymentProvider {
  private get live() {
    return process.env.VIVA_ENV === "live";
  }
  private get api() {
    return this.live
      ? "https://api.vivapayments.com"
      : "https://demo-api.vivapayments.com";
  }
  private get legacy() {
    return this.live
      ? "https://www.vivapayments.com"
      : "https://demo.vivapayments.com";
  }
  private basic() {
    return `Basic ${Buffer.from(`${required("VIVA_MERCHANT_ID")}:${required("VIVA_API_KEY")}`).toString("base64")}`;
  }
  private async bearer() {
    const host = this.live
      ? "https://accounts.vivapayments.com"
      : "https://demo-accounts.vivapayments.com";
    const result = await checked(
      await fetch(`${host}/connect/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${required("VIVA_CLIENT_ID")}:${required("VIVA_CLIENT_SECRET")}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      }),
    );
    return z.object({ access_token: z.string() }).parse(result).access_token;
  }
  async create(input: PaymentInput) {
    const bearer = await this.bearer();
    const response = z
      .object({
        orderCode: z
          .union([z.string(), z.number().int().safe()])
          .transform(String),
      })
      .parse(
        await checked(
          await fetch(`${this.api}/checkout/v2/orders`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${bearer}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amount: input.total,
              sourceCode: required("VIVA_SOURCE_CODE"),
              merchantTrns: input.id,
              customerTrns: "FORM AIR order",
              customer: {
                email: input.email,
                fullName: input.name,
                countryCode: "GR",
                requestLang: "el-GR",
              },
              paymentTimeout: 900,
              disableExactAmount: false,
              allowRecurring: false,
            }),
            signal: AbortSignal.timeout(15000),
            cache: "no-store",
          }),
        ),
      );
    return {
      orderCode: response.orderCode,
      url: `${this.legacy}/web/checkout?ref=${response.orderCode}`,
    };
  }
  async verify(transactionId: string) {
    z.uuid().parse(transactionId);
    const bearer = await this.bearer();
    const value = z
      .object({
        orderCode: z
          .union([z.string(), z.number().int().safe()])
          .transform(String),
        amount: z.number(),
        currencyCode: z.union([z.string(), z.number()]).transform(String),
        statusId: z.string(),
      })
      .parse(
        await checked(
          await fetch(`${this.api}/checkout/v2/transactions/${transactionId}`, {
            headers: { Authorization: `Bearer ${bearer}` },
            signal: AbortSignal.timeout(15000),
            cache: "no-store",
          }),
        ),
      );
    return {
      transactionId,
      orderCode: value.orderCode,
      amount: Math.round(value.amount * 100),
      currency: value.currencyCode,
      status: value.statusId,
    };
  }
  async webhookKey() {
    const value = await checked(
      await fetch(`${this.legacy}/api/messages/config/token`, {
        headers: { Authorization: this.basic() },
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      }),
    );
    return z.object({ Key: z.string() }).parse(value);
  }
  async refund(transactionId: string, amount: number) {
    z.uuid().parse(transactionId);
    const value = await checked(
      await fetch(
        `${this.legacy}/api/transactions/${transactionId}/?amount=${amount}&sourceCode=${encodeURIComponent(required("VIVA_SOURCE_CODE"))}`,
        {
          method: "DELETE",
          headers: { Authorization: this.basic() },
          signal: AbortSignal.timeout(15000),
        },
      ),
    );
    const result = z
      .object({
        Success: z.literal(true),
        StatusId: z.literal("F"),
        TransactionId: z.string(),
      })
      .parse(value);
    return result.TransactionId;
  }
}
export class MockPaymentProvider implements PaymentProvider {
  async create(input: PaymentInput) {
    if (!isMock()) throw new AppError("MOCK_DISABLED", 403);
    return {
      orderCode: `test-${input.id}`,
      url: `/el/checkout/test?order=${input.id}`,
    };
  }
  async verify(): Promise<VerifiedPayment> {
    throw new AppError("USE_AUTHORIZED_TEST_PAYMENT", 403);
  }
  async refund(transactionId: string) {
    if (!isMock()) throw new AppError("MOCK_DISABLED", 403);
    return `refund-${transactionId}`;
  }
}
export const paymentProvider = (): PaymentProvider =>
  isMock() ? new MockPaymentProvider() : new VivaProvider();
