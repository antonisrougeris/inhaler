"use client";
import { useState, type FormEvent } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";
import { t, type Locale } from "@/lib/brand";
export async function api(url: string, body?: unknown, method = "POST") {
  const r = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? "REQUEST_FAILED");
  window.dispatchEvent(new Event("cart-change"));
  return data;
}
export function WaitlistForm({
  locale,
  source = "homepage",
}: {
  locale: Locale;
  source?: string;
}) {
  const [state, setState] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      await api("/api/waitlist", {
        email: form.get("email"),
        locale,
        source,
        consent: form.get("consent") === "on",
        website: form.get("website"),
      });
      setState("success");
    } catch {
      setState("error");
    } finally {
      setBusy(false);
    }
  }
  return state === "success" ? (
    <div className="form-success" role="status">
      <Check />
      <h3>{t(locale, "Ένα βήμα ακόμα.", "One more step.")}</h3>
      <p>
        {t(
          locale,
          "Αν χρειάζεται επιβεβαίωση, θα λάβεις email με τον σύνδεσμο. Έλεγξε και την ανεπιθύμητη αλληλογραφία.",
          "If confirmation is needed, an email will arrive with your link. Please check your spam folder too.",
        )}
      </p>
    </div>
  ) : (
    <form onSubmit={submit} className="waitlist-form">
      <div className="email-line">
        <label className="sr-only" htmlFor={`email-${source}`}>
          Email
        </label>
        <input
          type="email"
          id={`email-${source}`}
          name="email"
          placeholder={t(locale, "Το email σου", "Your email address")}
          required
          autoComplete="email"
        />
        <button
          aria-label={t(locale, "Εγγραφή", "Join waitlist")}
          disabled={busy}
        >
          <ArrowUpRight />
        </button>
      </div>
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="honeypot"
        aria-hidden="true"
      />
      <label className="checkbox">
        <input type="checkbox" name="consent" required />
        {t(
          locale,
          "Θέλω να λαμβάνω ενημερώσεις για την έναρξη. Μπορώ να διαγραφώ οποτεδήποτε.",
          "I would like to receive launch updates. I can unsubscribe at any time.",
        )}
      </label>
      <Link className="caption" href={`/${locale}/privacy`}>
        {t(locale, "Πολιτική απορρήτου", "Privacy notice")}
      </Link>
      {state === "error" && (
        <p role="alert">
          {t(
            locale,
            "Δεν αποθηκεύτηκε η εγγραφή. Δοκίμασε ξανά αργότερα.",
            "Your signup could not be saved. Please try again later.",
          )}
        </p>
      )}
    </form>
  );
}
export function FeedbackForm({
  locale,
  contact = false,
}: {
  locale: Locale;
  contact?: boolean;
}) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      await api("/api/feedback", {
        kind: contact ? "CONTACT" : "SURVEY",
        email: form.get("email") ?? "",
        answers: contact
          ? { message: form.get("message") }
          : {
              interest: form.get("interest"),
              design: form.get("design"),
              budget: form.get("budget"),
              concern: form.get("concern"),
            },
        website: "",
      });
      setMessage(
        t(
          locale,
          "Ευχαριστούμε. Η απάντησή σου αποθηκεύτηκε.",
          "Thank you. Your response has been saved.",
        ),
      );
    } catch {
      setMessage(
        t(
          locale,
          "Δεν αποθηκεύτηκε. Δοκίμασε ξανά.",
          "Could not save. Please try again.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="stack-form" onSubmit={submit}>
      {contact ? (
        <>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            {t(locale, "Μήνυμα", "Message")}
            <textarea name="message" required minLength={5} maxLength={3000} />
          </label>
        </>
      ) : (
        <>
          <label>
            {t(locale, "Σε ενδιαφέρει η ιδέα;", "Does the idea interest you?")}
            <select name="interest">
              <option>Yes / Ναι</option>
              <option>Maybe / Ίσως</option>
              <option>No / Όχι</option>
            </select>
          </label>
          <label>
            {t(locale, "Ποιο σχέδιο προτιμάς;", "Which design do you prefer?")}
            <select name="design">
              <option>Walnut</option>
              <option>Graphite</option>
              <option>Sand</option>
            </select>
          </label>
          <label>
            {t(
              locale,
              "Εύρος τιμής για starter kit",
              "Starter kit price range",
            )}
            <select name="budget">
              <option>€20–35</option>
              <option>€35–50</option>
              <option>€50–70</option>
              <option>€70+</option>
            </select>
          </label>
          <label>
            {t(
              locale,
              "Τι θα ήθελες να γνωρίζεις;",
              "What would you want to know?",
            )}
            <textarea name="concern" maxLength={2000} />
          </label>
        </>
      )}
      <p className="caption">
        {t(
          locale,
          "Δεν σε εγγράφουμε σε διαφημιστικά email. Μην συμπεριλάβεις δεδομένα υγείας.",
          "This does not subscribe you to marketing. Please do not include health information.",
        )}
      </p>
      <button className="button" disabled={busy}>
        {t(locale, "Αποστολή", "Send")}
        <ArrowUpRight size={18} />
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
export function TokenForm({
  locale,
  token,
  action,
}: {
  locale: Locale;
  token: string;
  action: "confirm" | "unsubscribe";
}) {
  const [message, setMessage] = useState("");
  return (
    <div>
      <button
        className="button"
        onClick={async () => {
          try {
            await api("/api/waitlist/token", { token, action });
            setMessage(
              t(
                locale,
                "Η επιλογή σου αποθηκεύτηκε.",
                "Your preference has been saved.",
              ),
            );
          } catch {
            setMessage(
              t(
                locale,
                "Ο σύνδεσμος έληξε ή δεν είναι έγκυρος.",
                "This link is expired or invalid.",
              ),
            );
          }
        }}
      >
        {action === "confirm"
          ? t(locale, "Επιβεβαίωση εγγραφής", "Confirm subscription")
          : t(locale, "Διαγραφή", "Unsubscribe")}
      </button>
      <p role="status">{message}</p>
    </div>
  );
}
