"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ShoppingBag, UserRound, ArrowUpRight } from "lucide-react";
import { t, type Locale } from "@/lib/brand";
export function Navigation({
  locale,
  brand,
  logo,
  mode,
}: {
  locale: Locale;
  brand: string;
  logo: string;
  mode: string;
}) {
  const [scrolled, setScrolled] = useState(false),
    [count, setCount] = useState(0);
  const path = usePathname();
  const menu = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 40);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  useEffect(() => {
    const update = () =>
      fetch("/api/cart")
        .then((r) => r.json())
        .then((c) =>
          setCount(
            (c.items ?? []).reduce(
              (a: number, x: { quantity: number }) => a + x.quantity,
              0,
            ),
          ),
        )
        .catch(() => {});
    update();
    window.addEventListener("cart-change", update);
    return () => window.removeEventListener("cart-change", update);
  }, []);
  const links = [
    ["shop", t(locale, "Συλλογή", "Collection")],
    ["starter-kit", "Starter kit"],
    ["flavors", t(locale, "Αρώματα", "Aromas")],
    ["about", t(locale, "Η ιστορία μας", "Our story")],
  ];
  const other = locale === "el" ? "en" : "el";
  return (
    <>
      <a href="#main" className="skip">
        Skip to content
      </a>
      <header className={`nav ${scrolled ? "scrolled" : ""}`}>
        <Link
          className="wordmark"
          href={`/${locale}`}
          aria-label={`${brand} home`}
        >
          {logo ? (
            <img src={logo} alt={brand} />
          ) : (
            <>
              {brand}
              <span>®</span>
            </>
          )}
        </Link>
        <nav className="desktop-nav" aria-label="Main">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={`/${locale}/${href}`}
              aria-current={path === `/${locale}/${href}` ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="nav-tools">
          <Link className="lang" href={path.replace(/^\/(el|en)/, `/${other}`)}>
            {other.toUpperCase()}
          </Link>
          <Link
            href={`/${locale}/account`}
            aria-label={t(locale, "Λογαριασμός", "Account")}
          >
            <UserRound size={19} />
          </Link>
          <Link
            className="bag"
            href={`/${locale}/cart`}
            aria-label={t(locale, "Καλάθι", "Cart")}
          >
            <ShoppingBag size={19} />
            <span>{count}</span>
          </Link>
          <button
            className="mobile-menu"
            onClick={() => menu.current?.showModal()}
            aria-label="Menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>
      <dialog ref={menu} className="menu-dialog">
        <button
          className="close"
          onClick={() => menu.current?.close()}
          aria-label="Close"
        >
          <X />
        </button>
        <p className="eyebrow">{brand}</p>
        {links.map(([href, label]) => (
          <Link
            key={href}
            href={`/${locale}/${href}`}
            onClick={() => menu.current?.close()}
          >
            {label}
            <ArrowUpRight />
          </Link>
        ))}
        <Link href={`/${locale}/faq`} onClick={() => menu.current?.close()}>
          FAQ
        </Link>
        <p className="small">
          {mode === "PRELAUNCH"
            ? t(
                locale,
                "Η συλλογή ετοιμάζεται.",
                "The collection is taking shape.",
              )
            : mode}
        </p>
      </dialog>
    </>
  );
}
export function CookieConsent({ locale }: { locale: Locale }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(!localStorage.getItem("fa-consent"));
    const open = () => setShow(true);
    window.addEventListener("cookie-settings", open);
    return () => window.removeEventListener("cookie-settings", open);
  }, []);
  if (!show) return null;
  return (
    <aside className="cookie-notice" aria-label="Cookie preferences">
      <div>
        <strong>
          {t(locale, "Λίγα και απαραίτητα.", "Just the essentials.")}
        </strong>
        <p>
          {t(
            locale,
            "Χρησιμοποιούμε μόνο απαραίτητα cookies για λογαριασμό και καλάθι.",
            "We use essential cookies for your account and bag.",
          )}{" "}
          <Link href={`/${locale}/privacy`}>
            {t(locale, "Περισσότερα", "Read more")}
          </Link>
        </p>
      </div>
      <button
        onClick={() => {
          localStorage.setItem(
            "fa-consent",
            JSON.stringify({
              essential: true,
              analytics: false,
              at: new Date().toISOString(),
            }),
          );
          setShow(false);
        }}
      >
        {t(locale, "Εντάξει", "Got it")} <X size={14} />
      </button>
    </aside>
  );
}
export function CookieSettings({ locale }: { locale: Locale }) {
  return (
    <button
      className="footer-button"
      onClick={() => window.dispatchEvent(new Event("cookie-settings"))}
    >
      {t(locale, "Ρυθμίσεις cookies", "Cookie settings")}
    </button>
  );
}
