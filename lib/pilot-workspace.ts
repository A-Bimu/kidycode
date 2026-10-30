import {
  canActOn,
  canRead,
  dataClasses,
  institutionActions,
  organisationScoped,
  type DataClass,
  type InstitutionAction,
  type InstitutionRole,
  type InstitutionScope,
  type Membership,
} from "@/lib/institution-roles";

/*
 * The institution pilot workspace.
 *
 * Day 1 fixed the shape and the rules: five roles, a closed-by-default permission table,
 * and a durable learner link. Day 2 owns the screen, and this module is that screen's
 * whole decision surface. It restates none of the rules: every read and every action is
 * answered by calling canRead or canActOn, so the workspace can never drift from the
 * boundary table in lib/institution-roles.ts.
 *
 * Two properties are encoded in the shape rather than in a comment:
 *
 *   1. A view is built for exactly one role inside exactly one organisation. Nothing is
 *      returned that the role cannot read, so a cohort-scoped grown-up cannot reach a
 *      cohort they do not work in, and no role reaches a second organisation.
 *   2. A learner code is never part of the workspace. Even an instructor who may read
 *      code reads it in the code view, not in a roster, so a summary can never widen into
 *      a copy of a learner's work.
 */

export type PilotOrganisation = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  status: string;
};

export type PilotMember = {
  id: string;
  organisationId: string;
  platformUserId: string;
  email: string;
  displayName: string | null;
  role: string;
  status: string;
};

export type PilotCohort = {
  id: string;
  organisationId: string;
  code: string;
  name: string;
  courseId: string;
  status: string;
};

export type PilotEnrolment = {
  cohortId: string;
  learnerId: string;
  status: string;
};

export type PilotLearnerFact = {
  learnerId: string;
  nickname: string;
  courseId: string;
};

export type PilotReview = {
  cohortId: string;
  learnerId: string;
  scope: string;
  outcome: string;
  decidedAt: string | null;
};

export type PilotWorkspaceInput = {
  organisation: PilotOrganisation | null;
  members: PilotMember[];
  cohorts: PilotCohort[];
  enrolments: PilotEnrolment[];
  learners: PilotLearnerFact[];
  reviews: PilotReview[];
};

export type PilotLearnerView = {
  /* A roster never carries a learner identifier or nickname unless the role may read a
   * learner identity. Otherwise the learner is shown by a stable, non-identifying label. */
  display: string;
  enrolmentStatus: string;
};

export type PilotReviewView = {
  scope: string;
  outcome: string;
  decidedAt: string | null;
};

export type PilotCohortView = {
  cohortId: string;
  code: string;
  name: string;
  courseId: string;
  status: string;
  enrolments: number;
  activeEnrolments: number;
  learners: PilotLearnerView[];
  reviews: PilotReviewView[];
};

export type PilotMemberView = {
  display: string;
  role: string;
  status: string;
};

export type PilotWorkspace = {
  organisation: { id: string; name: string; kind: string; status: string } | null;
  role: InstitutionRole;
  audience: "organisation" | "cohort";
  cohorts: PilotCohortView[];
  members: PilotMemberView[];
  capabilities: {
    mayRead: DataClass[];
    mayAct: InstitutionAction[];
  };
  /* Named plainly, so the screen can say what this role cannot see rather than leaving a
   * gap that looks like missing data. */
  hidden: string[];
  readOnly: boolean;
};

export const pilotSections = ["rosters", "progress", "evidence", "reviews", "certificate"] as const;
export type PilotSection = (typeof pilotSections)[number];

export function isPilotSection(value: string): value is PilotSection {
  return (pilotSections as readonly string[]).includes(value);
}

/* Everything the role may read inside this scope, answered by the boundary table. */
export function visibleDataClasses(membership: Membership, scope: InstitutionScope): DataClass[] {
  return dataClasses.filter((dataClass) => canRead(membership, dataClass, scope));
}

/* Everything the role may do inside this scope, answered by the boundary table. */
export function visibleActions(membership: Membership, scope: InstitutionScope): InstitutionAction[] {
  return institutionActions.filter((action) => canActOn(membership, action, scope));
}

/* A learner is named only where a learner identity may be read. A roster without that
 * permission still has to show that a place is taken, so the learner appears as a stable
 * label derived from the identifier, never the learner's own name. */
export function learnerDisplay(learnerId: string, nickname: string, mayReadIdentity: boolean): string {
  if (mayReadIdentity) return nickname.trim().length > 0 ? nickname.trim() : "Learner";
  const tail = learnerId.replace(/[^A-Za-z0-9]/g, "").slice(-4).toUpperCase();
  return `Learner ${tail || "----"}`;
}

/* A section is offered only when the role holds at least one permission that it needs. */
export function pilotNavigation(membership: Membership, scope: InstitutionScope): PilotSection[] {
  const read = visibleDataClasses(membership, scope);
  const act = visibleActions(membership, scope);
  const offered: PilotSection[] = [];
  if (read.includes("cohort_roster") || read.includes("organisation_roster")) offered.push("rosters");
  if (read.includes("progress_summary")) offered.push("progress");
  if (read.includes("assessment_evidence")) offered.push("evidence");
  if (act.includes("record_academic_review") || act.includes("decide_academic_review")) offered.push("reviews");
  /* The certificate screen is a status view only: no role issues a certificate from here,
   * and reviewIssuesCertificate() always answers no. */
  offered.push("certificate");
  return offered;
}

/* Every scope this membership actually works in: its own organisation, plus each cohort it
 * holds. A cohort-scoped role has no answer at the organisation scope on its own, so asking
 * only there would report a cohort lead who is reading a roster as able to read nothing. */
function membershipScopes(membership: Membership): InstitutionScope[] {
  return [
    { organisationId: membership.organisationId },
    ...membership.cohortIds.map((cohortId) => ({ organisationId: membership.organisationId, cohortId })),
  ];
}

/* Everything the role may read somewhere inside the organisation it belongs to. */
export function readableDataClasses(membership: Membership): DataClass[] {
  const scopes = membershipScopes(membership);
  return dataClasses.filter((dataClass) => scopes.some((scope) => canRead(membership, dataClass, scope)));
}

/* Everything the role may do somewhere inside the organisation it belongs to. */
export function actionableActions(membership: Membership): InstitutionAction[] {
  const scopes = membershipScopes(membership);
  return institutionActions.filter((action) => scopes.some((scope) => canActOn(membership, action, scope)));
}

function hiddenLabels(mayRead: DataClass[]): string[] {
  const hidden: string[] = [];
  if (!mayRead.includes("learner_identity")) hidden.push("learner identities");
  if (!mayRead.includes("learner_code")) hidden.push("learner code");
  if (!mayRead.includes("assessment_evidence")) hidden.push("assessment evidence");
  if (!mayRead.includes("organisation_roster")) hidden.push("the organisation member list");
  return hidden;
}

export function buildPilotWorkspace(membership: Membership, input: PilotWorkspaceInput): PilotWorkspace {
  /* The workspace is always scoped to the membership's own organisation. A cohort-scoped
   * role is answered per cohort through canRead, so this scope is only the organisation. */
  const scope: InstitutionScope = { organisationId: membership.organisationId };
  /* The member list is the only read that is genuinely organisation wide, so it is the only
   * one answered at the organisation scope. Everything else is answered per cohort, because a
   * cohort-scoped role has no answer at the organisation scope and must not be refused a
   * cohort it does work in. */
  const mayReadMembers = canRead(membership, "organisation_roster", scope);

  const nicknameOf = new Map(input.learners.map((learner) => [learner.learnerId, learner.nickname]));
  const organisation = input.organisation && input.organisation.id === membership.organisationId ? input.organisation : null;

  const cohorts: PilotCohortView[] = [];
  /* Cohorts are only included when this role may read the roster of that cohort. A
   * cohort-scoped lead therefore sees only the cohorts they actually work in. */
  for (const cohort of input.cohorts) {
    if (cohort.organisationId !== membership.organisationId) continue;
    const cohortScope: InstitutionScope = { organisationId: membership.organisationId, cohortId: cohort.id };
    if (!canRead(membership, "cohort_roster", cohortScope)) continue;
    const mayReadIdentityHere = canRead(membership, "learner_identity", cohortScope);
    const mayReadEvidenceHere = canRead(membership, "assessment_evidence", cohortScope);
    const rows = input.enrolments.filter((row) => row.cohortId === cohort.id);
    cohorts.push({
      cohortId: cohort.id,
      code: cohort.code,
      name: cohort.name,
      courseId: cohort.courseId,
      status: cohort.status,
      enrolments: rows.length,
      activeEnrolments: rows.filter((row) => row.status === "active").length,
      learners: rows.map((row) => ({
        display: learnerDisplay(row.learnerId, nicknameOf.get(row.learnerId) || "", mayReadIdentityHere),
        enrolmentStatus: row.status,
      })),
      reviews: mayReadEvidenceHere
        ? input.reviews
            .filter((review) => review.cohortId === cohort.id)
            .map((review) => ({ scope: review.scope, outcome: review.outcome, decidedAt: review.decidedAt }))
        : [],
    });
  }

  const members: PilotMemberView[] = mayReadMembers
    ? input.members
        .filter((member) => member.organisationId === membership.organisationId && member.status === "active")
        .map((member) => ({ display: member.displayName || member.email.split("@")[0], role: member.role, status: member.status }))
    : [];

  /* The capabilities and the hidden list are answered across every scope the role works in,
   * so a cohort lead is described as reading their cohort rather than as reading nothing. */
  const mayRead = readableDataClasses(membership);
  const mayAct = actionableActions(membership);
  const hidden = hiddenLabels(mayRead);
  return {
    organisation: organisation ? { id: organisation.id, name: organisation.name, kind: organisation.kind, status: organisation.status } : null,
    role: membership.role,
    /* The audience is the role's scope, not whether the role happens to hold cohorts. An
     * organisation-scoped role reads the whole organisation, so it is never presented as a
     * cohort view merely because its readable cohort set is non-empty. */
    audience: organisationScoped.includes(membership.role) ? "organisation" : "cohort",
    cohorts,
    members,
    capabilities: { mayRead, mayAct },
    hidden,
    readOnly: mayAct.length === 0,
  };
}
