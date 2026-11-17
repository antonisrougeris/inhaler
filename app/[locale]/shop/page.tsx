import Link from "next/link";
import { getCatalog } from "@/lib/catalog";
import { t, localeOf } from "@/lib/brand";
import { ProductCard } from "@/components/product-card";
import { Eyebrow } from "@/components/ui";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const locale = localeOf((await params).locale);
  const { category } = await searchParams;
  const products = await getCatalog();
  return (
    <section className="page section">
      <Eyebrow>OBJECTS WITH CHARACTER</Eyebrow>
      <h1>{t(locale, "Η συλλογή.", "The collection.")}</h1>
      <p className="lead">
        {t(
          locale,
          "Γνώρισε τις πρώτες ιδέες. Η τελική συλλογή διαμορφώνεται.",
          "Meet the first concepts. The final collection is taking shape.",
        )}
      </p>
      <div className="filter-tabs">
        {[
          ["", t(locale, "Όλα", "All")],
          ["devices", t(locale, "Συσκευές", "Devices")],
          ["starter-kits", "Starter kits"],
          ["refills", t(locale, "Αρωματικοί πυρήνες", "Aroma cores")],
          ["disposable", t(locale, "Μίας χρήσης", "Disposable")],
        ].map(([key, label]) => (
          <Link
            key={key}
            aria-current={(category ?? "") === key ? "page" : undefined}
            href={`/${locale}/shop${key ? "?category=" + key : ""}`}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="product-grid">
        {products
          .filter((p) => !category || p.category.slug === category)
          .map((p) => (
            <ProductCard key={p.id} product={p} locale={locale} />
          ))}
      </div>
    </section>
  );
}
