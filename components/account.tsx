"use client";
import { useState, type FormEvent } from "react";
import { createAuthClient } from "better-auth/react";
import { t, type Locale } from "@/lib/brand";
const authClient = createAuthClient();
export function AccountForm({
  locale,
  resetToken,
}: {
  locale: Locale;
  resetToken?: string;
}) {
  const [mode, setMode] = useState<"login" | "signup" | "reset">(
      resetToken ? "reset" : "login",
    ),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? ""),
      password = String(data.get("password") ?? "");
    try {
      const result =
        mode === "signup"
          ? await authClient.signUp.email({
              email,
              password,
              name: String(data.get("name")),
            })
          : mode === "reset"
            ? resetToken
              ? await authClient.resetPassword({
                  newPassword: password,
                  token: resetToken,
                })
              : await authClient.requestPasswordReset({
                  email,
                  redirectTo: `/${locale}/account`,
                })
            : await authClient.signIn.email({ email, password });
      if (result.error)
        setMessage(
          t(
            locale,
            "Έλεγξε τα στοιχεία σου και την επιβεβαίωση email.",
            "Please check your details and email verification.",
          ),
        );
      else if (mode === "login") window.location.reload();
      else
        setMessage(
          t(
            locale,
            "Έλεγξε το email σου για τα επόμενα βήματα.",
            "Check your email for the next steps.",
          ),
        );
    } catch {
      setMessage(
        t(locale, "Η υπηρεσία δεν είναι διαθέσιμη.", "Service unavailable."),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="account-box">
      <div className="variant-options">
        {(["login", "signup", "reset"] as const).map((m) => (
          <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>
            {m === "login"
              ? t(locale, "Σύνδεση", "Sign in")
              : m === "signup"
                ? t(locale, "Εγγραφή", "Create account")
                : t(locale, "Επαναφορά", "Reset")}
          </button>
        ))}
      </div>
      <form className="stack-form" onSubmit={submit}>
        {mode === "signup" && (
          <label>
            {t(locale, "Όνομα", "Name")}
            <input name="name" required autoComplete="name" />
          </label>
        )}
        {!resetToken && (
          <label>
            Email
            <input type="email" name="email" required autoComplete="email" />
          </label>
        )}
        {(mode !== "reset" || resetToken) && (
          <label>
            {t(locale, "Κωδικός", "Password")}
            <input
              type="password"
              name="password"
              required
              minLength={12}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </label>
        )}
        <button className="button" disabled={busy}>
          {t(locale, "Συνέχεια", "Continue")} →
        </button>
        <p role="status">{message}</p>
      </form>
    </div>
  );
}
export function SignOut({ locale }: { locale: Locale }) {
  return (
    <button
      className="text-link"
      onClick={async () => {
        await authClient.signOut();
        window.location.reload();
      }}
    >
      {t(locale, "Αποσύνδεση", "Sign out")}
    </button>
  );
}
