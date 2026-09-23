import type { Certification } from "@/lib/certification";
import { ASSESSMENT_PASS_MARK, CERTIFICATION_STATUS_LABELS } from "@/lib/certification";
import type { CompletionRecord } from "@/lib/completion";
import type { CourseBundle } from "@/lib/course";
import type { ModuleSummary } from "@/lib/summary";

/*
 * The private Skills Passport.
 *
 * Everything here is derived from evidence the app already wrote: completed activities, the
 * module project versions, the graded assessment requirements and the code defence. Nothing
 * is stored a second time, and no skill can be awarded by hand, edited by the learner or
 * inferred from a page visit.
 *
 * The wording is deliberately plain. A figure is never the only explanation of a skill.
 */

export type PassportSkillSource = {
  kind: "module" | "project" | "assessment" | "defence";
  label: string;
};

export type PassportSkill = {
  name: string;
  /* demonstrated: the evidence for it exists. still-to-demonstrate: it does not yet. */
  status: "demonstrated" | "still-to-demonstrate";
  evidence: string;
  sources: PassportSkillSource[];
};

export type PassportAssessment = {
  status: "not-taken" | "below" | "passed";
  label: string;
  detail: string;
};

export type PassportDefence = {
  status: "not-started" | "pending" | "not_passed" | "passed";
  label: string;
  detail: string;
};

export type SkillsPassport = {
  certificateName: string;
  level: string | null;
  certificationStatus: Certification["status"];
  certificationLabel: string;
  courseCompletion: { complete: boolean; label: string; completedAt: string | null };
  projectTitle: string;
  skills: PassportSkill[];
  assessment: PassportAssessment;
  defence: PassportDefence;
  issuedAt: string | null;
  /* One useful next action while certification is incomplete. */
  nextAction: { label: string; detail: string };
};

export type PassportInput = {
  course: CourseBundle;
  completion: CompletionRecord;
  certification: Certification;
  modules: ModuleSummary[];
  /* Stage ids with a readable saved project version. */
  savedStageIds: Set<string>;
  /* The reviewed concepts the learner has secured in Assessment V2, with the module the
   * concept belongs to where it is known. */
  securedConcepts: Array<{ concept: string; label: string; itemId: string }>;
  attempt: { score: number; total: number; buildAwarded: number; buildTotal: number } | null;
  defence: PassportDefence;
  credential: { issuedAt: string } | null;
};

const MAX_SKILLS = 10;

function moduleSkill(module: ModuleSummary | undefined, saved: boolean): PassportSkill | null {
  if (!module) return null;
  const allActivitiesDone = module.lessonsTotal > 0 && module.lessonsCompleted >= module.lessonsTotal;
  const demonstrated = allActivitiesDone && saved;
  const sources: PassportSkillSource[] = [];
  if (allActivitiesDone) {
    sources.push({ kind: "module", label: `Module ${module.number}: every activity completed` });
  }
  if (saved) {
    sources.push({ kind: "project", label: `Module ${module.number}: project version saved` });
  }
  return {
    name: module.title,
    status: demonstrated ? "demonstrated" : "still-to-demonstrate",
    evidence: demonstrated
      ? `Completed every activity in Module ${module.number} and saved a project version that shows this skill.`
      : allActivitiesDone
        ? `Every activity in Module ${module.number} is done. Save a project version to show this skill.`
        : `Module ${module.number} has ${module.lessonsTotal - module.lessonsCompleted} activity or activities still to finish.`,
    sources,
  };
}

function assessmentSkill(entry: { concept: string; label: string }): PassportSkill {
  return {
    name: entry.label,
    status: "demonstrated",
    evidence: "Graded as met by the assessment for the work you handed in.",
    sources: [{ kind: "assessment", label: "Assessment V2 requirement met" }],
  };
}

export function buildPassport(input: PassportInput): SkillsPassport {
  const moduleSkills = input.course.stages
    .map((stage) => moduleSkill(input.modules.find((module) => module.id === stage.id), input.savedStageIds.has(stage.id)))
    .filter((skill): skill is PassportSkill => skill !== null);

  /* Assessment skills are the reviewed concepts the learner actually secured. A concept is
   * listed once, however many items carried it. */
  const seenConcepts = new Set<string>();
  const assessmentSkills: PassportSkill[] = [];
  for (const entry of input.securedConcepts) {
    if (seenConcepts.has(entry.label)) continue;
    seenConcepts.add(entry.label);
    assessmentSkills.push(assessmentSkill(entry));
  }

  const skills = [...moduleSkills, ...assessmentSkills].slice(0, MAX_SKILLS);

  const assessment: PassportAssessment = input.attempt
    ? input.attempt.score >= ASSESSMENT_PASS_MARK
      ? {
        status: "passed",
        label: "Assessment passed",
        detail: `Result ${input.attempt.score} out of ${input.attempt.total}. Your independent build scored ${input.attempt.buildAwarded} out of ${input.attempt.buildTotal}.`,
      }
      : {
        status: "below",
        label: "Assessment below the pass mark",
        detail: `Result ${input.attempt.score} out of ${input.attempt.total}. The revision pages for the skills that need work come first.`,
      }
    : {
      status: "not-taken",
      label: "Assessment not taken",
      detail: "The assessment covers the whole course and is needed for the certificate.",
    };

  return {
    certificateName: input.certification.certificateName,
    level: input.certification.level,
    certificationStatus: input.certification.status,
    certificationLabel: CERTIFICATION_STATUS_LABELS[input.certification.status],
    courseCompletion: {
      complete: input.completion.complete,
      label: input.completion.complete ? "Course completed" : "Course still to complete",
      completedAt: input.completion.completedAt,
    },
    projectTitle: input.completion.projectTitle,
    skills,
    assessment,
    defence: input.defence,
    issuedAt: input.credential ? input.credential.issuedAt : null,
    nextAction: input.certification.nextAction,
  };
}

/* The short list of demonstrated skills the certificate prints. Only demonstrated skills,
 * in course order, capped so the page stays one page. */
export function demonstratedSkills(passport: SkillsPassport, limit = 6): string[] {
  return passport.skills
    .filter((skill) => skill.status === "demonstrated")
    .map((skill) => skill.name)
    .slice(0, limit);
}

/* Plain language for the defence, used by the passport. Never a bare verdict: what happened
 * and what to do next. */
export function defenceSummary(status: "none" | "pending" | "not_passed" | "passed"): PassportDefence {
  switch (status) {
    case "passed":
      return {
        status: "passed",
        label: "Code defence passed",
        detail: "You explained your own work, predicted what a small change would do and made it work.",
      };
    case "not_passed":
      return {
        status: "not_passed",
        label: "Code defence not passed yet",
        detail: "Revise the part that needs work, then try a fresh equivalent defence.",
      };
    case "pending":
      return {
        status: "pending",
        label: "Code defence unfinished",
        detail: "Your saved answers are kept. Open the defence and finish it when you are ready.",
      };
    default:
      return {
        status: "not-started",
        label: "Code defence not started",
        detail: "The defence is needed for the certificate. It opens after the final assessment is submitted.",
      };
  }
}
