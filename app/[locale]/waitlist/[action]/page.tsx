import { notFound } from "next/navigation";
import { localeOf, t } from "@/lib/brand";
import { TokenForm } from "@/components/forms";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; action: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale: l, action } = await params;
  if (action !== "confirm" && action !== "unsubscribe") notFound();
  const locale = localeOf(l);
  return (
    <section className="page section narrow">
      <h1>{t(locale, "Η επιλογή σου.", "Your preference.")}</h1>
      <TokenForm
        locale={locale}
        action={action}
        token={(await searchParams).token ?? ""}
      />
    </section>
  );
}
