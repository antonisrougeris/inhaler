import Link from "next/link";
import { db } from "@/lib/db";
import { money } from "@/lib/brand";
export default async function Page() {
  const [orders, subscribers, products, settings, paid, inventory] =
    await Promise.all([
      db.order.count(),
      db.subscriber.count({ where: { status: "CONFIRMED" } }),
      db.product.count(),
      db.storeSettings.findUniqueOrThrow({ where: { id: "store" } }),
      db.order.aggregate({
        where: { status: { in: ["PAID", "SHIPPED"] }, test: false },
        _sum: { total: true },
      }),
      db.inventory.findMany({ include: { variant: true } }),
    ]);
  return (
    <>
      <p className="eyebrow">YOUR BRAND, IN FOCUS</p>
      <h1 style={{ marginTop: 20 }}>The studio.</h1>
      <p className="notice">
        Store mode: {settings.mode}. Concept products are blocked from live
        purchases.
      </p>
      <div className="admin-metrics">
        {[
          ["Orders", orders],
          ["Confirmed subscribers", subscribers],
          ["Products", products],
          ["Live revenue", money(paid._sum.total ?? 0)],
        ].map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <h3>Low stock</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>On hand</th>
              <th>Reserved</th>
              <th>Available</th>
            </tr>
          </thead>
          <tbody>
            {inventory
              .filter((x) => x.onHand - x.reserved <= x.lowStock)
              .map((x) => (
                <tr key={x.variantId}>
                  <td>{x.variant.sku}</td>
                  <td>{x.onHand}</td>
                  <td>{x.reserved}</td>
                  <td>{x.onHand - x.reserved}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <div className="button-row">
        <Link className="button" href="/admin/settings">
          Brand & settings →
        </Link>
        <Link className="button" href="/admin/orders">
          Manage orders →
        </Link>
        <Link className="button" href="/admin/subscribers">
          Launch audience →
        </Link>
      </div>
    </>
  );
}
