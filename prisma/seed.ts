import "dotenv/config";
import { db } from "../lib/db";
const categories = [
  ["devices", "Συσκευές", "Devices"],
  ["starter-kits", "Starter kits", "Starter kits"],
  ["refills", "Αρωματικοί πυρήνες", "Aroma cores"],
  ["disposable", "Μίας χρήσης", "Disposable"],
];
async function main() {
  await db.storeSettings.upsert({
    where: { id: "store" },
    update: {},
    create: { id: "store" },
  });
  for (const [slug, nameEl, nameEn] of categories)
    await db.category.upsert({
      where: { slug },
      update: {},
      create: { slug, nameEl, nameEn },
    });
  const flavors = [
    [
      "peppermint",
      "Μέντα",
      "Peppermint",
      "#b3b8a0",
      "Δροσερές, πράσινες νότες.",
      "Cool, green notes.",
    ],
    [
      "lemon",
      "Λεμόνι",
      "Lemon",
      "#e2ce82",
      "Φωτεινός χαρακτήρας εσπεριδοειδών.",
      "A bright citrus character.",
    ],
    [
      "coffee",
      "Καφές",
      "Coffee",
      "#b3947d",
      "Έμπνευση από καβουρδισμένους κόκκους.",
      "Inspired by roasted coffee beans.",
    ],
    [
      "spearmint",
      "Δυόσμος",
      "Spearmint",
      "#9eae8d",
      "Πράσινη αρωματική κατεύθυνση.",
      "A green aromatic direction.",
    ],
    [
      "eucalyptus",
      "Ευκάλυπτος",
      "Eucalyptus",
      "#92aaa0",
      "Έμπνευση από φύλλα ευκαλύπτου.",
      "Inspired by eucalyptus leaves.",
    ],
    [
      "orange",
      "Πορτοκάλι",
      "Orange",
      "#d99563",
      "Ζωντανή κατεύθυνση εσπεριδοειδών.",
      "A vivid citrus direction.",
    ],
    [
      "watermelon",
      "Καρπούζι",
      "Watermelon",
      "#c98882",
      "Καλοκαιρινή αρωματική ιδέα.",
      "A summer-inspired aroma concept.",
    ],
    [
      "blueberry",
      "Μύρτιλο",
      "Blueberry",
      "#9a9dbb",
      "Έμπνευση από μικρά φρούτα.",
      "Inspired by berries.",
    ],
    [
      "peach",
      "Ροδάκινο",
      "Peach",
      "#dfb69d",
      "Απαλές φρουτώδεις νότες.",
      "Soft fruit notes.",
    ],
    [
      "mango",
      "Μάνγκο",
      "Mango",
      "#d5b16c",
      "Τροπική αρωματική κατεύθυνση.",
      "A tropical aroma direction.",
    ],
    [
      "grapefruit",
      "Γκρέιπφρουτ",
      "Grapefruit",
      "#d7a38e",
      "Εσπεριδοειδή με χαρακτήρα.",
      "Citrus with character.",
    ],
  ];
  for (const [
    slug,
    nameEl,
    nameEn,
    color,
    descriptionEl,
    descriptionEn,
  ] of flavors)
    await db.flavor.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        nameEl,
        nameEn,
        color,
        descriptionEl,
        descriptionEn,
        featured: ["peppermint", "lemon", "coffee"].includes(slug),
        image: `/art/${slug === "peppermint" ? "mint" : slug === "lemon" ? "lemon" : slug === "coffee" ? "coffee" : "core"}.svg`,
      },
    });
  const products = [
    {
      slug: "form-01",
      nameEl: "FORM 01",
      nameEn: "FORM 01",
      category: "devices",
      kind: "DEVICE",
      image: "device",
      descriptionEl:
        "Μια μελέτη στη μορφή και την αφή. Γνώρισε την κατεύθυνση της πρώτης συλλογής μας.",
      descriptionEn:
        "A study in form and touch. Discover the direction of our first collection.",
      variants: [
        ["Walnut", "#694a36", 3900],
        ["Graphite", "#41403a", 3900],
        ["Sand", "#c9b99b", 3900],
      ],
    },
    {
      slug: "first-edition",
      nameEl: "The First Edition",
      nameEn: "The First Edition",
      category: "starter-kits",
      kind: "BUNDLE",
      image: "kit",
      descriptionEl:
        "Η πρώτη γνωριμία: μια συσκευή και δύο συσκευασίες αρωματικών πυρήνων. Ενδεικτική σύνθεση.",
      descriptionEn:
        "The introduction: a device and two aroma-core packs. Illustrative bundle.",
      variants: [["Walnut + Peppermint + Lemon", "#694a36", 5500]],
    },
    {
      slug: "aroma-cores",
      nameEl: "Aroma Cores",
      nameEn: "Aroma Cores",
      category: "refills",
      kind: "REFILL",
      image: "core",
      descriptionEl:
        "Εξερεύνησε τις αρωματικές κατευθύνσεις της συλλογής. Οι τελικές συνθέσεις είναι υπό αξιολόγηση.",
      descriptionEn:
        "Explore the aromatic directions of the collection. Final formulations are under review.",
      variants: [],
    },
    {
      slug: "form-go",
      nameEl: "FORM Go",
      nameEn: "FORM Go",
      category: "disposable",
      kind: "DISPOSABLE",
      image: "device",
      descriptionEl:
        "Μια συμπαγής ιδέα για τη μελλοντική συλλογή. Οι προδιαγραφές δεν έχουν οριστικοποιηθεί.",
      descriptionEn:
        "A compact concept for the future collection. Specifications are not final.",
      variants: [["Concept", "#a3ad96", 1500]],
    },
  ];
  for (const p of products) {
    const category = await db.category.findUniqueOrThrow({
      where: { slug: p.category },
    });
    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        nameEl: p.nameEl,
        nameEn: p.nameEn,
        descriptionEl: p.descriptionEl,
        descriptionEn: p.descriptionEn,
        categoryId: category.id,
        kind: p.kind,
        published: true,
        demo: true,
        featured: p.slug === "form-01",
        images: {
          create: {
            url: `/art/${p.image}.svg`,
            altEl: "Ενδεικτική απεικόνιση προϊόντος",
            altEn: "Illustrative product concept",
          },
        },
      },
    });
    for (const [name, color, price] of p.variants) {
      const sku = `${p.slug}-${String(name).split(" ")[0].toLowerCase()}`;
      const variant = await db.variant.upsert({
        where: { sku },
        update: {},
        create: {
          productId: product.id,
          sku,
          name: String(name),
          color: String(color),
          price: Number(price),
        },
      });
      await db.inventory.upsert({
        where: { variantId: variant.id },
        update: {},
        create: { variantId: variant.id, onHand: 0 },
      });
    }
  }
  const refills = await db.product.findUniqueOrThrow({
    where: { slug: "aroma-cores" },
  });
  for (const flavor of await db.flavor.findMany()) {
    const variant = await db.variant.upsert({
      where: { sku: `core-${flavor.slug}` },
      update: {},
      create: {
        sku: `core-${flavor.slug}`,
        productId: refills.id,
        name: flavor.nameEn,
        flavorId: flavor.id,
        color: flavor.color,
        price: 800,
        packSize: 3,
      },
    });
    await db.inventory.upsert({
      where: { variantId: variant.id },
      update: {},
      create: { variantId: variant.id, onHand: 0 },
    });
  }
  const bundle = await db.variant.findUniqueOrThrow({
    where: { sku: "first-edition-walnut" },
  });
  for (const sku of ["form-01-walnut", "core-peppermint", "core-lemon"]) {
    const component = await db.variant.findUniqueOrThrow({ where: { sku } });
    await db.bundleComponent.upsert({
      where: {
        bundleId_componentId: {
          bundleId: bundle.id,
          componentId: component.id,
        },
      },
      update: {},
      create: { bundleId: bundle.id, componentId: component.id, quantity: 1 },
    });
  }
  const content = [
    [
      "faq-what",
      "Τι είναι το flavored air;",
      "What is flavored air?",
      "Η ιδέα είναι η διέλευση αέρα μέσα από έναν αρωματικό πυρήνα, χωρίς μηχανισμό θέρμανσης. Οι τελικές προδιαγραφές θα δημοσιευτούν ανά προϊόν πριν από τη διάθεση.",
      "The concept passes air through an aroma core, without a heating mechanism. Final specifications will be published per product before sale.",
    ],
    [
      "faq-nicotine",
      "Περιέχει νικοτίνη ή παράγει ατμό;",
      "Does it contain nicotine or produce vapor?",
      "Η σχεδιαστική κατεύθυνση είναι χωρίς νικοτίνη, θέρμανση ή παραγωγή ατμού. Η σύνθεση και οι ιδιότητες κάθε τελικού προϊόντος υπόκεινται σε έλεγχο.",
      "The design direction is nicotine-free, without heating or vapor production. The composition and properties of each final product are subject to verification.",
    ],
    [
      "faq-cores",
      "Πόσο διαρκούν οι πυρήνες;",
      "How long do aroma cores last?",
      "Η διάρκεια και οι οδηγίες αντικατάστασης θα βασίζονται στα επιβεβαιωμένα στοιχεία του κατασκευαστή. Δεν έχει οριστεί διάρκεια για τα ενδεικτικά προϊόντα.",
      "Duration and replacement instructions will be based on verified manufacturer information. No lifespan is specified for concept products.",
    ],
    [
      "faq-kit",
      "Τι περιλαμβάνει το starter kit;",
      "What is in a starter kit?",
      "Ο διαμορφωτής δείχνει αναλυτικά τη συσκευή και τους αρωματικούς πυρήνες που επιλέγεις. Η τελική συσκευασία και τα περιεχόμενα θα επιβεβαιωθούν πριν από την πώληση.",
      "The builder lists your chosen device and aroma-core packs. Final packaging and contents will be confirmed before sale.",
    ],
    [
      "faq-safety",
      "Τι πρέπει να γνωρίζω για την ασφάλεια;",
      "What should I know about safety?",
      "Η απουσία νικοτίνης ή ατμού δεν τεκμηριώνει ασφάλεια εισπνοής. Η διάθεση προϋποθέτει αξιολόγηση των προϊόντων και των αρωμάτων. Δεν παρουσιάζεται ως θεραπεία ή μέσο διακοπής καπνίσματος.",
      "Absence of nicotine or vapor does not establish inhalation safety. Products and aromas require assessment before sale. This is not presented as a therapy or smoking cessation aid.",
    ],
    [
      "faq-shipping",
      "Πότε θα μπορώ να παραγγείλω;",
      "When can I order?",
      "Βρισκόμαστε σε προετοιμασία. Δεν δεχόμαστε παραγγελίες ή πληρωμές. Μπορείς να εγγραφείς για ενημέρωση όταν επιβεβαιωθεί η έναρξη.",
      "We are preparing the collection. Orders and payments are closed. Join the list to hear when the launch is confirmed.",
    ],
    [
      "about",
      "Μορφή. Υλικό. Προσωπική επιλογή.",
      "Form. Material. Personal choice.",
      "Το FORM AIR ξεκινά από μια απλή ιδέα: αντικείμενα που θέλεις να κρατάς. Εξερευνούμε υλικά, αναλογίες και αρωματικές κατευθύνσεις, με προσοχή στις λεπτομέρειες. Η πρώτη συλλογή είναι υπό ανάπτυξη.",
      "FORM AIR starts with a simple idea: objects you want to hold. We explore materials, proportions and aromatic directions, paying attention to the details. Our first collection is in development.",
    ],
    [
      "shipping",
      "Αποστολές & επιστροφές",
      "Shipping & returns",
      "Οι αγορές δεν είναι διαθέσιμες. Οι χρεώσεις, οι περιοχές παράδοσης, οι χρόνοι και οι όροι επιστροφών θα δημοσιευτούν πριν την έναρξη πωλήσεων.",
      "Purchases are not available. Shipping fees, destinations, delivery times and return terms will be published before sales open.",
    ],
    [
      "privacy",
      "Πολιτική απορρήτου — προσχέδιο",
      "Privacy notice — draft",
      "Αποθηκεύουμε το email, τη γλώσσα, την πηγή εγγραφής, την ημερομηνία και την έκδοση συγκατάθεσης για ενημερώσεις έναρξης. Τα ερωτηματολόγια δεν σε εγγράφουν σε επικοινωνίες marketing. Μπορείς να διαγραφείς από τον σύνδεσμο στο email επιβεβαίωσης. Χρησιμοποιούμε απαραίτητα cookies για λογαριασμό και καλάθι. Δεν φορτώνουμε προαιρετικά εργαλεία analytics. Τα στοιχεία του υπευθύνου επεξεργασίας και οι χρόνοι διατήρησης πρέπει να συμπληρωθούν πριν τη δημόσια συλλογή δεδομένων.",
      "We store email, language, signup source, consent timestamp and consent version for launch updates. Surveys do not subscribe you to marketing. Unsubscribe using your confirmation email. Essential cookies support accounts and carts. No optional analytics tools are loaded. Controller information and retention periods must be completed before public data collection.",
    ],
    [
      "terms",
      "Όροι χρήσης — προσχέδιο",
      "Terms — draft",
      "Η ιστοσελίδα παρουσιάζει προϊόντα υπό ανάπτυξη. Οι εικόνες είναι ενδεικτικές, οι τιμές δοκιμαστικές και οι τελικές προδιαγραφές δεν έχουν επιβεβαιωθεί. Οι πλήρεις όροι πώλησης και τα στοιχεία επιχείρησης πρέπει να εγκριθούν πριν την εμπορική διάθεση.",
      "This website presents products in development. Images are illustrative, prices are for testing and final specifications are not confirmed. Full sales terms and business details must be approved before commercial launch.",
    ],
  ];
  for (const [position, row] of content.entries()) {
    const [key, titleEl, titleEn, bodyEl, bodyEn] = row;
    await db.content.upsert({
      where: { key },
      update: {},
      create: { key, titleEl, titleEn, bodyEl, bodyEn, position },
    });
  }
  console.log(
    "Seeded concept catalog, zero inventory, pre-launch mode. No customer records or approvals created.",
  );
}
await main();
await db.$disconnect();
