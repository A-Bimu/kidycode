import type { Metadata } from "next";
import Link from "next/link";

/*
 * The review target's landing page.
 *
 * It exists so that the hostname root is not an error page for the owner, and so that anyone
 * who reaches the deployment without a review link is told plainly what it is. It links to
 * /admin, which shows the closed state unless the owner gate is satisfied.
 */
export const metadata: Metadata = {
  title: "KidyCode owner review",
  robots: { index: false, follow: false, nocache: true },
};

export default function LandingPage() {
  return (
    <main style={{ maxWidth: "46rem", margin: "4rem auto", padding: "0 1.25rem", fontFamily: "system-ui, sans-serif", lineHeight: 1.6 }}>
      <h1 style={{ fontSize: "1.5rem" }}>KidyCode owner review</h1>
      <p>
        This is the access-controlled owner review deployment for the KidyCode admin console. It carries no learner
        records and no database: every figure it can show is either read from the curriculum source or labelled
        &ldquo;not tracked yet&rdquo;.
      </p>
      <p>
        The console itself is closed until the owner key is supplied. <Link href="/admin">Open the admin console</Link>.
      </p>
    </main>
  );
}
