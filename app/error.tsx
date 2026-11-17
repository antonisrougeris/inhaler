"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="page section narrow">
      <h1>
        Μια μικρή παύση.
        <br />A brief pause.
      </h1>
      <p>
        Η υπηρεσία δεν είναι διαθέσιμη αυτή τη στιγμή. / The service is
        temporarily unavailable.
      </p>
      <button className="button" onClick={reset}>
        Δοκιμή ξανά / Try again
      </button>
    </main>
  );
}
