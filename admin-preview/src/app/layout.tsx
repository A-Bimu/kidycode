import type { Metadata } from "next";

/*
 * The review target's root layout.
 *
 * The whole application is noindex and nofollow: nothing here should ever be reachable from a
 * search result, a link preview or a crawler.
 */
export const metadata: Metadata = {
  title: "KidyCode owner review",
  description: "Access-controlled, read-only owner review of the KidyCode curriculum.",
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
