import { z } from "zod";
import { AppError } from "../security";
export type Locker = {
  id: string;
  name: string;
  addressLine1: string;
  postalCode: string;
  country: string;
};
export type ShipmentInput = {
  id: string;
  total: number;
  name: string;
  email: string;
  phone: string;
  lockerId: string;
};
export interface ShippingProvider {
  lockers(query: string): Promise<Locker[]>;
  create(
    order: ShipmentInput,
  ): Promise<{ reference: string; parcelId: string }>;
  label(parcelId: string): Promise<ArrayBuffer>;
  track(parcelId: string): Promise<string>;
}
export const mockShipping = () =>
  process.env.SHIPPING_PROVIDER === "mock" &&
  ["development", "test"].includes(process.env.APP_ENV ?? "");
const lockerSchema = z.object({
  id: z.string(),
  name: z.string(),
  addressLine1: z.string(),
  postalCode: z.string(),
  country: z.string(),
});
export class BoxNowProvider implements ShippingProvider {
  private get base() {
    const url = process.env.BOXNOW_BASE_URL;
    if (!url || !/^https:\/\/api(-stage)?\.boxnow\.gr\/api\/v1$/.test(url))
      throw new AppError("SHIPPING_NOT_CONFIGURED", 503);
    return url;
  }
  private async token() {
    if (!process.env.BOXNOW_CLIENT_ID || !process.env.BOXNOW_CLIENT_SECRET)
      throw new AppError("SHIPPING_NOT_CONFIGURED", 503);
    const response = await fetch(`${this.base}/auth-sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: process.env.BOXNOW_CLIENT_ID,
        client_secret: process.env.BOXNOW_CLIENT_SECRET,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new AppError("SHIPPING_AUTH_ERROR", 502);
    return z.object({ access_token: z.string() }).parse(await response.json())
      .access_token;
  }
  private async call(path: string, init: RequestInit = {}) {
    const access = await this.token();
    const response = await fetch(`${this.base}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${access}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new AppError("SHIPPING_PROVIDER_ERROR", 502);
    return response;
  }
  async lockers(query: string) {
    const response = await this.call(
      `/destinations?name=${encodeURIComponent(query)}&locationType=apm`,
    );
    return z
      .object({ data: z.array(lockerSchema) })
      .parse(await response.json())
      .data.filter((x) => x.country === "GR");
  }
  async create(order: ShipmentInput) {
    if (!process.env.BOXNOW_ORIGIN_ID || !process.env.BOXNOW_SENDER_NAME)
      throw new AppError("SHIPPING_ORIGIN_MISSING", 503);
    const response = await this.call("/delivery-requests", {
      method: "POST",
      body: JSON.stringify({
        orderNumber: order.id,
        invoiceValue: (order.total / 100).toFixed(2),
        paymentMode: "prepaid",
        amountToBeCollected: "0.00",
        origin: {
          locationId: process.env.BOXNOW_ORIGIN_ID,
          contactName: process.env.BOXNOW_SENDER_NAME,
          contactEmail: process.env.BOXNOW_SENDER_EMAIL,
          contactNumber: process.env.BOXNOW_SENDER_PHONE,
        },
        destination: {
          locationId: order.lockerId,
          contactName: order.name,
          contactEmail: order.email,
          contactNumber: order.phone,
        },
        items: [
          {
            id: order.id,
            name: "FORM AIR order",
            value: (order.total / 100).toFixed(2),
            compartmentSize: 1,
          },
        ],
      }),
    });
    const result = z
      .object({
        referenceNumber: z.string(),
        parcels: z.array(z.object({ id: z.string() })).min(1),
      })
      .parse(await response.json());
    return {
      reference: result.referenceNumber,
      parcelId: result.parcels[0].id,
    };
  }
  async label(parcelId: string) {
    return (
      await this.call(`/parcels/${encodeURIComponent(parcelId)}/label.pdf`)
    ).arrayBuffer();
  }
  async track(parcelId: string) {
    const result = await (
      await this.call(`/parcels?parcelId=${encodeURIComponent(parcelId)}`)
    ).json();
    const parsed = z
      .object({
        data: z.array(z.object({ id: z.string(), state: z.string() })),
      })
      .parse(result);
    const parcel = parsed.data.find((x) => x.id === parcelId);
    if (!parcel) throw new AppError("PARCEL_NOT_FOUND", 404);
    return parcel.state;
  }
}
export class MockShippingProvider implements ShippingProvider {
  async lockers(query: string) {
    return [
      {
        id: "TEST-ATHENS",
        name: "TEST LOCKER — no delivery",
        addressLine1: "Test address, Athens",
        postalCode: "10551",
        country: "GR",
      },
    ].filter(
      (x) =>
        !query ||
        `${x.name} ${x.postalCode}`.toLowerCase().includes(query.toLowerCase()),
    );
  }
  async create(order: ShipmentInput) {
    return {
      reference: `test-${order.id}`,
      parcelId: `test-parcel-${order.id}`,
    };
  }
  async label(): Promise<ArrayBuffer> {
    throw new AppError("TEST_LABEL_NOT_AVAILABLE", 409);
  }
  async track() {
    return "TEST_CREATED";
  }
}
export const shippingProvider = (): ShippingProvider =>
  mockShipping() ? new MockShippingProvider() : new BoxNowProvider();
