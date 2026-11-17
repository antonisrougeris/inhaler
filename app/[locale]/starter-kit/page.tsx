import { getCatalog, getSettings } from "@/lib/catalog";
import { localeOf, t } from "@/lib/brand";
import { KitBuilder } from "@/components/commerce";
import { Eyebrow } from "@/components/ui";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = localeOf((await params).locale),
    products = await getCatalog(),
    s = await getSettings();
  return (
    <section className="page section">
      <Eyebrow>MAKE IT YOURS</Eyebrow>
      <h1>{t(locale, "Το δικό σου kit.", "Your own ritual.")}</h1>
      <p className="lead">
        {t(
          locale,
          "Επίλεξε συσκευή, έκδοση και 2, 3 ή 4 συσκευασίες αρωμάτων.",
          "Choose a device, an edition and 2, 3 or 4 aroma packs.",
        )}
      </p>
      <KitBuilder products={products} locale={locale} mode={s.mode} />
    </section>
  );
}
