import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
export const dynamic = "force-dynamic";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/el/account");
  }
  const links = [
    "products",
    "variants",
    "categories",
    "flavors",
    "images",
    "bundles",
    "inventory",
    "orders",
    "coupons",
    "content",
    "subscribers",
    "feedback",
    "customers",
    "reviews",
    "compliance",
    "batches",
    "settings",
    "emails",
    "audit",
  ];
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="wordmark" href="/admin">
          FORM AIR<span>STUDIO</span>
        </Link>
        <nav>
          <Link href="/admin">Overview</Link>
          {links.map((key) => (
            <Link key={key} href={`/admin/${key}`}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Link>
          ))}
          <Link href="/el">View storefront ↗</Link>
        </nav>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
