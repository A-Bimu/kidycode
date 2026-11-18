import { readInstitutionIdentity } from "@/lib/institution-identity";
import { isInstitutionRole, organisationScoped } from "@/lib/institution-roles";
import {
  buildPilotWorkspace,
  type PilotCohort,
  type PilotEnrolment,
  type PilotLearnerFact,
  type PilotMember,
  type PilotReview,
  type PilotWorkspaceInput,
} from "@/lib/pilot-workspace";
import { assignedCohortIds, resolveMembership, withCohorts } from "@/lib/lms-accounts";
import { databaseError, getDatabase } from "@/lib/server-database";

/*
 * The institution pilot workspace.
 *
 * The identity comes from the platform headers, never from a parameter or a body, so a
 * caller cannot choose who they are. The organisation is named in the query only to select
 * between two memberships the same person genuinely holds; it can never widen a scope,
 * because resolveMembership refuses an organisation the identity does not belong to.
 *
 * The response is built entirely by buildPilotWorkspace, which answers every read and every
 * action through canRead and canActOn. The route therefore holds no copy of the rules.
 */

type MemberRow = PilotMember;

function accountRow(row: MemberRow) {
  return {
    id: row.id,
    platformUserId: row.platformUserId,
    organisationId: row.organisationId,
    email: row.email,
    displayName: row.displayName,
    role: row.role,
    status: row.status,
  };
}

export async function GET(request: Request) {
  try {
    const identity = await readInstitutionIdentity(request);
    if (!identity) return Response.json({ error: "Sign in to open the pilot workspace." }, { status: 401 });

    const database = getDatabase();
    const url = new URL(request.url);
    const requestedOrganisation = url.searchParams.get("organisation")?.trim() || undefined;

    const memberRows = await database
      .prepare(
        "SELECT id, organisation_id AS organisationId, platform_user_id AS platformUserId, email, display_name AS displayName, role, status FROM organisation_members WHERE platform_user_id = ?",
      )
      .bind(identity.platformUserId)
      .all<MemberRow>();
    const accounts = (memberRows.results ?? []).map(accountRow);

    const membership = resolveMembership(identity, accounts, requestedOrganisation);
    if (!membership || !isInstitutionRole(membership.role)) {
      return Response.json(
        { error: "No single active membership was found for this identity.", organisations: [...new Set(accounts.map((account) => account.organisationId))] },
        { status: 403 },
      );
    }

    const organisation = await database
      .prepare("SELECT id, slug, name, kind, status FROM organisations WHERE id = ?")
      .bind(membership.organisationId)
      .first<PilotWorkspaceInput["organisation"]>();

    const cohortRows = await database
      .prepare(
        "SELECT id, organisation_id AS organisationId, code, name, course_id AS courseId, status FROM cohorts WHERE organisation_id = ? AND status = 'active'",
      )
      .bind(membership.organisationId)
      .all<PilotCohort>();
    const cohorts = cohortRows.results ?? [];

    /* A cohort-scoped grown-up works only in the cohorts they are assigned to, read from
     * member_cohort_assignments. The list is never derived from the organisation's cohorts:
     * doing that granted every lead, instructor and reviewer in a school access to every
     * cohort in it, which is the finding security PR #3 was opened for. A member with no
     * active assignment is granted no cohort, so the boundary fails closed.
     *
     * Organisation-scoped roles are answered at the organisation scope by the permission
     * table, so their readable cohort set is the organisation's own active cohorts. That is
     * the same boundary they already held: no cohort outside the organisation can appear,
     * because the query is bound to the membership's organisation id. */
    const memberAccount = accounts.find(
      (account) => account.organisationId === membership.organisationId && account.platformUserId === identity.platformUserId,
    );
    const assignmentRows = memberAccount
      ? await database
          .prepare("SELECT cohort_id AS cohortId, status FROM member_cohort_assignments WHERE member_id = ? AND status = 'active'")
          .bind(memberAccount.id)
          .all<{ cohortId: string; status: string }>()
      : { results: [] as Array<{ cohortId: string; status: string }> };
    const scoped = organisationScoped.includes(membership.role)
      ? withCohorts(membership, cohorts.map((cohort) => cohort.id))
      : withCohorts(membership, assignedCohortIds(assignmentRows.results ?? []));

    const cohortIds = scoped.cohortIds;
    const enrolmentRows = cohortIds.length
      ? await database
          .prepare(
            `SELECT cohort_id AS cohortId, learner_id AS learnerId, status FROM cohort_enrolments WHERE cohort_id IN (${cohortIds.map(() => "?").join(", ")})`,
          )
          .bind(...cohortIds)
          .all<PilotEnrolment>()
      : { results: [] as PilotEnrolment[] };
    const enrolments = enrolmentRows.results ?? [];

    const learnerIds = [...new Set(enrolments.map((row) => row.learnerId))];
    const learnerRows = learnerIds.length
      ? await database
          .prepare(`SELECT id AS learnerId, nickname, course_id AS courseId FROM learner_profiles WHERE id IN (${learnerIds.map(() => "?").join(", ")})`)
          .bind(...learnerIds)
          .all<PilotLearnerFact>()
      : { results: [] as PilotLearnerFact[] };

    const reviewRows = cohortIds.length
      ? await database
          .prepare(
            `SELECT cohort_id AS cohortId, learner_id AS learnerId, scope, outcome, decided_at AS decidedAt FROM academic_reviews WHERE cohort_id IN (${cohortIds.map(() => "?").join(", ")})`,
          )
          .bind(...cohortIds)
          .all<PilotReview>()
      : { results: [] as PilotReview[] };

    const memberList = await database
      .prepare(
        "SELECT id, organisation_id AS organisationId, platform_user_id AS platformUserId, email, display_name AS displayName, role, status FROM organisation_members WHERE organisation_id = ? AND status = 'active'",
      )
      .bind(membership.organisationId)
      .all<MemberRow>();

    const workspace = buildPilotWorkspace(scoped, {
      organisation: organisation ?? null,
      members: memberList.results ?? [],
      cohorts,
      enrolments,
      learners: learnerRows.results ?? [],
      reviews: reviewRows.results ?? [],
    });

    return Response.json({ workspace });
  } catch (error) {
    return databaseError(error);
  }
}
