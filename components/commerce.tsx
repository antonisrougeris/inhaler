"use client";
import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Heart,
  Minus,
  Plus,
  Trash2,
  Check,
  Package,
} from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog";
import { money, t, localized, type Locale } from "@/lib/brand";
import { api } from "./forms";
import { ProductViewer } from "./viewer";
type Item = {
  id: string;
  variantId: string;
  quantity: number;
  configuration: { refillVariantIds: string[] };
};
function errorMessage(error: unknown, locale: Locale) {
  const key = error instanceof Error ? error.message : "";
  const messages: Record<string, [string, string]> = {
    PRELAUNCH_PURCHASES_DISABLED: [
      "Οι αγορές δεν έχουν ανοίξει.",
      "Purchases are not open.",
    ],
    UNAUTHORIZED: ["Συνδέσου στον λογαριασμό σου.", "Please sign in first."],
    OUT_OF_STOCK: ["Το απόθεμα δεν επαρκεί.", "There is not enough stock."],
    INVALID_COUPON: ["Ο κωδικός δεν είναι έγκυρος.", "This code is not valid."],
    PAYMENT_REQUIRES_RECONCILIATION: [
      "Η πληρωμή χρειάζεται έλεγχο. Μην ξαναπληρώσεις.",
      "Payment needs review. Do not pay again.",
    ],
  };
  return (
    messages[key]?.[locale === "el" ? 0 : 1] ??
    t(
      locale,
      "Η ενέργεια δεν ολοκληρώθηκε. Δοκίμασε ξανά αργότερα.",
      "The action could not be completed. Please try again later.",
    )
  );
}
export function ProductDetail({
  product,
  locale,
  mode,
  initialFlavor,
}: {
  product: CatalogProduct;
  locale: Locale;
  mode: string;
  initialFlavor?: string;
}) {
  const [id, setId] = useState(
      product.variants.find((x) => x.flavor?.slug === initialFlavor)?.id ??
        product.variants[0]?.id,
    ),
    [quantity, setQuantity] = useState(1),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const v = product.variants.find((x) => x.id === id);
  if (!v) return <p>Product configuration unavailable.</p>;
  const preview = mode === "PRELAUNCH";
  return (
    <div className="product-detail">
      <ProductViewer
        image={product.images[0]?.url ?? "/art/device.svg"}
        color={v.color}
        locale={locale}
        modelUrl={product.modelUrl}
      />
      <div className="product-description">
        <p className="eyebrow">
          {localized(product.category, locale)} /{" "}
          {product.demo ? "CONCEPT" : "COLLECTION"}
        </p>
        <h1>{localized(product, locale)}</h1>
        <p className="lead">
          {locale === "el" ? product.descriptionEl : product.descriptionEn}
        </p>
        <div className="price-row">
          <strong>
            {preview
              ? t(locale, "Η τιμή θα ανακοινωθεί", "Price to be announced")
              : money(v.price, locale)}
          </strong>
          <span>{!preview && t(locale, "με ΦΠΑ", "incl. VAT")}</span>
        </div>
        {mode === "TEST" && (
          <p className="notice">
            TEST STORE ·{" "}
            {t(
              locale,
              "Δοκιμαστική τιμή — χωρίς πραγματική αγορά",
              "Test price — no real purchase",
            )}
          </p>
        )}
        <fieldset>
          <legend>{t(locale, "Επίλεξε έκδοση", "Choose an edition")}</legend>
          <div className="variant-options">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setId(variant.id)}
                aria-pressed={variant.id === id}
              >
                <i style={{ background: variant.color }} />
                {variant.name}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="purchase-row">
          {!preview && (
            <div className="quantity">
              <button
                aria-label="Decrease quantity"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus size={14} />
              </button>
              <span>{quantity}</span>
              <button
                aria-label="Increase quantity"
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
              >
                <Plus size={14} />
              </button>
            </div>
          )}
          {preview ? (
            <Link href={`/${locale}/waitlist`} className="button">
              {t(locale, "Ενημέρωσέ με στην έναρξη", "Notify me at launch")}
              <ArrowUpRight size={17} />
            </Link>
          ) : (
            <button
              className="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api("/api/cart", {
                    variantId: id,
                    quantity,
                    configuration: { refillVariantIds: [] },
                  });
                  setMessage(
                    t(locale, "Προστέθηκε στο καλάθι.", "Added to your bag."),
                  );
                } catch (e) {
                  setMessage(errorMessage(e, locale));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t(locale, "Προσθήκη στο καλάθι", "Add to bag")}
              <Plus size={17} />
            </button>
          )}
          <button
            className="wish"
            aria-label="Save to wishlist"
            onClick={async () => {
              try {
                const result = await api("/api/wishlist", {
                  productId: product.id,
                });
                setMessage(
                  result.saved
                    ? t(locale, "Αποθηκεύτηκε.", "Saved.")
                    : t(locale, "Αφαιρέθηκε.", "Removed."),
                );
              } catch (e) {
                setMessage(errorMessage(e, locale));
              }
            }}
          >
            <Heart size={19} />
          </button>
        </div>
        <p role="status">{message}</p>
        <p className="caption">
          {preview
            ? t(
                locale,
                "Προεπισκόπηση συλλογής. Οι παραγγελίες δεν είναι διαθέσιμες.",
                "Collection preview. Orders are not available.",
              )
            : t(
                locale,
                "Το απόθεμα επιβεβαιώνεται στο checkout.",
                "Stock is confirmed at checkout.",
              )}
        </p>
        <details open>
          <summary>
            {t(locale, "Οι λεπτομέρειες", "The details")}
            <Plus size={16} />
          </summary>
          <dl>
            <div>
              <dt>SKU</dt>
              <dd>{v.sku}</dd>
            </div>
            <div>
              <dt>{t(locale, "Συσκευασία", "Pack size")}</dt>
              <dd>{v.packSize}</dd>
            </div>
            <div>
              <dt>{t(locale, "Προδιαγραφές", "Specifications")}</dt>
              <dd>
                {v.confirmedSpecifications
                  ? v.material
                  : t(locale, "Υπό επιβεβαίωση", "Pending confirmation")}
              </dd>
            </div>
          </dl>
        </details>
        <details>
          <summary>
            {t(locale, "Χρήση & ασφάλεια", "Use & safety")}
            <Plus size={16} />
          </summary>
          <p>
            {(locale === "el"
              ? product.instructionsEl
              : product.instructionsEn) ||
              t(
                locale,
                "Οι οδηγίες του κατασκευαστή θα δημοσιευτούν πριν τη διάθεση.",
                "Manufacturer instructions will be published before sale.",
              )}
          </p>
          <p>
            {(locale === "el" ? product.warningsEl : product.warningsEn) ||
              t(
                locale,
                "Χωρίς νικοτίνη δεν σημαίνει χωρίς κίνδυνο. Η ασφάλεια εισπνοής απαιτεί αξιολόγηση.",
                "Nicotine-free does not mean risk-free. Inhalation safety requires assessment.",
              )}
          </p>
          {product.manufacturer && (
            <p>
              {product.manufacturer} · {product.manufacturerContact} ·{" "}
              {product.responsibleOperator}
            </p>
          )}
        </details>
        <details>
          <summary>
            {t(locale, "Αποστολές & επιστροφές", "Shipping & returns")}
            <Plus size={16} />
          </summary>
          <Link href={`/${locale}/shipping`}>
            {t(
              locale,
              "Δες τις πληροφορίες αποστολής",
              "View shipping information",
            )}
          </Link>
        </details>
      </div>
    </div>
  );
}
export function KitBuilder({
  products,
  locale,
  mode,
}: {
  products: CatalogProduct[];
  locale: Locale;
  mode: string;
}) {
  const devices = products.filter((x) => x.kind === "DEVICE");
  const refills = products
    .filter((x) => x.kind === "REFILL")
    .flatMap((x) => x.variants);
  const [deviceId, setDeviceId] = useState(devices[0]?.variants[0]?.id),
    [packs, setPacks] = useState(2),
    [flavors, setFlavors] = useState<string[]>(
      [refills[0]?.id, refills[1]?.id].filter(Boolean),
    ),
    [message, setMessage] = useState("");
  const device = devices
    .flatMap((x) => x.variants)
    .find((x) => x.id === deviceId);
  const total =
    (device?.price ?? 0) +
    flavors
      .slice(0, packs)
      .reduce((a, id) => a + (refills.find((x) => x.id === id)?.price ?? 0), 0);
  return (
    <div className="kit-builder">
      <div className="kit-preview">
        <img src="/art/kit.svg" alt="Illustrative starter kit" />
        <span className="caption">
          {t(
            locale,
            "Ενδεικτική παρουσίαση περιεχομένων",
            "Illustrative presentation of contents",
          )}
        </span>
      </div>
      <div>
        <div className="builder-step">
          <span>01</span>
          <h3>{t(locale, "Η βάση σου.", "Your foundation.")}</h3>
          <label>
            {t(locale, "Μοντέλο & έκδοση", "Model & edition")}
            <select
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
            >
              {devices.map((p) => (
                <optgroup key={p.id} label={localized(p, locale)}>
                  {p.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        </div>
        <div className="builder-step">
          <span>02</span>
          <h3>
            {t(locale, "Οι αρωματικές σου νότες.", "Your aromatic notes.")}
          </h3>
          <div className="variant-options">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                aria-pressed={packs === n}
                onClick={() => {
                  setPacks(n);
                  setFlavors(
                    Array.from(
                      { length: n },
                      (_, i) => flavors[i] ?? refills[i % refills.length]?.id,
                    ),
                  );
                }}
              >
                {n} {t(locale, "συσκευασίες", "packs")}
              </button>
            ))}
          </div>
          {Array.from({ length: packs }, (_, i) => (
            <label key={i}>
              {t(locale, "Συσκευασία", "Pack")} {i + 1}
              <select
                value={flavors[i]}
                onChange={(e) =>
                  setFlavors((f) =>
                    f.map((v, j) => (j === i ? e.target.value : v)),
                  )
                }
              >
                {refills.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.flavor ? localized(v.flavor, locale) : v.name} ·{" "}
                    {v.packSize} cores
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <div className="kit-summary">
          <Package size={20} />
          <p>
            1 × {device?.name}
            <br />
            {flavors.slice(0, packs).map((id, i) => (
              <span key={i}>
                {refills.find((v) => v.id === id)?.name} · 1 pack
                <br />
              </span>
            ))}
          </p>
          <strong>
            {mode === "PRELAUNCH"
              ? t(locale, "Σύντομα", "Coming soon")
              : money(total, locale)}
          </strong>
        </div>
        {mode === "PRELAUNCH" ? (
          <Link className="button" href={`/${locale}/waitlist`}>
            {t(locale, "Ενημέρωσέ με", "Keep me in the loop")}
            <ArrowUpRight size={18} />
          </Link>
        ) : (
          <button
            className="button"
            onClick={async () => {
              try {
                await api("/api/cart", {
                  variantId: deviceId,
                  quantity: 1,
                  configuration: { refillVariantIds: flavors.slice(0, packs) },
                });
                setMessage(
                  t(locale, "Το kit προστέθηκε.", "Your kit was added."),
                );
              } catch (e) {
                setMessage(errorMessage(e, locale));
              }
            }}
          >
            {t(locale, "Πρόσθεσε το kit", "Add your kit")}
            <Plus size={18} />
          </button>
        )}
        <p role="status">{message}</p>
      </div>
    </div>
  );
}
export function CartView({
  products,
  locale,
  mode,
}: {
  products: CatalogProduct[];
  locale: Locale;
  mode: string;
}) {
  const [items, setItems] = useState<Item[]>([]),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    fetch("/api/cart")
      .then((r) => r.json())
      .then((r) => setItems(r.items ?? []))
      .finally(() => setLoaded(true));
  }, []);
  const variants = products.flatMap((p) =>
    p.variants.map((v) => ({ ...v, product: p })),
  );
  let total = 0;
  return (
    <div>
      {mode === "PRELAUNCH" && (
        <p className="notice">
          {t(
            locale,
            "Οι αγορές δεν έχουν ανοίξει. Εξερεύνησε τη συλλογή και μπες στη λίστα.",
            "Purchases are not open. Explore the collection and join the list.",
          )}
        </p>
      )}
      {!loaded ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <ShoppingBagIcon />
          <h2>{t(locale, "Η αρχή είναι εδώ.", "A fresh start.")}</h2>
          <p>{t(locale, "Το καλάθι σου είναι άδειο.", "Your bag is empty.")}</p>
          <Link className="button" href={`/${locale}/shop`}>
            {t(locale, "Δες τη συλλογή", "Explore the collection")}
            <ArrowUpRight size={17} />
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-lines">
            {items.map((item) => {
              const v = variants.find((x) => x.id === item.variantId);
              if (!v) return null;
              const price =
                v.price +
                (item.configuration.refillVariantIds ?? []).reduce(
                  (a, id) =>
                    a + (variants.find((x) => x.id === id)?.price ?? 0),
                  0,
                );
              total += price * item.quantity;
              return (
                <div className="cart-line" key={item.id}>
                  <img
                    src={v.product.images[0]?.url ?? "/art/device.svg"}
                    alt="Product"
                  />
                  <div>
                    <h3>{localized(v.product, locale)}</h3>
                    <p>
                      {v.name} × {item.quantity}
                    </p>
                    {item.configuration.refillVariantIds?.map((id, i) => (
                      <span className="caption" key={i}>
                        {variants.find((x) => x.id === id)?.name} ·{" "}
                      </span>
                    ))}
                  </div>
                  <strong>{money(price * item.quantity, locale)}</strong>
                  <button
                    aria-label="Remove item"
                    onClick={async () => {
                      await api(`/api/cart?id=${item.id}`, undefined, "DELETE");
                      setItems(items.filter((x) => x.id !== item.id));
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="cart-total">
            <span>{t(locale, "Υποσύνολο με ΦΠΑ", "Subtotal incl. VAT")}</span>
            <strong>{money(total, locale)}</strong>
          </div>
          {mode !== "PRELAUNCH" && (
            <Link className="button" href={`/${locale}/checkout`}>
              Checkout
              <ArrowUpRight size={17} />
            </Link>
          )}
        </>
      )}
    </div>
  );
}
function ShoppingBagIcon() {
  return <Package size={40} strokeWidth={1} />;
}
export function CheckoutForm({
  locale,
  shipping,
}: {
  locale: Locale;
  shipping: number;
}) {
  const [lockers, setLockers] = useState<
      { id: string; name: string; addressLine1: string }[]
    >([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [key] = useState(() => crypto.randomUUID());
  const [coupon, setCoupon] = useState("");
  const [quote, setQuote] = useState<{
    lines: { name: string; quantity: number; unitPrice: number }[];
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
  } | null>(null);
  const [applied, setApplied] = useState("");
  const refreshQuote = async (value: string) => {
    try {
      const q = await api("/api/checkout/quote", { coupon: value });
      setQuote(q);
      setApplied(value);
      setMessage("");
    } catch (e) {
      setQuote(null);
      setMessage(errorMessage(e, locale));
    }
  };
  useEffect(() => {
    api("/api/checkout/quote", { coupon: "" })
      .then(setQuote)
      .catch((e) => setMessage(errorMessage(e, locale)));
  }, [locale]);
  useEffect(() => {
    fetch("/api/lockers")
      .then((r) => r.json())
      .then((r) => (Array.isArray(r) ? setLockers(r) : setMessage(r.error)))
      .catch(() => setMessage("Shipping unavailable"));
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      const result = await api("/api/checkout", {
        ...Object.fromEntries(form),
        terms: form.get("terms") === "on",
        idempotencyKey: key,
      });
      if (result.url) window.location.assign(result.url);
      else
        setMessage(
          t(
            locale,
            "Η πληρωμή ετοιμάζεται. Δοκίμασε το ίδιο κουμπί ξανά.",
            "Payment is preparing. Try this button again.",
          ),
        );
    } catch (e) {
      setMessage(errorMessage(e, locale));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="stack-form checkout-form" onSubmit={submit}>
      <h2>{t(locale, "Τα στοιχεία σου", "Your details")}</h2>
      {[
        ["email", "Email", "email"],
        ["name", t(locale, "Ονοματεπώνυμο", "Full name"), "text"],
        ["phone", t(locale, "Τηλέφωνο", "Phone"), "tel"],
        ["street", t(locale, "Διεύθυνση", "Address"), "text"],
        ["city", t(locale, "Πόλη", "City"), "text"],
        [
          "postalCode",
          t(locale, "Ταχυδρομικός κώδικας", "Postal code"),
          "text",
        ],
      ].map(([name, label, type]) => (
        <label key={name}>
          {label}
          <input
            name={name}
            type={type}
            required
            pattern={name === "postalCode" ? "[0-9]{5}" : undefined}
          />
        </label>
      ))}
      <label>
        BOX NOW · {money(shipping, locale)}
        <select name="lockerId" required defaultValue="">
          <option value="">
            {t(locale, "Επίλεξε locker", "Select a locker")}
          </option>
          {lockers.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} — {l.addressLine1}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t(locale, "Κωδικός έκπτωσης", "Discount code")}
        <input
          name="coupon"
          value={coupon}
          onChange={(e) => setCoupon(e.target.value)}
        />
      </label>
      <button
        type="button"
        className="text-link"
        onClick={() => refreshQuote(coupon)}
      >
        {t(locale, "Εφαρμογή κωδικού", "Apply code")}
      </button>
      {quote && (
        <div className="checkout-summary">
          <h3>{t(locale, "Η παραγγελία σου", "Your order")}</h3>
          {quote.lines.map((line, i) => (
            <p key={i}>
              {line.name} × {line.quantity}{" "}
              <strong>{money(line.unitPrice * line.quantity, locale)}</strong>
            </p>
          ))}
          <dl>
            <div>
              <dt>{t(locale, "Υποσύνολο", "Subtotal")}</dt>
              <dd>{money(quote.subtotal, locale)}</dd>
            </div>
            <div>
              <dt>{t(locale, "Έκπτωση", "Discount")}</dt>
              <dd>−{money(quote.discount, locale)}</dd>
            </div>
            <div>
              <dt>{t(locale, "Μεταφορικά", "Shipping")}</dt>
              <dd>{money(quote.shipping, locale)}</dd>
            </div>
            <div>
              <dt>{t(locale, "ΦΠΑ (περιλαμβάνεται)", "VAT (included)")}</dt>
              <dd>{money(quote.tax, locale)}</dd>
            </div>
            <div>
              <dt>{t(locale, "Σύνολο", "Total")}</dt>
              <dd>
                <strong>{money(quote.total, locale)}</strong>
              </dd>
            </div>
          </dl>
        </div>
      )}
      <p className="caption">
        {t(
          locale,
          "Το τελικό σύνολο και η έκπτωση υπολογίζονται στον server και εμφανίζονται πριν την πληρωμή.",
          "The final total and discount are calculated on the server and displayed before payment.",
        )}
      </p>
      <label className="checkbox">
        <input type="checkbox" name="terms" required />
        {t(locale, "Αποδέχομαι τους", "I accept the")}{" "}
        <Link href={`/${locale}/terms`}>{t(locale, "όρους", "terms")}</Link>
      </label>
      <button
        className="button"
        disabled={busy || !lockers.length || !quote || coupon !== applied}
      >
        {busy
          ? t(locale, "Προετοιμασία…", "Preparing…")
          : t(locale, "Συνέχεια στην πληρωμή", "Continue to payment")}
        <ArrowUpRight size={18} />
      </button>
      <p role="alert">{message}</p>
    </form>
  );
}
export function TestPayment({ id, locale }: { id: string; locale: Locale }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  return (
    <div>
      <p className="notice">
        TEST PAYMENT · No card or real money is involved.
      </p>
      <div className="button-row">
        {(["pay", "cancel"] as const).map((action) => (
          <button
            className="button"
            key={action}
            onClick={async () => {
              try {
                await api("/api/payments/test", { id, action });
                router.push(`/${locale}/orders/${id}`);
              } catch (e) {
                setMessage(errorMessage(e, locale));
              }
            }}
          >
            {action === "pay"
              ? t(locale, "Προσομοίωση επιτυχίας", "Simulate success")
              : t(locale, "Ακύρωση", "Cancel")}
            <Check size={16} />
          </button>
        ))}
      </div>
      <p role="alert">{message}</p>
    </div>
  );
}
