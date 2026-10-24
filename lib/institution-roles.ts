/*
 * Institution roles and the data boundaries around them.
 *
 * The rules are data, and every decision is a pure function, so the boundaries can be
 * proved without a database and can be reused by any route that reads institutional
 * data. Two promises are encoded here rather than left to a route:
 *
 *   1. No role crosses an organisation. Not the organisation administrator, not a
 *      reviewer, not a support path. A request is always scoped to the organisation the
 *      signed-in member actually belongs to.
 *   2. A reviewer decides from evidence, never from a copy of the learner's work. Only
 *      an instructor or a cohort lead may read learner code, and only inside their own
 *      cohort. Nobody may issue a certificate from inside a review: issuing stays a
 *      separate, eligibility-gated step.
 */

export const institutionRoles = [
  "organisation_admin",
  "programme_coordinator",
  "cohort_lead",
  "instructor",
  "academic_reviewer",
] as const;
export type InstitutionRole = (typeof institutionRoles)[number];

export const institutionActions = [
  "manage_organisation",
  "manage_members",
  "create_cohort",
  "enrol_learner",
  "revoke_enrolment",
  "read_cohort_roster",
  "read_progress_summary",
  "read_assessment_evidence",
  "read_learner_identity",
  "read_learner_code",
  "record_academic_review",
  "decide_academic_review",
  "issue_certificate",
] as const;
export type InstitutionAction = (typeof institutionActions)[number];

/* The kinds of information a role may be shown. Naming the class, not the table, keeps
 * the rule readable and keeps it stable when the schema moves. */
export const dataClasses = [
  "organisation_roster",
  "cohort_roster",
  "progress_summary",
  "assessment_evidence",
  "learner_identity",
  "learner_code",
] as const;
export type DataClass = (typeof dataClasses)[number];

type PermissionTable = Record<InstitutionRole, Record<InstitutionAction, boolean>>;

const allowed = (actions: InstitutionAction[]): Record<InstitutionAction, boolean> =>
  Object.fromEntries(institutionActions.map((action) => [action, actions.includes(action)])) as Record<InstitutionAction, boolean>;

/* The one permission table. A role that is not listed for an action is refused, so a new
 * action arrives refused everywhere until it is granted deliberately. */
export const permissions: PermissionTable = {
  organisation_admin: allowed(["manage_organisation", "manage_members", "create_cohort", "revoke_enrolment", "read_cohort_roster", "read_progress_summary"]),
  programme_coordinator: allowed(["create_cohort", "enrol_learner", "revoke_enrolment", "read_cohort_roster", "read_progress_summary", "read_learner_identity"]),
  cohort_lead: allowed(["enrol_learner", "revoke_enrolment", "read_cohort_roster", "read_progress_summary", "read_assessment_evidence", "read_learner_identity", "read_learner_code"]),
  instructor: allowed(["read_cohort_roster", "read_progress_summary", "read_assessment_evidence", "read_learner_identity", "read_learner_code"]),
  academic_reviewer: allowed(["read_cohort_roster", "read_progress_summary", "read_assessment_evidence", "record_academic_review", "decide_academic_review"]),
};

const roleDataClasses: Record<InstitutionRole, DataClass[]> = {
  organisation_admin: ["organisation_roster", "cohort_roster", "progress_summary"],
  programme_coordinator: ["cohort_roster", "progress_summary", "learner_identity"],
  cohort_lead: ["cohort_roster", "progress_summary", "assessment_evidence", "learner_identity", "learner_code"],
  instructor: ["cohort_roster", "progress_summary", "assessment_evidence", "learner_identity", "learner_code"],
  academic_reviewer: ["cohort_roster", "progress_summary", "assessment_evidence"],
};

/* A role is either scoped to the whole organisation or to the cohorts it works in. Every
 * role is scoped to one organisation. */
export const organisationScoped: InstitutionRole[] = ["organisation_admin", "programme_coordinator"];
export const cohortScoped: InstitutionRole[] = ["cohort_lead", "instructor", "academic_reviewer"];

export type InstitutionScope = {
  organisationId: string;
  cohortId?: string | null;
};

export type Membership = {
  organisationId: string;
  role: InstitutionRole;
  cohortIds: string[];
};

export function isInstitutionRole(value: string): value is InstitutionRole {
  return (institutionRoles as readonly string[]).includes(value);
}

export function canPerform(role: InstitutionRole, action: InstitutionAction): boolean {
  return permissions[role][action] === true;
}

export function mayRead(role: InstitutionRole, dataClass: DataClass): boolean {
  return roleDataClasses[role].includes(dataClass);
}

/*
 * The scope test. It is deliberately fail-closed: a missing organisation on either side
 * is refused, and a cohort-scoped role must name a cohort it actually works in. No role
 * is exempt, including the organisation administrator.
 */
export function withinScope(membership: Membership, target: InstitutionScope): boolean {
  if (!membership.organisationId || !target.organisationId) return false;
  if (membership.organisationId !== target.organisationId) return false;
  if (organisationScoped.includes(membership.role)) return true;
  if (!target.cohortId) return false;
  return membership.cohortIds.includes(target.cohortId);
}

/*
 * A single decision, so a route cannot ask two questions and answer one of them
 * differently: the role must hold the permission, and the request must be inside the
 * scope. Reading learner code additionally requires an explicit cohort, because a
 * summary view must never widen into a copy of a learner's work.
 */
export function canActOn(membership: Membership, action: InstitutionAction, target: InstitutionScope): boolean {
  if (!canPerform(membership.role, action)) return false;
  if (!withinScope(membership, target)) return false;
  if (action === "read_learner_code") return Boolean(target.cohortId);
  return true;
}

export function canRead(membership: Membership, dataClass: DataClass, target: InstitutionScope): boolean {
  if (!mayRead(membership.role, dataClass)) return false;
  if (!withinScope(membership, target)) return false;
  if (dataClass === "learner_code") return Boolean(target.cohortId);
  return true;
}

/*
 * Certificates are a separate gate. An academic review is a decision about evidence; it
 * is not a certificate, and no role may convert one into a credential here.
 */
export const reviewOutcomes = ["pending", "more-evidence-needed", "approved", "not-yet"] as const;
export type ReviewOutcome = (typeof reviewOutcomes)[number];

export const certificateGateReason =
  "A certificate is issued only by the eligibility check that reads the learner's own assessment record. A review outcome never issues one.";

/* Deliberately takes no argument and always answers no. A caller that wants a certificate
 * must go through the eligibility check, not through a review outcome. */
export function reviewIssuesCertificate(): false {
  return false;
}
