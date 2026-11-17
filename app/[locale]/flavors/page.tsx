import { getFlavors } from "@/lib/catalog";
import { localeOf, t } from "@/lib/brand";
import { FlavorExperience } from "@/components/interactive";
import { Eyebrow } from "@/components/ui";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = localeOf((await params).locale);
  return (
    <section className="page section">
      <Eyebrow>THE AROMA LIBRARY</Eyebrow>
      <h1>{t(locale, "Ακολούθησε τη νότα σου.", "Follow your note.")}</h1>
      <FlavorExperience flavors={await getFlavors()} locale={locale} />
    </section>
  );
}
