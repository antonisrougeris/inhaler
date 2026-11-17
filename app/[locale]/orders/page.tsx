import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { localeOf, t, money } from "@/lib/brand";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = localeOf((await params).locale);
  const session = await auth.api.getSession({ headers: await headers() });
  const orders = session
    ? await db.order.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
      })
    : [];
  return (
    <section className="page section narrow">
      <h1>{t(locale, "Οι παραγγελίες σου.", "Your orders.")}</h1>
      {!session ? (
        <Link className="button" href={`/${locale}/account`}>
          {t(locale, "Σύνδεση", "Sign in")}
        </Link>
      ) : orders.length ? (
        orders.map((o) => (
          <Link
            className="order-line"
            key={o.id}
            href={`/${locale}/orders/${o.id}`}
          >
            {o.number} · {o.status} · {money(o.total, locale)} →
          </Link>
        ))
      ) : (
        <p>{t(locale, "Δεν υπάρχουν ακόμα παραγγελίες.", "No orders yet.")}</p>
      )}
    </section>
  );
}
