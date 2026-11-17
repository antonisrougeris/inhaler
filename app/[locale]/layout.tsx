import Link from "next/link";
import { notFound } from "next/navigation";
import { Navigation, CookieConsent, CookieSettings } from "@/components/shell";
import { MotionSystem } from "@/components/motion";
import { getSettings } from "@/lib/catalog";
import { localeOf, t } from "@/lib/brand";
export const dynamic = "force-dynamic";
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: l } = await params;
  if (!["el", "en"].includes(l)) notFound();
  const locale = localeOf(l);
  const s = await getSettings();
  return (
    <div
      lang={locale}
      style={
        {
          "--accent": s.accent,
          "--body-font":
            s.font === "serif"
              ? "Georgia, serif"
              : "Arial, Helvetica, sans-serif",
        } as React.CSSProperties
      }
    >
      <Navigation
        locale={locale}
        brand={s.brandName}
        logo={s.logoUrl}
        mode={s.mode}
      />
      <main id="main">
        {s.mode === "TEST" && (
          <div className="test-banner">
            TEST STORE · No real purchases or deliveries
          </div>
        )}
        {children}
      </main>
      <footer>
        <div className="footer-top">
          <Link className="wordmark" href={`/${locale}`}>
            {s.brandName}
            <span>®</span>
          </Link>
          <p>
            {t(
              locale,
              "Μια διαφορετική προσέγγιση.",
              "A different kind of ritual.",
            )}
            <br />
            <span className="muted">DESIGNED TO BE YOURS.</span>
          </p>
          <div>
            <Link href={`/${locale}/shop`}>
              {t(locale, "Συλλογή", "Collection")}
            </Link>
            <Link href={`/${locale}/about`}>
              {t(locale, "Η ιστορία μας", "Our story")}
            </Link>
            <Link href={`/${locale}/faq`}>FAQ</Link>
            <Link href={`/${locale}/contact`}>
              {t(locale, "Επικοινωνία", "Contact")}
            </Link>
          </div>
          <div>
            <Link href={`/${locale}/shipping`}>
              {t(locale, "Αποστολές & επιστροφές", "Shipping & returns")}
            </Link>
            <Link href={`/${locale}/privacy`}>
              {t(locale, "Απόρρητο", "Privacy")}
            </Link>
            <Link href={`/${locale}/terms`}>{t(locale, "Όροι", "Terms")}</Link>
            <CookieSettings locale={locale} />
            {s.socialInstagram && (
              <a href={s.socialInstagram} rel="noreferrer">
                Instagram ↗
              </a>
            )}
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {s.brandName}
          </span>
          <span>
            {s.businessInfo ||
              t(
                locale,
                "Συλλογή υπό ανάπτυξη · Προσωρινή επωνυμία",
                "Collection in development · Working brand name",
              )}
          </span>
          <Link href={`/${locale}/waitlist`}>
            {t(locale, "Γίνε μέρος της αρχής", "Be part of the beginning")} ↗
          </Link>
        </div>
      </footer>
      <CookieConsent locale={locale} />
      <MotionSystem />
    </div>
  );
}
