import { cache } from "react";
import { db } from "./db";
export const getSettings = cache(
  async () =>
    await db.storeSettings.findUniqueOrThrow({ where: { id: "store" } }),
);
export const getCatalog = cache(
  async () =>
    await db.product.findMany({
      where: { published: true },
      include: {
        category: true,
        images: { orderBy: { position: "asc" } },
        variants: {
          where: { active: true },
          include: { flavor: true, inventory: true, bundleParts: true },
        },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
    }),
);
export const getFlavors = cache(
  async () =>
    await db.flavor.findMany({
      orderBy: [{ featured: "desc" }, { nameEn: "asc" }],
    }),
);
export const getContent = cache(
  async () =>
    await db.content.findMany({
      where: { published: true },
      orderBy: { position: "asc" },
    }),
);
export type CatalogProduct = Awaited<ReturnType<typeof getCatalog>>[number];
export type CatalogVariant = CatalogProduct["variants"][number];
export type Store = Awaited<ReturnType<typeof getSettings>>;
