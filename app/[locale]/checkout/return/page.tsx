import { localeOf, t } from "@/lib/brand";
import Link from "next/link";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = localeOf((await params).locale);
  return (
    <section className="page section narrow">
      <h1>{t(locale, "Έλεγχος πληρωμής.", "Checking payment.")}</h1>
      <p>
        {t(
          locale,
          "Η επιστροφή από τον πάροχο δεν επιβεβαιώνει την πληρωμή. Θα λάβεις email μόνο μετά τον έλεγχο του server.",
          "Returning from the provider does not confirm payment. An email is sent only after server verification.",
        )}
      </p>
      <Link className="button" href={`/${locale}/orders`}>
        {t(locale, "Οι παραγγελίες μου", "My orders")} →
      </Link>
    </section>
  );
}
