"use client";

import Link from "next/link";

/* Route level failure handling. A learner is never shown a stack trace or anything
 * about the database: they are shown a plain sentence, a retry, and a way back. */
export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="fallback-page">
      <h1>Something went wrong on this page</h1>
      <p>Your saved work is safe. Try the page again, or open your course from the beginning.</p>
      <nav aria-label="Recovery">
        <button className="primary-button" type="button" onClick={() => reset()}>Try this page again</button>
        <Link className="outline-button" href="/">Go to the home page</Link>
      </nav>
    </main>
  );
}
