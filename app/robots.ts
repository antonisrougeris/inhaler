import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow:
        process.env.APP_ENV === "production"
          ? ["/admin", "/api", "/*/account", "/*/checkout", "/*/orders"]
          : ["/"],
    },
    sitemap: `${process.env.APP_URL}/sitemap.xml`,
  };
}
