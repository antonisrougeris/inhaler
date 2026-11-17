import Link from "next/link";
import { getSettings } from "@/lib/catalog";
import { localeOf, t } from "@/lib/brand";
import { CheckoutForm } from "@/components/commerce";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = localeOf((await params).locale),
    s = await getSettings();
  return (
    <section className="page section narrow">
      <h1>Checkout.</h1>
      {s.mode === "PRELAUNCH" ? (
        <div className="empty-state">
          <p>
            {t(
              locale,
              "Οι αγορές δεν είναι διαθέσιμες ακόμα.",
              "Purchases are not available yet.",
            )}
          </p>
          <Link className="button" href={`/${locale}/waitlist`}>
            {t(locale, "Μπες στη λίστα", "Join the list")} ↗
          </Link>
        </div>
      ) : (
        <CheckoutForm locale={locale} shipping={s.shippingPrice} />
      )}
    </section>
  );
}
