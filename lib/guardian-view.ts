import { toGuardianCertificate, type GuardianCertificate } from "@/lib/certification";
import { toGuardianCompletion, type GuardianCompletionRecord } from "@/lib/completion";
import { toGuardianMilestones, type GuardianMilestone } from "@/lib/milestones";
import { demonstratedSkills } from "@/lib/passport";
import type { Summary } from "@/lib/summary";

/*
 * The guardian view of a learner's progress.
 *
 * This is a strict allow list. Every field a guardian may read is named here,
 * and nothing else from the learner summary, the tutor evidence, the review
 * queue or the final assessment crosses this boundary. Adding a field is
 * therefore a deliberate decision rather than an accident of a spread.
 */

export type GuardianSummary = {
  learner: { firstName: string; courseGroup: string };
  activities: { completed: number; total: number; label: string };
  modules: Array<{ number: number; title: string; completed: number; total: number; masteryLabel: string }>;
  needsReview: Array<{ focus: string; moduleNumber: number }>;
  strengthened: Array<{ focus: string }>;
  project: { saved: number; total: number; label: string };
  finalAssessment: { status: "not-started" | "attempted" | "passed"; bestScore: number; total: number };
  lastActivityAt: string | null;
  nextLesson: { title: string; moduleNumber: number };
  /* The completion record, reduced to the facts a grown-up may read. It names no
   * code, no reflection, no answer and no identifier. */
  completion: GuardianCompletionRecord;
  /* The certificate, reduced to the facts a grown-up may read: the level, whether it has been
   * earned, the project it was earned on and the demonstrated skills. No marks, no attempt, no
   * credential internals and no code cross this boundary. */
  certificate: GuardianCertificate;
  /* Recent milestones: plain wording and a date, nothing more. */
  milestones: GuardianMilestone[];
};

export type GuardianLearnerFacts = {
  firstName: string;
  courseGroup: string;
};

export function toGuardianSummary(summary: Summary, learner: GuardianLearnerFacts): GuardianSummary {
  return {
    learner: { firstName: learner.firstName, courseGroup: learner.courseGroup },
    activities: {
      completed: summary.courseProgress.lessonsCompleted,
      total: summary.courseProgress.lessonsTotal,
      label: summary.courseProgress.completionLabel,
    },
    modules: summary.modules.map((module) => ({
      number: module.number,
      title: module.title,
      completed: module.lessonsCompleted,
      total: module.lessonsTotal,
      masteryLabel: module.masteryLabel,
    })),
    needsReview: summary.needsReview.map((item) => ({
      focus: item.focus,
      moduleNumber: item.moduleNumber,
    })),
    strengthened: summary.strengthened.map((item) => ({ focus: item.focus })),
    project: {
      saved: summary.project.checkpointsSaved,
      total: summary.project.modulesTotal,
      label: summary.project.label,
    },
    finalAssessment: {
      status: summary.finalAssessment.status,
      bestScore: summary.finalAssessment.bestScore,
      total: summary.finalAssessment.total,
    },
    lastActivityAt: summary.recentActivityAt,
    nextLesson: {
      title: summary.nextAction.title,
      moduleNumber: summary.nextAction.moduleNumber,
    },
    completion: toGuardianCompletion(summary.completion),
    certificate: toGuardianCertificate(summary.certification, {
      projectTitle: summary.completion.projectTitle,
      issuedAt: summary.passport.issuedAt,
      skills: demonstratedSkills(summary.passport),
    }),
    milestones: toGuardianMilestones(summary.milestones),
  };
}

/* Used by the tests and by the route guard below, so the allow list is enforced
 * in one place. */
export const GUARDIAN_SUMMARY_KEYS = [
  "learner",
  "activities",
  "modules",
  "needsReview",
  "strengthened",
  "project",
  "finalAssessment",
  "lastActivityAt",
  "nextLesson",
  "completion",
  "certificate",
  "milestones",
] as const;

/* Keys that must never appear anywhere in a guardian response, whatever the
 * learner summary happens to contain. The primary check is the allow list above;
 * this list names the specific things the phase forbids outright. */
export const GUARDIAN_FORBIDDEN_KEYS = [
  "code",
  "codeDigest",
  "workspace",
  "workspaceJson",
  "answers",
  "answersJson",
  "answer",
  "quizAnswers",
  "questionAnswer",
  "practical",
  "practicalJson",
  "session",
  "cookie",
  "kidycode_session",
  "accessHash",
  "learnerId",
  "guardianId",
  "linkId",
  "platformUserId",
  "interventions",
  "struggles",
  "struggleJson",
  "independentCorrections",
  "checksPassed",
  "checksAvailable",
  "timesFailed",
  "timesRecovered",
  "reviewStreak",
  "reflection",
  "projectJson",
  "codeDigestValue",
  "files",
  "html",
  "css",
  "javascript",
  "statement",
  "sessionCookie",
] as const;

/* Collects every key path in a value so a test can assert that nothing outside
 * the allow list is present anywhere in the response. */
export function collectKeys(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectKeys(entry, prefix));
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) => [
      key,
      ...collectKeys(entry, `${prefix}${key}.`),
    ]);
  }
  return [];
}
