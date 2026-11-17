import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCatalog } from "@/lib/catalog";
import { localeOf, t } from "@/lib/brand";
import { ProductCard } from "@/components/product-card";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = localeOf((await params).locale);
  const session = await auth.api.getSession({ headers: await headers() });
  const saved = session
    ? await db.wishlist.findMany({ where: { userId: session.user.id } })
    : [];
  const products = (await getCatalog()).filter((p) =>
    saved.some((x) => x.productId === p.id),
  );
  return (
    <section className="page section">
      <h1>{t(locale, "Τα αγαπημένα σου.", "Your favourites.")}</h1>
      {!session ? (
        <Link className="button" href={`/${locale}/account`}>
          {t(locale, "Σύνδεση", "Sign in")}
        </Link>
      ) : products.length ? (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} locale={locale} />
          ))}
        </div>
      ) : (
        <p>
          {t(
            locale,
            "Αποθήκευσε προϊόντα με το σύμβολο της καρδιάς.",
            "Save products using the heart icon.",
          )}
        </p>
      )}
    </section>
  );
}
