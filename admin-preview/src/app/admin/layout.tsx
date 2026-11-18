import type { Metadata } from "next";
import "@/app/admin/admin.css";

/*
 * The owner console's layout, mirroring app/admin/layout.tsx in the Cloudflare application.
 * The stylesheet is the same file, vendored by scripts/sync-shared.mjs, so the palette and
 * every approved screen stay identical between the two builds.
 */
export const metadata: Metadata = {
  title: "KidyCode Admin Console — owner review",
  description: "Read-only owner console for reviewing the KidyCode curriculum, honest aggregate activity, and notification drafts.",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
