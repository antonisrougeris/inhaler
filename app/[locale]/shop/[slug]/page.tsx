import { notFound } from "next/navigation";
import { getCatalog, getSettings } from "@/lib/catalog";
import { localeOf, t, localized } from "@/lib/brand";
import { ProductDetail } from "@/components/commerce";
import { ProductCard } from "@/components/product-card";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const p = (await getCatalog()).find((p) => p.slug === slug);
  return { title: p ? localized(p, localeOf(locale)) : "Product" };
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ flavor?: string }>;
}) {
  const { locale: l, slug } = await params;
  const locale = localeOf(l);
  const products = await getCatalog();
  const p = products.find((p) => p.slug === slug);
  if (!p) notFound();
  const s = await getSettings();
  return (
    <section className="page section">
      <ProductDetail
        product={p}
        locale={locale}
        mode={s.mode}
        initialFlavor={(await searchParams).flavor}
      />
      <div className="related">
        <h2>{t(locale, "Συνέχισε την εξερεύνηση.", "Keep exploring.")}</h2>
        <div className="product-grid">
          {products
            .filter((x) => x.id !== p.id)
            .slice(0, 3)
            .map((x) => (
              <ProductCard key={x.id} product={x} locale={locale} />
            ))}
        </div>
      </div>
    </section>
  );
}
