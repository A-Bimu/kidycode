import { z } from "zod";
import { readInstitutionIdentity } from "@/lib/institution-identity";
import { isInstitutionRole } from "@/lib/institution-roles";
import { planAssignment, resolveMembership } from "@/lib/lms-accounts";
import { databaseError, getDatabase } from "@/lib/server-database";

/*
 * The pilot cohort assignment endpoint.
 *
 * A cohort-scoped role's scope is the set of member_cohort_assignments rows it holds. This
 * route is the only writer of those rows, so the scope a grown-up works in is a persisted
 * decision made by an organisation-scoped role, not something the app derives from the
 * organisation's cohort list.
 *
 * The actor comes from the platform headers (and, when a proxy secret is configured, from
 * the edge's signature on them), never from the body. planAssignment holds the decision;
 * this route only carries it out. A revoked row is kept so the history survives, and a
 * later re-assignment reactivates the same row.
 */

const bodySchema = z
  .object({
    organisationId: z.string().min(1).max(128),
    cohortId: z.string().min(1).max(128),
    memberId: z.string().min(1).max(128),
    wanted: z.enum(["active", "revoked"]),
  })
  .strict();

export async function POST(request: Request) {
  try {
    const identity = await readInstitutionIdentity(request);
    if (!identity) return Response.json({ error: "Sign in to change a cohort assignment." }, { status: 401 });

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return Response.json({ error: "An assignment needs an organisation, a cohort, a member and a wanted state." }, { status: 400 });
    }

    const database = getDatabase();

    const memberRows = await database
      .prepare(
        "SELECT id, organisation_id AS organisationId, platform_user_id AS platformUserId, email, display_name AS displayName, role, status FROM organisation_members WHERE platform_user_id = ?",
      )
      .bind(identity.platformUserId)
      .all<{ id: string; organisationId: string; platformUserId: string; email: string; displayName: string | null; role: string; status: string }>();
    const accounts = memberRows.results ?? [];

    const membership = resolveMembership(identity, accounts, parsed.data.organisationId);
    if (!membership || !isInstitutionRole(membership.role)) {
      return Response.json({ error: "This identity holds no active membership in that organisation." }, { status: 403 });
    }

    /* The member being assigned must belong to the same organisation, and the cohort must
     * too. Both are answered as not found so the response cannot be used to discover another
     * institution's members or cohorts. */
    const target = await database
      .prepare("SELECT id FROM organisation_members WHERE id = ? AND organisation_id = ?")
      .bind(parsed.data.memberId, parsed.data.organisationId)
      .first<{ id: string }>();
    if (!target) return Response.json({ error: "That member does not belong to this organisation." }, { status: 404 });

    const cohort = await database
      .prepare("SELECT id FROM cohorts WHERE id = ? AND organisation_id = ? AND status = 'active'")
      .bind(parsed.data.cohortId, parsed.data.organisationId)
      .first<{ id: string }>();
    if (!cohort) return Response.json({ error: "That cohort does not belong to this organisation." }, { status: 404 });

    const current = await database
      .prepare("SELECT cohort_id AS cohortId, member_id AS memberId, status FROM member_cohort_assignments WHERE member_id = ? AND cohort_id = ?")
      .bind(parsed.data.memberId, parsed.data.cohortId)
      .first<{ cohortId: string; memberId: string; status: string }>();

    const plan = planAssignment({
      membership,
      organisationId: parsed.data.organisationId,
      cohortId: parsed.data.cohortId,
      current: current ?? null,
      wanted: parsed.data.wanted,
    });

    const now = new Date().toISOString();
    if (plan.action === "refused") return Response.json({ error: plan.reason, plan }, { status: 403 });
    if (plan.action === "insert") {
      await database
        .prepare(
          "INSERT INTO member_cohort_assignments (id, member_id, cohort_id, status, assigned_by, assigned_at, revoked_at) VALUES (?, ?, ?, 'active', ?, ?, NULL)",
        )
        .bind(crypto.randomUUID(), parsed.data.memberId, parsed.data.cohortId, membership.role, now)
        .run();
    } else if (plan.action === "reactivate") {
      await database
        .prepare("UPDATE member_cohort_assignments SET status = 'active', revoked_at = NULL, assigned_by = ?, assigned_at = ? WHERE member_id = ? AND cohort_id = ?")
        .bind(membership.role, now, parsed.data.memberId, parsed.data.cohortId)
        .run();
    } else if (plan.action === "revoke") {
      await database
        .prepare("UPDATE member_cohort_assignments SET status = 'revoked', revoked_at = ? WHERE member_id = ? AND cohort_id = ?")
        .bind(now, parsed.data.memberId, parsed.data.cohortId)
        .run();
    }

    return Response.json({ plan });
  } catch (error) {
    return databaseError(error);
  }
}
