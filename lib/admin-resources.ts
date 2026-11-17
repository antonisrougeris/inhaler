import { z } from "zod";
import { db } from "./db";
import { Prisma } from "@/generated/prisma/client";
import { AppError } from "./security";
const text = z.string().trim().max(10000),
  short = text.max(200),
  id = z.string().min(1),
  amount = z.number().int().min(0).max(10000000);
const url = z
  .string()
  .max(2048)
  .refine(
    (v) => v === "" || /^\/art\/[\w.-]+$/.test(v) || /^https:\/\//.test(v),
    "Use HTTPS or a local art path",
  );
export const resourceSchemas = {
  products: z.object({
    slug: short.regex(/^[a-z0-9-]+$/),
    nameEl: short.min(1),
    nameEn: short.min(1),
    descriptionEl: text,
    descriptionEn: text,
    categoryId: id,
    kind: z.enum(["DEVICE", "REFILL", "BUNDLE", "DISPOSABLE"]),
    published: z.boolean(),
    demo: z.boolean(),
    featured: z.boolean(),
    manufacturer: short,
    manufacturerContact: text,
    responsibleOperator: text,
    supplier: short,
    modelNumber: short,
    intendedUse: text,
    instructionsEl: text,
    instructionsEn: text,
    warningsEl: text,
    warningsEn: text,
    modelUrl: url.nullable().optional(),
  }),
  variants: z.object({
    productId: id,
    sku: short.min(1),
    name: short.min(1),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    material: short,
    price: amount,
    vatBps: z.number().int().min(0).max(10000),
    packSize: z.number().int().min(1).max(100),
    adjustableAirflow: z.boolean(),
    confirmedSpecifications: z.boolean(),
    active: z.boolean(),
    flavorId: id.nullable(),
  }),
  flavors: z.object({
    slug: short.regex(/^[a-z0-9-]+$/),
    nameEl: short,
    nameEn: short,
    descriptionEl: text,
    descriptionEn: text,
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    image: url,
    featured: z.boolean(),
  }),
  categories: z.object({
    slug: short.regex(/^[a-z0-9-]+$/),
    nameEl: short,
    nameEn: short,
  }),
  images: z.object({
    productId: id,
    url,
    altEl: short,
    altEn: short,
    position: z.number().int().min(0),
  }),
  bundles: z
    .object({
      bundleId: id,
      componentId: id,
      quantity: z.number().int().min(1).max(50),
    })
    .refine((x) => x.bundleId !== x.componentId),
  coupons: z
    .object({
      code: short.regex(/^[A-Z0-9_-]+$/),
      type: z.enum(["PERCENT", "FIXED"]),
      amount,
      maxUses: z.number().int().min(1),
      minSpend: amount,
      active: z.boolean(),
      expiresAt: z.coerce.date().nullable(),
    })
    .refine((x) => x.type !== "PERCENT" || x.amount <= 10000),
  content: z.object({
    key: short,
    name: short.optional(),
    titleEl: text,
    titleEn: text,
    bodyEl: text,
    bodyEn: text,
    position: z.number().int(),
    published: z.boolean(),
  }),
  compliance: z.object({
    productId: id,
    flavorId: id.nullable(),
    type: z.enum([
      "INHALATION_ASSESSMENT",
      "SDS",
      "REACH",
      "GPSR",
      "LAB_REPORT",
      "INSTRUCTIONS",
    ]),
    documentKey: short.min(1),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
    notes: text,
    reviewAt: z.coerce.date(),
  }),
  batches: z.object({
    variantId: id,
    lot: short.min(1),
    quantity: amount,
    expiresAt: z.coerce.date().nullable(),
  }),
  settings: z.object({
    brandName: short.min(1),
    logoUrl: url,
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    font: z.enum(["sans", "serif"]),
    contactEmail: z.union([z.email(), z.literal("")]),
    domain: z.url(),
    businessInfo: text,
    socialInstagram: z.union([z.url(), z.literal("")]),
    launchDate: z.coerce.date().nullable(),
    showCountdown: z.boolean(),
    doubleOptIn: z.boolean(),
    shippingPrice: amount,
    vatBps: z.number().int().min(0).max(10000),
  }),
};
export type Resource = keyof typeof resourceSchemas;
const delegates = {
  products: db.product,
  variants: db.variant,
  flavors: db.flavor,
  categories: db.category,
  images: db.productImage,
  bundles: db.bundleComponent,
  coupons: db.coupon,
  content: db.content,
  compliance: db.complianceRecord,
  batches: db.batch,
  settings: db.storeSettings,
};
export const readOnlyResources = [
  "orders",
  "inventory",
  "subscribers",
  "feedback",
  "customers",
  "reviews",
  "audit",
  "emails",
] as const;
export async function listResource(resource: string) {
  switch (resource) {
    case "orders":
      return db.order.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
        include: { items: true, payment: true, shipments: true, history: true },
      });
    case "inventory":
      return db.inventory.findMany({ include: { variant: true }, take: 200 });
    case "subscribers":
      return db.subscriber.findMany({
        take: 200,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          status: true,
          source: true,
          consentAt: true,
          confirmedAt: true,
        },
      });
    case "feedback":
      return db.feedback.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
      });
    case "customers":
      return db.user.findMany({
        take: 100,
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          role: true,
        },
      });
    case "reviews":
      return db.review.findMany({ take: 100 });
    case "audit":
      return db.auditLog.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
      });
    case "emails":
      return db.emailJob.findMany({
        take: 100,
        select: {
          id: true,
          subject: true,
          status: true,
          attempts: true,
          createdAt: true,
        },
      });
  }
  if (!(resource in delegates)) throw new AppError("NOT_FOUND", 404);
  // The delegate union is intentionally bridged at this allowlisted boundary.
  const delegate = delegates[resource as Resource] as unknown as {
    findMany: (arg: { take: number }) => Promise<unknown[]>;
  };
  return delegate.findMany({ take: 200 });
}
export async function saveResource(
  resource: string,
  input: unknown,
  actorId: string,
  recordId?: string,
) {
  if (!(resource in resourceSchemas)) throw new AppError("NOT_FOUND", 404);
  const name = resource as Resource;
  const parsed = resourceSchemas[name].parse(input);
  const data = { ...parsed } as Record<string, unknown>;
  delete data.name;
  if (name === "variants") data.name = (parsed as { name: string }).name;
  if (name === "compliance") data.reviewerId = actorId;
  return db.$transaction(async (tx) => {
    const mapping = {
      products: "product",
      variants: "variant",
      flavors: "flavor",
      categories: "category",
      images: "productImage",
      bundles: "bundleComponent",
      coupons: "coupon",
      content: "content",
      compliance: "complianceRecord",
      batches: "batch",
      settings: "storeSettings",
    } as const;
    const delegate = tx[mapping[name]] as unknown as {
      create: (arg: { data: unknown }) => Promise<{ id: string }>;
      update: (arg: {
        where: { id: string };
        data: unknown;
      }) => Promise<{ id: string }>;
    };
    const result = recordId
      ? await delegate.update({ where: { id: recordId }, data })
      : await delegate.create({ data });
    if (name === "variants")
      await tx.inventory.upsert({
        where: { variantId: result.id },
        update: {},
        create: { variantId: result.id },
      });
    if (name === "products")
      await tx.product.update({
        where: { id: result.id },
        data: { complianceStatus: "PENDING" },
      });
    await tx.auditLog.create({
      data: {
        actorId,
        action: recordId ? "UPDATE" : "CREATE",
        entity: name,
        entityId: result.id,
        details: { fields: Object.keys(data) } as Prisma.InputJsonValue,
      },
    });
    return result;
  });
}
export async function deleteResource(
  resource: string,
  id: string,
  actorId: string,
) {
  if (
    ![
      "images",
      "bundles",
      "coupons",
      "content",
      "flavors",
      "categories",
    ].includes(resource)
  )
    throw new AppError("ARCHIVE_INSTEAD", 409);
  const mapping = {
    images: "productImage",
    bundles: "bundleComponent",
    coupons: "coupon",
    content: "content",
    flavors: "flavor",
    categories: "category",
  } as const;
  return db.$transaction(async (tx) => {
    const delegate = tx[
      mapping[resource as keyof typeof mapping]
    ] as unknown as {
      delete: (arg: { where: { id: string } }) => Promise<unknown>;
    };
    await delegate.delete({ where: { id } });
    await tx.auditLog.create({
      data: {
        actorId,
        action: "DELETE",
        entity: resource,
        entityId: id,
        details: {},
      },
    });
  });
}
