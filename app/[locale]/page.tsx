import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { getCatalog, getContent, getFlavors, getSettings } from "@/lib/catalog";
import { localeOf, t } from "@/lib/brand";
import { ButtonLink, Eyebrow, SectionTitle, TextLink } from "@/components/ui";
import { ProductCard } from "@/components/product-card";
import { Airflow, FlavorExperience, FAQ } from "@/components/interactive";
import { WaitlistForm } from "@/components/forms";
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = localeOf((await params).locale);
  const [products, flavors, content, settings] = await Promise.all([
    getCatalog(),
    getFlavors(),
    getContent(),
    getSettings(),
  ]);
  return (
    <>
      <section className="hero">
        <div className="hero-meta">
          <span>
            {t(
              locale,
              "ΜΙΑ ΝΕΑ ΟΠΤΙΚΗ ΣΤΟ FLAVORED AIR",
              "A NEW PERSPECTIVE ON FLAVORED AIR",
            )}
          </span>
          <span>ATHENS, GREECE / EST. 2026</span>
        </div>
        <div className="hero-copy">
          <Eyebrow>
            {t(
              locale,
              "Η πρώτη συλλογή ετοιμάζεται",
              "The first collection is taking shape",
            )}
          </Eyebrow>
          <h1 data-enter>
            {t(locale, "Μια άλλη", "A different")}
            <br />
            <span>{t(locale, "τελετουργία.", "kind of ritual.")}</span>
          </h1>
          <p data-enter>
            {t(
              locale,
              "Μορφή με χαρακτήρα. Αρώματα με προσωπικότητα. Μια εμπειρία που γίνεται δική σου.",
              "Considered form. Distinctive aromas. An experience to make your own.",
            )}
          </p>
          <div data-enter className="hero-actions">
            <ButtonLink href={`/${locale}/shop`}>
              {t(locale, "Γνώρισε τη συλλογή", "Discover the collection")}
            </ButtonLink>
            <Link href={`/${locale}/waitlist`}>
              {t(locale, "Μπες στη λίστα", "Join the waitlist")} ↗
            </Link>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-orbit" />
          <div className="hero-pedestal" />
          <Image
            className="hero-object"
            src="/art/device.svg"
            width={800}
            height={800}
            priority
            alt={t(
              locale,
              "Ενδεικτικός σχεδιασμός συσκευής σε καρυδιά και μέταλλο",
              "Illustrative walnut and metal device concept",
            )}
          />
          <span className="art-coordinate coordinate-top">01 — FORM STUDY</span>
          <span className="art-coordinate coordinate-bottom">
            WALNUT / BRUSHED METAL
            <br />
            {t(locale, "ΕΝΔΕΙΚΤΙΚΗ ΑΠΕΙΚΟΝΙΣΗ", "ILLUSTRATIVE CONCEPT")}
          </span>
          <div className="material-dot">
            <span />
            {t(locale, "Η ομορφιά στη λεπτομέρεια", "Beauty in the details")}
          </div>
        </div>
        <div className="hero-bottom">
          <a href="#collection">
            <ArrowDown size={16} />
            {t(locale, "Συνέχισε την εξερεύνηση", "Scroll to explore")}
          </a>
          <span>
            {t(
              locale,
              "ΣΧΕΔΙΑΣΤΙΚΗ ΚΑΤΕΥΘΥΝΣΗ: ΧΩΡΙΣ ΝΙΚΟΤΙΝΗ · ΧΩΡΙΣ ΘΕΡΜΑΝΣΗ · ΧΩΡΙΣ ΑΤΜΟ",
              "DESIGN DIRECTION: NO NICOTINE · NO HEAT · NO VAPOR",
            )}
          </span>
        </div>
      </section>
      <section className="intro section">
        <span className="eyebrow">LESS NOISE. MORE CHARACTER.</span>
        <p data-reveal>
          {t(
            locale,
            "Κάποια αντικείμενα δεν γεμίζουν απλώς την καθημερινότητά σου.",
            "Some objects do more than fit into your day.",
          )}{" "}
          <em>{t(locale, "Γίνονται μέρος της.", "They become part of it.")}</em>
        </p>
        <span className="caption">
          {t(
            locale,
            "Αναπτύσσουμε την πρώτη μας συλλογή. Οι τελικές προδιαγραφές και συνθέσεις είναι υπό αξιολόγηση.",
            "We are developing our first collection. Final specifications and formulations are under review.",
          )}
        </span>
      </section>
      <section className="section collection" id="collection">
        <SectionTitle
          number="01"
          title={t(locale, "Η συλλογή.", "The collection.")}
          aside={
            <TextLink href={`/${locale}/shop`}>
              {t(locale, "Δες τα όλα", "View the collection")}
            </TextLink>
          }
        />
        <div className="product-grid">
          {products
            .filter((p) => p.kind !== "DISPOSABLE")
            .slice(0, 3)
            .map((p) => (
              <ProductCard key={p.id} product={p} locale={locale} />
            ))}
        </div>
      </section>
      <section className="story">
        <div className="story-visual">
          <span className="eyebrow">AN OBJECT OF INTENTION</span>
          <img
            className="story-object"
            src="/art/device.svg"
            alt="Illustrative form study"
            loading="lazy"
          />
          <span className="story-mark">
            FORM
            <br />
            MEETS
            <br />
            <em>feeling.</em>
          </span>
          <span className="caption">CONCEPT / NOT A TECHNICAL DRAWING</span>
        </div>
        <div className="story-copy">
          <span className="section-number">02 / THE DETAILS</span>
          <h2 data-reveal>
            {t(locale, "Σχεδιασμένο για", "Considered from")}
            <br />
            <em>{t(locale, "την αφή.", "every angle.")}</em>
          </h2>
          <p>
            {t(
              locale,
              "Οι αναλογίες. Η αίσθηση του υλικού. Οι μικρές λεπτομέρειες που προσέχεις μόνο όταν κάτι βρίσκεται στο χέρι σου.",
              "The proportions. The feel of a material. The small details you notice when an object is in your hand.",
            )}
          </p>
          <div className="detail-line">
            <span>01</span>
            <div>
              <h3>
                {t(locale, "Φυσική αφετηρία", "A natural starting point")}
              </h3>
              <p>
                {t(
                  locale,
                  "Καρυδιά και μέταλλο ως έμπνευση για τη μορφή.",
                  "Walnut and metal as the inspiration for form.",
                )}
              </p>
            </div>
          </div>
          <div className="detail-line">
            <span>02</span>
            <div>
              <h3>
                {t(locale, "Η δική σου προτίμηση", "Your own preference")}
              </h3>
              <p>
                {t(
                  locale,
                  "Εξερεύνησε την ιδέα της ρυθμιζόμενης ροής.",
                  "Explore the concept of adjustable airflow.",
                )}
              </p>
            </div>
          </div>
          <Airflow locale={locale} />
        </div>
      </section>
      <section className="section flavors-section">
        <SectionTitle
          number="03"
          title={t(locale, "Βρες τη δική σου νότα.", "Find your note.")}
          aside={<span className="caption">AROMAS, WITH PERSONALITY.</span>}
        />
        <FlavorExperience
          flavors={flavors.filter((f) => f.featured)}
          locale={locale}
        />
      </section>
      <section className="kit-feature">
        <div className="kit-feature-copy">
          <Eyebrow>THE FIRST EDITION</Eyebrow>
          <h2 data-reveal>
            {t(locale, "Η αρχή ενός", "The start of")}
            <br />
            <em>{t(locale, "δικού σου ritual.", "something yours.")}</em>
          </h2>
          <p>
            {t(
              locale,
              "Μια συσκευή. Οι αρωματικές σου επιλογές. Φτιάξε τον συνδυασμό που σου ταιριάζει.",
              "One device. Your aromatic preferences. Put together a combination that feels like you.",
            )}
          </p>
          <ButtonLink href={`/${locale}/starter-kit`}>
            {t(locale, "Διαμόρφωσε το kit σου", "Build your starter kit")}
          </ButtonLink>
          <span className="caption">
            {t(
              locale,
              "Ενδεικτική διαμόρφωση · Οι αγορές δεν έχουν ανοίξει",
              "Illustrative configuration · Purchases are not open",
            )}
          </span>
        </div>
        <img src="/art/kit.svg" alt="Starter kit concept" loading="lazy" />
      </section>
      <section className="section how">
        <SectionTitle
          number="04"
          title={t(locale, "Μια απλή ιδέα.", "A simple idea.")}
        />
        <div className="how-grid">
          {[
            [
              t(locale, "Γνώρισε τη συσκευή", "Meet your device"),
              t(
                locale,
                "Δες τα επιβεβαιωμένα υλικά, τις προδιαγραφές και τις οδηγίες για κάθε τελικό μοντέλο.",
                "Explore confirmed materials, specifications and instructions for each final model.",
              ),
            ],
            [
              t(locale, "Επίλεξε το άρωμά σου", "Choose your aroma"),
              t(
                locale,
                "Βρες συμβατούς πυρήνες και διάβασε τη σύνθεση και τις προειδοποιήσεις τους.",
                "Find compatible cores and read their composition and warnings.",
              ),
            ],
            [
              t(locale, "Ακολούθησε τις οδηγίες", "Follow the instructions"),
              t(
                locale,
                "Η τοποθέτηση, η αντικατάσταση και ο καθαρισμός θα περιγράφονται στις οδηγίες του κατασκευαστή.",
                "Insertion, replacement and cleaning will be described in manufacturer instructions.",
              ),
            ],
          ].map(([title, body], i) => (
            <div key={title} data-reveal>
              <span>0{i + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="philosophy">
        <span className="eyebrow">THE FORM AIR POINT OF VIEW</span>
        <h2 data-reveal>
          {t(locale, "Λιγότερα,", "Less,")}
          <br />
          <em>{t(locale, "με περισσότερη σκέψη.", "with more thought.")}</em>
        </h2>
        <TextLink href={`/${locale}/about`}>
          {t(locale, "Η ιστορία μας", "Our story")}
        </TextLink>
      </section>
      <section className="section faq-section">
        <div>
          <span className="section-number">05 / A LITTLE CLARITY</span>
          <h2>
            {t(locale, "Ας το γνωρίσουμε", "Let’s get")}
            <br />
            <em>{t(locale, "καλύτερα.", "acquainted.")}</em>
          </h2>
        </div>
        <FAQ items={content} locale={locale} />
      </section>
      <section className="waitlist-section" id="waitlist">
        <div>
          <Eyebrow>BE PART OF THE BEGINNING</Eyebrow>
          <h2 data-reveal>
            {t(locale, "Τα πρώτα νέα,", "First looks.")}
            <br />
            <em>{t(locale, "πρώτα σε σένα.", "Your inbox.")}</em>
          </h2>
          <p>
            {t(
              locale,
              "Άφησε το email σου. Θα σε ενημερώσουμε όταν η συλλογή είναι έτοιμη.",
              "Leave your email. We’ll let you know when the collection is ready.",
            )}
          </p>
        </div>
        <div>
          <WaitlistForm locale={locale} />
          <Link className="text-link survey-link" href={`/${locale}/research`}>
            {t(
              locale,
              "Βοήθησέ μας να τη διαμορφώσουμε",
              "Help shape the collection",
            )}
            <ArrowUpRight size={15} />
          </Link>
          {settings.showCountdown && settings.launchDate && (
            <p className="caption">
              {t(
                locale,
                "Στόχος έναρξης (υπό επιβεβαίωση)",
                "Launch target (subject to confirmation",
              )}
              :{" "}
              {settings.launchDate.toLocaleDateString(
                locale === "el" ? "el-GR" : "en-GB",
              )}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
