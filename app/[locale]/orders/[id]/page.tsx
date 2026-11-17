import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hash } from "@/lib/security";
import { localeOf, t, money } from "@/lib/brand";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: l, id } = await params,
    locale = localeOf(l);
  const order = await db.order.findUnique({
    where: { id },
    include: { items: true, history: true, shipments: true },
  });
  const cart = (await cookies()).get("fa-cart")?.value;
  const session = await auth.api.getSession({ headers: await headers() });
  if (
    !order ||
    !(
      (cart && hash(cart) === order.accessHash) ||
      session?.user.id === order.userId
    )
  )
    notFound();
  return (
    <section className="page section narrow">
      <p className="eyebrow">{order.number}</p>
      <h1>{t(locale, "Η παραγγελία σου.", "Your order.")}</h1>
      <p className="notice">
        {order.test ? "TEST ORDER · " : ""}
        {order.status}
      </p>
      {order.items.map((i) => (
        <article className="order-line" key={i.id}>
          <h3>
            {i.name} × {i.quantity}
          </h3>
          <p>{money(i.unitPrice * i.quantity, locale)}</p>
          <pre>{JSON.stringify(i.configuration, null, 2)}</pre>
        </article>
      ))}
      <h2>{money(order.total, locale)}</h2>
      <p>
        {t(locale, "Περιλαμβάνει ΦΠΑ", "Includes VAT")}{" "}
        {money(order.tax, locale)}
      </p>
      {order.history.map((h) => (
        <p key={h.id} className="caption">
          {h.createdAt.toISOString()} · {h.status}
        </p>
      ))}
    </section>
  );
}
