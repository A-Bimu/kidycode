import { AdminConsole } from "@/components/admin/AdminConsole";

/*
 * /admin — the owner review console entry point.
 *
 * The page itself is a shell. Access, and every piece of data behind it, is decided by the
 * owner-gated routes under /api/admin. Because this server component reads no identity and
 * fetches nothing, a stranger who reaches the URL sees the closed state and nothing else.
 */
export default function AdminPage() {
  return <AdminConsole />;
}
