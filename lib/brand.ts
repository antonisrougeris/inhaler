export const defaultBrand = {
  name: "FORM AIR",
  accent: "#b66b4b",
  description: "A different kind of ritual.",
};
export type Locale = "el" | "en";
export const localeOf = (value: string): Locale =>
  value === "en" ? "en" : "el";
export const localized = (
  item: { nameEl: string; nameEn: string },
  locale: Locale,
) => (locale === "el" ? item.nameEl : item.nameEn);
export const money = (cents: number, locale: Locale = "el") =>
  new Intl.NumberFormat(locale === "el" ? "el-GR" : "en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
export const t = (locale: Locale, el: string, en: string) =>
  locale === "el" ? el : en;
