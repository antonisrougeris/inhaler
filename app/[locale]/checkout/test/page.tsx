import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { hash } from "@/lib/security";
import { isMock } from "@/lib/integrations/payments";
import { localeOf, money } from "@/lib/brand";
import { TestPayment } from "@/components/commerce";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  if (!isMock()) notFound();
  const locale = localeOf((await params).locale);
  const id = (await searchParams).order;
  const order = id
    ? await db.order.findUnique({ where: { id }, include: { items: true } })
    : null;
  const cookie = (await cookies()).get("fa-cart")?.value;
  if (!order || !cookie || hash(cookie) !== order.accessHash) notFound();
  return (
    <section className="page section narrow">
      <h1>Test checkout.</h1>
      {order.items.map((i) => (
        <p key={i.id}>
          {i.name} × {i.quantity} — {money(i.unitPrice * i.quantity, locale)}
        </p>
      ))}
      <dl>
        <div>
          <dt>Subtotal</dt>
          <dd>{money(order.subtotal, locale)}</dd>
        </div>
        <div>
          <dt>Discount</dt>
          <dd>−{money(order.discount, locale)}</dd>
        </div>
        <div>
          <dt>Shipping</dt>
          <dd>{money(order.shipping, locale)}</dd>
        </div>
        <div>
          <dt>Included VAT</dt>
          <dd>{money(order.tax, locale)}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{money(order.total, locale)}</dd>
        </div>
      </dl>
      <TestPayment id={order.id} locale={locale} />
    </section>
  );
}
