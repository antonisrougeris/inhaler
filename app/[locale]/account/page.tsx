import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { localeOf, t } from "@/lib/brand";
import { AccountForm, SignOut } from "@/components/account";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const locale = localeOf((await params).locale);
  const session = await auth.api.getSession({ headers: await headers() });
  return (
    <section className="page section narrow">
      <h1>{t(locale, "Ο λογαριασμός σου.", "Your account.")}</h1>
      {session ? (
        <div className="account-box">
          <h2>{session.user.name}</h2>
          <p>{session.user.email}</p>
          <div className="button-row">
            <Link className="button" href={`/${locale}/orders`}>
              {t(locale, "Παραγγελίες", "Orders")}
            </Link>
            <Link className="button" href={`/${locale}/wishlist`}>
              {t(locale, "Αγαπημένα", "Wishlist")}
            </Link>
            {["ADMIN", "OWNER"].includes(session.user.role) && (
              <Link className="button" href="/admin">
                Admin
              </Link>
            )}
            <SignOut locale={locale} />
          </div>
        </div>
      ) : (
        <AccountForm locale={locale} resetToken={(await searchParams).token} />
      )}
    </section>
  );
}
