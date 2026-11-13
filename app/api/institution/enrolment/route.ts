import { z } from "zod";
import { isInstitutionRole } from "@/lib/institution-roles";
import { readInstitutionIdentity } from "@/lib/institution-identity";
import { membershipFromAssignments, planEnrolment, resolveMembership } from "@/lib/lms-accounts";
import { databaseError, getDatabase } from "@/lib/server-database";

/*
 * The pilot enrolment endpoint.
 *
 * The decision is made by planEnrolment, not here: this route only carries out the
 * insert, reactivate, no-op or revoke it returns. The actor comes from the platform
 * headers, the organisation and the cohort are checked against that actor, and a refused
 * plan is answered with 403 rather than written.
 *
 * A learner link is durable. A revoke updates the existing row, and a later re-enrolment
 * reactivates the same row, so the history of who was enrolled by which organisation
 * survives.
 */

const bodySchema = z
  .object({
    organisationId: z.string().min(1).max(128),
    cohortId: z.string().min(1).max(128),
    learnerId: z.string().min(1).max(128),
    wanted: z.enum(["active", "revoked"]),
  })
  .strict();

export async function POST(request: Request) {
  try {
    const identity = await readInstitutionIdentity(request);
    if (!identity) return Response.json({ error: "Sign in to change a learner link." }, { status: 401 });

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "An enrolment needs an organisation, a cohort, a learner and a wanted state." }, { status: 400 });

    const database = getDatabase();

    const memberRows = await database
      .prepare("SELECT id, organisation_id AS organisationId, platform_user_id AS platformUserId, email, display_name AS displayName, role, status FROM organisation_members WHERE platform_user_id = ?")
      .bind(identity.platformUserId)
      .all<{ id: string; organisationId: string; platformUserId: string; email: string; displayName: string | null; role: string; status: string }>();
    const accounts = memberRows.results ?? [];

    const membership = resolveMembership(identity, accounts, parsed.data.organisationId);
    if (!membership || !isInstitutionRole(membership.role)) {
      return Response.json({ error: "This identity holds no active membership in that organisation." }, { status: 403 });
    }

    /* The cohort must belong to the named organisation. A cohort id from another
     * organisation is answered as not found rather than as a permission decision, so the
     * response cannot be used to discover another institution's cohorts. */
    const cohort = await database
      .prepare("SELECT id FROM cohorts WHERE id = ? AND organisation_id = ? AND status = 'active'")
      .bind(parsed.data.cohortId, parsed.data.organisationId)
      .first<{ id: string }>();
    if (!cohort) return Response.json({ error: "That cohort does not belong to this organisation." }, { status: 404 });

    /* The role must work in that cohort, and the only source of a cohort-scoped scope is the
     * persisted assignment. An unassigned lead or instructor therefore holds no cohort and
     * planEnrolment refuses the write. */
    const memberAccount = accounts.find(
      (account) => account.organisationId === parsed.data.organisationId && account.platformUserId === identity.platformUserId,
    );
    const assignmentRows = memberAccount
      ? await database
          .prepare("SELECT cohort_id AS cohortId, status FROM member_cohort_assignments WHERE member_id = ? AND status = 'active'")
          .bind(memberAccount.id)
          .all<{ cohortId: string; status: string }>()
      : { results: [] as Array<{ cohortId: string; status: string }> };
    const scoped = membershipFromAssignments(membership, assignmentRows.results ?? []);

    const current = await database
      .prepare("SELECT cohort_id AS cohortId, learner_id AS learnerId, status FROM cohort_enrolments WHERE cohort_id = ? AND learner_id = ?")
      .bind(parsed.data.cohortId, parsed.data.learnerId)
      .first<{ cohortId: string; learnerId: string; status: string }>();

    const plan = planEnrolment({
      membership: scoped,
      organisationId: parsed.data.organisationId,
      cohortId: parsed.data.cohortId,
      learnerId: parsed.data.learnerId,
      current: current ?? null,
      wanted: parsed.data.wanted,
    });

    const now = new Date().toISOString();
    if (plan.action === "refused") return Response.json({ error: plan.reason, plan }, { status: 403 });
    if (plan.action === "insert") {
      await database
        .prepare("INSERT INTO cohort_enrolments (id, cohort_id, learner_id, status, enrolled_by, enrolled_at) VALUES (?, ?, ?, 'active', ?, ?)")
        .bind(crypto.randomUUID(), parsed.data.cohortId, parsed.data.learnerId, scoped.role, now)
        .run();
    } else if (plan.action === "reactivate") {
      await database
        .prepare("UPDATE cohort_enrolments SET status = 'active', revoked_at = NULL, enrolled_by = ?, enrolled_at = ? WHERE cohort_id = ? AND learner_id = ?")
        .bind(scoped.role, now, parsed.data.cohortId, parsed.data.learnerId)
        .run();
    } else if (plan.action === "revoke") {
      await database
        .prepare("UPDATE cohort_enrolments SET status = 'revoked', revoked_at = ? WHERE cohort_id = ? AND learner_id = ?")
        .bind(now, parsed.data.cohortId, parsed.data.learnerId)
        .run();
    }

    return Response.json({ plan });
  } catch (error) {
    return databaseError(error);
  }
}
