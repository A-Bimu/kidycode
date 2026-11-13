import type { Metadata } from "next";
import "./admin.css";

/*
 * The owner console layout.
 *
 * It carries no data of its own and no identity logic: the shell renders, and the client
 * asks /api/admin/session which decides whether anything else is shown. A server page could
 * not leak a lesson because it never holds one.
 *
 * The console is marked noindex: it must never appear in a search result or a preview card.
 */

export const metadata: Metadata = {
  title: "KidyCode Admin Console — owner review",
  description: "Read-only owner console for reviewing the KidyCode curriculum, honest aggregate activity, and notification drafts.",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
