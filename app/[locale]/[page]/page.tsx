import { notFound } from "next/navigation";
import { localeOf, t } from "@/lib/brand";
import { getContent, getSettings } from "@/lib/catalog";
import { FAQ } from "@/components/interactive";
import { WaitlistForm, FeedbackForm } from "@/components/forms";
import { Eyebrow } from "@/components/ui";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}) {
  const { locale: l, page } = await params;
  const locale = localeOf(l);
  const content = await getContent();
  if (page === "faq")
    return (
      <section className="page section narrow">
        <h1>{t(locale, "Λίγη σαφήνεια.", "A little clarity.")}</h1>
        <FAQ locale={locale} items={content} />
      </section>
    );
  if (page === "waitlist")
    return (
      <section className="page section narrow">
        <Eyebrow>BE PART OF THE BEGINNING</Eyebrow>
        <h1>
          {t(locale, "Τα πρώτα νέα, πρώτα σε σένα.", "Be the first to know.")}
        </h1>
        <p className="lead">
          {t(
            locale,
            "Θα σε ενημερώσουμε όταν η συλλογή είναι έτοιμη.",
            "We will let you know when the collection is ready.",
          )}
        </p>
        <WaitlistForm locale={locale} source="waitlist-page" />
      </section>
    );
  if (page === "research" || page === "contact")
    return (
      <section className="page section narrow">
        <Eyebrow>LET’S TALK</Eyebrow>
        <h1>
          {page === "research"
            ? t(locale, "Ας το διαμορφώσουμε μαζί.", "Let’s shape it together.")
            : t(locale, "Πες μας τη σκέψη σου.", "What’s on your mind?")}
        </h1>
        <FeedbackForm locale={locale} contact={page === "contact"} />
      </section>
    );
  const item = content.find((x) => x.key === page);
  if (!item) notFound();
  const settings = await getSettings();
  return (
    <section
      className={`page section ${page === "about" ? "about-page" : "narrow"}`}
    >
      <Eyebrow>{settings.brandName}</Eyebrow>
      <h1>{locale === "el" ? item.titleEl : item.titleEn}</h1>
      {page === "about" && (
        <div className="about-art">
          <img src="/art/device.svg" alt="Form study" />
        </div>
      )}
      <p className="prose">{locale === "el" ? item.bodyEl : item.bodyEn}</p>
      {settings.contactEmail && (
        <a className="text-link" href={`mailto:${settings.contactEmail}`}>
          {settings.contactEmail}
        </a>
      )}
    </section>
  );
}
