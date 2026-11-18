import { buildAnalytics } from "@/lib/admin-analytics";
import { requireOwner } from "@/lib/admin-runtime";
import { databaseError, getDatabase } from "@/lib/server-database";

/*
 * Aggregate owner analytics, read only.
 *
 * Every number comes from a query in lib/admin-analytics.ts, which records the table each
 * figure came from and what was counted. Metrics with no recorded source are returned under
 * `notTracked` with the reason and what would need to be instrumented - they are never
 * estimated. No learner is named, and groups below the anonymity floor are suppressed.
 *
 * The route reads. It never writes a row, and the owner identity is required before the
 * database is touched.
 */
export async function GET(request: Request) {
  const guard = await requireOwner(request);
  if (!guard.ok) return guard.response;

  try {
    const url = new URL(request.url);
    const requested = Number(url.searchParams.get("days"));
    const windowDays = Number.isInteger(requested) && requested >= 1 && requested <= 365 ? requested : 30;
    const database = getDatabase();
    const report = await buildAnalytics(database, new Date(), windowDays);
    return Response.json(
      { provenance: guard.provenance, readOnly: true, report },
      { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } },
    );
  } catch (error) {
    return databaseError(error);
  }
}
