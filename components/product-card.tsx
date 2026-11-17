import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { localized, t, type Locale } from "@/lib/brand";
import type { CatalogProduct } from "@/lib/catalog";
export function ProductCard({
  product,
  locale,
}: {
  product: CatalogProduct;
  locale: Locale;
}) {
  return (
    <article className="product-card">
      <Link
        href={`/${locale}/shop/${product.slug}`}
        className={`product-art ${product.kind.toLowerCase()}`}
      >
        <span className="product-tag">
          {product.demo ? "CONCEPT / 01" : localized(product.category, locale)}
        </span>
        <img
          src={product.images[0]?.url ?? "/art/device.svg"}
          alt={
            locale === "el"
              ? product.images[0]?.altEl
              : product.images[0]?.altEn
          }
          loading="lazy"
        />
        <span className="circle-arrow">
          <ArrowUpRight size={20} />
        </span>
      </Link>
      <div className="product-info">
        <div>
          <h3>
            <Link href={`/${locale}/shop/${product.slug}`}>
              {localized(product, locale)}
            </Link>
          </h3>
          <p>{localized(product.category, locale)}</p>
        </div>
        <span>{t(locale, "Προεπισκόπηση", "Preview")}</span>
      </div>
      <div className="swatches" aria-label={t(locale, "Χρώματα", "Colors")}>
        {product.variants.slice(0, 5).map((v) => (
          <span key={v.id} style={{ background: v.color }} title={v.name} />
        ))}
      </div>
    </article>
  );
}
