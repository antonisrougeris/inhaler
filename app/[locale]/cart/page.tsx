import { getCatalog, getSettings } from "@/lib/catalog";
import { localeOf, t } from "@/lib/brand";
import { CartView } from "@/components/commerce";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = localeOf((await params).locale);
  return (
    <section className="page section narrow">
      <h1>{t(locale, "Το καλάθι σου.", "Your bag.")}</h1>
      <CartView
        products={await getCatalog()}
        locale={locale}
        mode={(await getSettings()).mode}
      />
    </section>
  );
}
