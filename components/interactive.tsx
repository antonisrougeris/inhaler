"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Wind, Plus } from "lucide-react";
import { t, localized, type Locale } from "@/lib/brand";
import type { Flavor, Content } from "@/generated/prisma/client";
export function Airflow({ locale }: { locale: Locale }) {
  const [air, setAir] = useState(45);
  return (
    <div className="airflow">
      <div
        className="airflow-visual"
        style={{ "--air": air + "%" } as React.CSSProperties}
      >
        <div className="air-ring">
          <Wind size={48} strokeWidth={0.8} />
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <i
            key={i}
            style={{ top: `${30 + i * 10}%`, width: `${25 + air * 0.45}%` }}
          />
        ))}
      </div>
      <label htmlFor="airflow">
        {t(locale, "Δοκίμασε την ιδέα", "Explore the idea")}
        <span>{air}%</span>
      </label>
      <input
        id="airflow"
        aria-label={t(locale, "Ενδεικτική ροή αέρα", "Illustrative airflow")}
        type="range"
        min="10"
        max="100"
        value={air}
        onChange={(e) => setAir(Number(e.target.value))}
      />
      <div className="range-labels">
        <span>{t(locale, "Περιορισμένη", "Restricted")}</span>
        <span>{t(locale, "Ανοιχτή", "Open")}</span>
      </div>
      <p className="caption">
        {t(
          locale,
          "Ενδεικτική αλληλεπίδραση. Δεν αποτελεί προδιαγραφή του τελικού προϊόντος.",
          "Illustrative interaction. Not a specification of the final product.",
        )}
      </p>
    </div>
  );
}
export function FlavorExperience({
  flavors,
  locale,
}: {
  flavors: Flavor[];
  locale: Locale;
}) {
  const [selected, setSelected] = useState(flavors[0]?.id);
  const flavor = flavors.find((x) => x.id === selected) ?? flavors[0];
  if (!flavor) return null;
  return (
    <div className="flavor-experience">
      <div
        className="flavor-stage"
        style={{ background: flavor.color }}
        key={flavor.id}
      >
        <span className="eyebrow">
          AROMA STUDY / {String(flavors.indexOf(flavor) + 1).padStart(2, "0")}
        </span>
        <img
          src={flavor.image}
          alt={t(locale, "Αρωματική έμπνευση", "Aroma inspiration")}
          loading="lazy"
        />
        <span className="flavor-watermark">{flavor.nameEn}</span>
      </div>
      <div className="flavor-copy">
        <span className="eyebrow">FIND YOUR NOTE</span>
        <h3>{localized(flavor, locale)}</h3>
        <p>{locale === "el" ? flavor.descriptionEl : flavor.descriptionEn}</p>
        <div className="flavor-pills">
          {flavors.map((f) => (
            <button
              key={f.id}
              aria-pressed={f.id === selected}
              onClick={() => setSelected(f.id)}
            >
              <i style={{ background: f.color }} />
              {localized(f, locale)}
            </button>
          ))}
        </div>
        <p className="caption">
          {t(
            locale,
            "Αρωματικές κατευθύνσεις υπό ανάπτυξη. Δεν είναι διαθέσιμες για αγορά.",
            "Aromatic directions in development. Not available to purchase.",
          )}
        </p>
        <Link
          className="text-link"
          href={`/${locale}/shop/aroma-cores?flavor=${flavor.slug}`}
        >
          {t(locale, "Δες τους αρωματικούς πυρήνες", "Explore aroma cores")}
          <ArrowUpRight size={16} />
        </Link>
      </div>
    </div>
  );
}
export function FAQ({ items, locale }: { items: Content[]; locale: Locale }) {
  return (
    <div className="faq-list">
      {items
        .filter((x) => x.key.startsWith("faq-"))
        .map((x, i) => (
          <details key={x.id}>
            <summary>
              <span className="muted">{String(i + 1).padStart(2, "0")}</span>
              {locale === "el" ? x.titleEl : x.titleEn}
              <Plus size={18} />
            </summary>
            <p>{locale === "el" ? x.bodyEl : x.bodyEn}</p>
          </details>
        ))}
    </div>
  );
}
