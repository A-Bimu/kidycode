import { ownerGateState, ownerRuntimeConfig, authenticateOwner } from "@/lib/admin-runtime";

/*
 * Who am I, on the admin side.
 *
 * This is the only admin endpoint that answers without owner access, and it answers with
 * nothing sensitive: whether a session exists, which permission it has, and whether the
 * owner gate is configured in this deployment at all. Every other admin endpoint returns
 * 403 before it reads a single row.
 *
 * The configuration state is deliberately reported. The owner needs to know that a review
 * deployment is running in synthetic mode rather than pretending the gate is live, and the
 * state reveals nothing an attacker could use beyond "not configured", which is already
 * observable from the 403 every other route returns.
 */
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
          : "Owner access needs a signed platform identity and an approved owner account. None is configured in this deployment, so the console stays closed.",
      identityTrust: config.mode,
    },
    { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } },
  );
}
