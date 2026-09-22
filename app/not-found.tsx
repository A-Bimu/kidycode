import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "That page is not here | KidyCode",
};

/* A page that cannot be found still has to be useful: the four paths are the only
 * things a learner is ever looking for. */
export default function NotFound() {
  return (
    <main className="fallback-page">
      <h1>That page is not here</h1>
      <p>The address may have been mistyped, or the page may have moved. These links all work.</p>
      <nav aria-label="Learning paths">
        <Link href="/">Home</Link>
        <Link href="/learn">Ages 10 to 12</Link>
        <Link href="/learn/13-15">Ages 13 to 15</Link>
        <Link href="/learn/16-18">Ages 16 to 18</Link>
        <Link href="/learn/adults">Adults</Link>
        <Link href="/guardian">Grown-up view</Link>
        <Link href="/privacy">Privacy and grown-ups</Link>
      </nav>
    </main>
  );
}
