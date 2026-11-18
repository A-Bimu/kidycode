import { AdminConsole } from "@/components/admin/AdminConsole";

/*
 * /admin — the same shell the Cloudflare build serves. It holds no data and reads no
 * identity: the client asks /api/admin/session, and every other endpoint answers 403 until
 * the owner gate is satisfied.
 */
export default function AdminPage() {
  return <AdminConsole />;
}
