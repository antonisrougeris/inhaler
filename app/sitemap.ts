import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = [
    "",
    "/shop",
    "/starter-kit",
    "/flavors",
    "/about",
    "/faq",
    ...(await getCatalog()).map((p) => "/shop/" + p.slug),
  ];
  return ["el", "en"].flatMap((locale) =>
    paths.map((path) => ({
      url: `${process.env.APP_URL}/${locale}${path}`,
      alternates: {
        languages: {
          el: `${process.env.APP_URL}/el${path}`,
          en: `${process.env.APP_URL}/en${path}`,
        },
      },
    })),
  );
}
