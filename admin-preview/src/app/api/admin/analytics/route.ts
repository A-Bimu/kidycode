import { buildAnalytics, notTrackedMetrics, K_ANONYMITY_FLOOR } from "@/lib/admin-analytics";
import { requireOwner } from "@/lib/preview-runtime";

/*
 * Aggregate owner analytics — read only, and deliberately database-free.
 *
 * This review deployment has no database and no learner records, so every figure that would
 * normally be counted is reported as `unavailable` with the table it would have come from.
 * Nothing is estimated, back-filled or invented to make the screen look populated: the
 * metrics that KidyCode does not record at all are returned under `notTracked` exactly as the
 * Worker build returns them.
 *
 * The owner's real numbers appear only in a deployment that has the database attached. This
 * target exists to review the console's shape, wording and provenance, not to publish
 * activity figures.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* A runner that refuses every query, so every recorded metric resolves to `unavailable`
 * rather than to a fabricated zero. */
type UnavailableStatement = {
  bind(): UnavailableStatement;
  all<T>(): Promise<{ results?: T[] }>;
  first<T>(): Promise<T | null>;
};

function unavailableDatabase() {
  const statement: UnavailableStatement = {
    bind(): UnavailableStatement {
      return statement;
    },
    async all<T>(): Promise<{ results?: T[] }> {
      throw new Error("The review deployment has no database.");
    },
    async first<T>(): Promise<T | null> {
      throw new Error("The review deployment has no database.");
    },
  };
  return {
    prepare() {
      return statement;
    },
  };
}

export async function GET(request: Request) {
  const guard = await requireOwner(request);
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const requested = Number(url.searchParams.get("days"));
  const windowDays = Number.isInteger(requested) && requested >= 1 && requested <= 365 ? requested : 30;

  const report = await buildAnalytics(unavailableDatabase(), new Date(), windowDays);

  return Response.json(
    {
      provenance: guard.provenance,
      readOnly: true,
      /* Stated on the payload itself, so the distinction cannot be lost between the server and
       * the screen. */
      databaseConnected: false,
      previewNotice:
        "This review deployment has no database attached. Every metric that would be counted is shown as unavailable with its source table, and the metrics KidyCode does not record are listed as not tracked yet. No figure on this screen is a real learner count.",
      report: {
        ...report,
        notTracked: notTrackedMetrics,
        kAnonymityFloor: K_ANONYMITY_FLOOR,
      },
    },
    { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } },
  );
}
