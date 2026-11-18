import { ownerGateState, ownerRuntimeConfig, authenticateOwner } from "@/lib/preview-runtime";

/*
 * Who am I, on the admin side — the Node twin of app/api/admin/session/route.ts.
 *
 * This is the only admin endpoint that answers without owner access and it answers with
 * nothing sensitive. It is also the one place that tells the owner this is a review
 * deployment with no database, rather than letting a zero read as an empty cohort.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const config = ownerRuntimeConfig();
  const decision = await authenticateOwner(request);
  const gate = ownerGateState();
  return Response.json(
    {
      authenticated: decision !== null,
      permission: decision ? decision.permission : null,
      owner: decision ? { platformUserId: decision.identity.platformUserId, displayName: decision.identity.displayName } : null,
      gate: { configured: gate.configured, synthetic: gate.synthetic },
      readOnly: true,
      notice: decision?.permission === "synthetic-review"
        ? "Synthetic review session: no owner identity is configured, so this demonstration runs on the built-in curriculum only. Nothing here is a real learner record."
        : decision
          ? undefined
          : "Owner access needs a signed platform identity and an approved owner account, or the review key held by this deployment. None is present in this request, so the console stays closed.",
      identityTrust: config.mode,
    },
    { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } },
  );
}
