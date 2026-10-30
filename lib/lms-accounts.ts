import {
  GUARDIAN_EMAIL_HEADER,
  GUARDIAN_ID_HEADER,
  GUARDIAN_SIGN_IN_PATH,
  GUARDIAN_SIGN_OUT_PATH,
  readGuardianIdentity,
  type GuardianIdentity,
} from "@/lib/guardian-identity";
import { canActOn, isInstitutionRole, type InstitutionRole, type InstitutionScope, type Membership } from "@/lib/institution-roles";

/*
 * Signed-in LMS accounts, learner linking and persistent enrolments.
 *
 * The platform already forwards an authenticated identity on request headers. There is
 * no second sign-in: the same headers identify a grown-up and a member of an institution,
 * and the role decides what that identity may do. Nothing in a request body may claim an
 * identity, an organisation or a role.
 *
 * Everything in this module is a pure decision. The routes that write to the database
 * arrive with Day 2; what is fixed here is the rule they must follow.
 */

export const LMS_ID_HEADER = GUARDIAN_ID_HEADER;
export const LMS_EMAIL_HEADER = GUARDIAN_EMAIL_HEADER;
export const LMS_SIGN_IN_PATH = GUARDIAN_SIGN_IN_PATH;
export const LMS_SIGN_OUT_PATH = GUARDIAN_SIGN_OUT_PATH;

export const accountStatuses = ["invited", "active", "suspended"] as const;
export type AccountStatus = (typeof accountStatuses)[number];

export const enrolmentStatuses = ["active", "paused", "revoked"] as const;
export type EnrolmentStatus = (typeof enrolmentStatuses)[number];

export type LmsAccount = {
  id: string;
  platformUserId: string;
  organisationId: string;
  email: string;
  displayName: string | null;
  role: string;
  status: string;
};

export type Enrolment = {
  cohortId: string;
  learnerId: string;
  status: string;
};

/* The identity, read only from the platform headers. */
export function readLmsIdentity(request: Request): GuardianIdentity | null {
  return readGuardianIdentity(request);
}

export function isAccountStatus(value: string): value is AccountStatus {
  return (accountStatuses as readonly string[]).includes(value);
}

export function isEnrolmentStatus(value: string): value is EnrolmentStatus {
  return (enrolmentStatuses as readonly string[]).includes(value);
}

/*
 * The membership a signed-in identity holds. Ambiguity is refused rather than guessed: if
 * the same person holds an account in two organisations and no organisation is named, no
 * membership is returned, because guessing would cross the boundary in this file's first
 * promise.
 */
export function resolveMembership(identity: GuardianIdentity, accounts: LmsAccount[], organisationId?: string): Membership | null {
  const candidates = accounts.filter((account) => account.platformUserId === identity.platformUserId);
  const scoped = organisationId ? candidates.filter((account) => account.organisationId === organisationId) : candidates;
  if (organisationId && scoped.length === 0) return null;
  const active = scoped.filter((account) => account.status === "active" && isInstitutionRole(account.role));
  if (active.length !== 1) return null;
  const [account] = active;
  return { organisationId: account.organisationId, role: account.role as InstitutionRole, cohortIds: [] };
}

export function withCohorts(membership: Membership, cohortIds: string[]): Membership {
  return { ...membership, cohortIds: [...new Set(cohortIds)] };
}

export function activeCohortIds(enrolments: Array<{ cohortId: string; status: string }>): string[] {
  return [...new Set(enrolments.filter((row) => row.status === "active").map((row) => row.cohortId))];
}

/*
 * The cohorts a persisted assignment actually grants.
 *
 * This is the only source of a cohort-scoped grown-up's scope. It is deliberately not
 * derived from the organisation's cohort list: deriving it that way gave every lead,
 * instructor and reviewer in a school access to every cohort in that school, which is the
 * finding security PR #3 was opened for. A revoked row keeps the history but grants
 * nothing, and a member with no rows is granted no cohort at all, so the boundary fails
 * closed instead of guessing.
 */
export type CohortAssignment = { cohortId: string; status: string };

export function assignedCohortIds(assignments: CohortAssignment[]): string[] {
  return [...new Set(assignments.filter((row) => row.status === "active").map((row) => row.cohortId))];
}

/* The membership a request acts with: role and organisation from the account, cohorts only
 * from the assignment rows. */
export function membershipFromAssignments(membership: Membership, assignments: CohortAssignment[]): Membership {
  return withCohorts(membership, assignedCohortIds(assignments));
}

export type EnrolmentPlan =
  | { action: "insert"; reason: string }
  | { action: "reactivate"; reason: string }
  | { action: "revoke"; reason: string }
  | { action: "no-op"; reason: string }
  | { action: "refused"; reason: string };

export type EnrolmentRequest = {
  membership: Membership;
  organisationId: string;
  cohortId: string;
  learnerId: string;
  /* The enrolment row that already exists for this cohort and learner, if any. */
  current: Enrolment | null;
  wanted: "active" | "revoked";
};

/*
 * The enrolment decision, in one place.
 *
 * A learner link is durable: an existing row is never deleted, it is reactivated, so the
 * history of who was enrolled by which organisation survives. The actor check is the same
 * helper every institutional read uses, so an instructor cannot enrol a learner and a
 * coordinator cannot enrol into another organisation's cohort.
 */
export function planEnrolment(request: EnrolmentRequest): EnrolmentPlan {
  const target: InstitutionScope = { organisationId: request.organisationId, cohortId: request.cohortId };
  const mayEnrol = request.wanted === "active"
    ? canActOn(request.membership, "enrol_learner", target)
    : canActOn(request.membership, "revoke_enrolment", target);
  if (!mayEnrol) {
    return { action: "refused", reason: "This role may not change enrolments for that cohort." };
  }
  if (request.organisationId !== request.membership.organisationId) {
    return { action: "refused", reason: "Enrolments never cross an organisation." };
  }

  if (request.wanted === "active") {
    if (!request.current) return { action: "insert", reason: "A new learner link is created for this cohort." };
    if (request.current.status === "active") return { action: "no-op", reason: "This learner is already enrolled in this cohort." };
    if (request.current.learnerId !== request.learnerId) return { action: "refused", reason: "An enrolment row may not be reused for a different learner." };
    return { action: "reactivate", reason: "The existing learner link is reactivated and keeps its history." };
  }

  if (!request.current) return { action: "no-op", reason: "There is no learner link to revoke." };
  if (request.current.status === "revoked") return { action: "no-op", reason: "This learner link is already revoked." };
  return { action: "revoke", reason: "The learner link is revoked, and the row is kept." };
}

export type AssignmentPlan =
  | { action: "insert"; reason: string }
  | { action: "reactivate"; reason: string }
  | { action: "revoke"; reason: string }
  | { action: "no-op"; reason: string }
  | { action: "refused"; reason: string };

export type AssignmentRequest = {
  membership: Membership;
  organisationId: string;
  cohortId: string;
  /* The member row the assignment is for. The route has already checked that this member
   * belongs to the same organisation; the plan checks the actor's own scope. */
  current: { cohortId: string; memberId: string; status: string } | null;
  wanted: "active" | "revoked";
};

/*
 * The assignment decision, in one place.
 *
 * Only an organisation-scoped role holds assign_cohort, and canActOn still refuses an
 * organisation the actor does not belong to and a cohort it may not name, so a cohort lead
 * can neither assign itself into another cohort nor widen its own scope. An existing row is
 * reactivated rather than replaced, so the history of who was assigned and when survives.
 */
export function planAssignment(request: AssignmentRequest): AssignmentPlan {
  const target: InstitutionScope = { organisationId: request.organisationId, cohortId: request.cohortId };
  if (!canActOn(request.membership, "assign_cohort", target)) {
    return { action: "refused", reason: "This role may not change assignments for that cohort." };
  }
  if (request.organisationId !== request.membership.organisationId) {
    return { action: "refused", reason: "Assignments never cross an organisation." };
  }

  if (request.wanted === "active") {
    if (!request.current) return { action: "insert", reason: "A new cohort assignment is created for this member." };
    if (request.current.status === "active") return { action: "no-op", reason: "This member already works in this cohort." };
    return { action: "reactivate", reason: "The existing assignment is reactivated and keeps its history." };
  }

  if (!request.current) return { action: "no-op", reason: "There is no assignment to revoke." };
  if (request.current.status === "revoked") return { action: "no-op", reason: "This assignment is already revoked." };
  return { action: "revoke", reason: "The assignment is revoked, and the row is kept." };
}

/* The roles that may be granted inside an organisation, so a route cannot accept a role
 * that the boundary table does not describe. */
export function grantedRole(value: string): InstitutionRole | null {
  return isInstitutionRole(value) ? value : null;
}
