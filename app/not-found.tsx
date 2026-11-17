import Link from "next/link";
export default function NotFound() {
  return (
    <main className="page section narrow">
      <p className="eyebrow">404 / A DIFFERENT PATH</p>
      <h1>
        Δεν βρέθηκε.
        <br />
        Page not found.
      </h1>
      <Link className="button" href="/el">
        Back to FORM AIR →
      </Link>
    </main>
  );
}
