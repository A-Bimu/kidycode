import { deriveCertification, type Certification, type StoredAttempt } from "@/lib/certification";
import { buildCompletionRecord, type CompletionRecord } from "@/lib/completion";
import type { CourseBundle, Lesson, Stage } from "@/lib/course";
import { buildMilestones, type Milestone } from "@/lib/milestones";
import { buildPassport, defenceSummary, type SkillsPassport } from "@/lib/passport";
import { conceptFocusFor } from "@/lib/tutor";

/*
 * The progress summary is derived, never stored. Every figure here is computed
 * from rows the tutor, the review queue, the project checkpoints and the final
 * assessment already wrote, so there is no second copy of the truth to keep in
 * step.
 *
 * The module keeps learner facing labels plain on purpose: no school grade and
 * no figure that pretends to more precision than the evidence supports.
 */

export type ProgressInput = { lessonId: string; status: string; updatedAt: string };
export type EvidenceInput = {
  lessonId: string;
  mastery: number;
  successfulChecks: number;
  attempts: number;
  hintsRequested: number;
  independentCorrections: number;
  lastActivityAt: string;
  completedAt: string | null;
};
export type ReviewSummaryInput = {
  concept: string;
  label: string;
  lessonId: string;
  timesFailed: number;
  timesRecovered: number;
  reviewStreak: number;
  due: boolean;
};
export type CheckpointInput = {
  stageId: string;
  version: number;
  createdAt: string;
  /* False when the stored project JSON cannot be read. A corrupt version is
   * reported as needing another save rather than counting toward completion. */
  readable?: boolean;
};
export type ExamInput = { score: number; total: number; passed: boolean; createdAt: string };

export type SummaryInput = {
  /* The project the learner chose, needed for the completion record's title. */
  theme: string;
  progress: ProgressInput[];
  evidence: EvidenceInput[];
  reviews: ReviewSummaryInput[];
  checkpoints: CheckpointInput[];
  exams: ExamInput[];
  /* Assessment V2 evidence for the certificate, as stored. A summary built without it is
   * simply not certifiable, which fails closed. */
  certificationEvidence?: {
    attempts: StoredAttempt[];
    securedConcepts: Array<{ concept: string; label: string; itemId: string }>;
    credential: { issuedAt: string } | null;
  };
};

export const MASTERY_LABELS = {
  secure: "Secure",
  nearly: "Nearly secure",
  building: "Building confidence",
  started: "Just started",
} as const;

export type MasteryLabel = (typeof MASTERY_LABELS)[keyof typeof MASTERY_LABELS];

/* Plain bands rather than a percentage readout. The bands describe how much of
 * the available evidence has been earned, nothing more. */
export function masteryLabelFor(value: number): MasteryLabel {
  if (value >= 85) return MASTERY_LABELS.secure;
  if (value >= 50) return MASTERY_LABELS.nearly;
  if (value >= 1) return MASTERY_LABELS.building;
  return MASTERY_LABELS.started;
}

export type ModuleSummary = {
  id: string;
  number: number;
  title: string;
  outcome: string;
  lessonsTotal: number;
  lessonsCompleted: number;
  checksPassed: number;
  checksAvailable: number;
  mastery: number;
  masteryLabel: MasteryLabel;
  status: "not-started" | "in-progress" | "complete";
};

export type NextAction = {
  kind: "lesson" | "review" | "final-check" | "complete";
  title: string;
  detail: string;
  moduleNumber: number;
  lessonId: string | null;
};

export type Summary = {
  course: { id: string; title: string; ageRange: string; modulesTotal: number; lessonsTotal: number };
  courseProgress: {
    lessonsCompleted: number;
    lessonsTotal: number;
    checksPassed: number;
    checksAvailable: number;
    mastery: number;
    masteryLabel: MasteryLabel;
    completionLabel: MasteryLabel;
    status: "not-started" | "in-progress" | "complete";
  };
  modules: ModuleSummary[];
  needsReview: Array<{ concept: string; focus: string; label: string; lessonTitle: string; moduleNumber: number; timesFailed: number }>;
  strengthened: Array<{ concept: string; focus: string; label: string; timesRecovered: number; reviewStreak: number }>;
  independentCorrections: number;
  project: { checkpointsSaved: number; modulesTotal: number; label: MasteryLabel; latestAt: string | null };
  finalAssessment: { status: "not-started" | "attempted" | "passed"; attempts: number; bestScore: number; total: number };
  recentActivityAt: string | null;
  nextAction: NextAction;
  /* The one completion calculation, shared with the portfolio and the grown-up
   * view so the three can never disagree. */
  completion: CompletionRecord;
  /* The one certification calculation. Course completion and skills certification are
   * separate achievements: this record is the certificate, and it needs Assessment V2
   * and a passed code defence on top of the completion record above. */
  certification: Certification;
  /* The private Skills Passport, derived from the same evidence. */
  passport: SkillsPassport;
  /* Recent milestones, derived from the same evidence. */
  milestones: Milestone[];
};

function lessonChecksAvailable(lesson: Lesson): number {
  return (lesson.tests.length > 0 ? 1 : 0)
    + (lesson.question ? 1 : 0)
    + ((lesson.questions || []).length > 0 ? 1 : 0);
}

function latestOf(values: Array<string | null | undefined>): string | null {
  const usable = values.filter((value): value is string => typeof value === "string" && value.length > 0);
  if (usable.length === 0) return null;
  return usable.reduce((latest, value) => (value > latest ? value : latest));
}

function moduleStatus(completed: number, total: number, touched: boolean): ModuleSummary["status"] {
  if (total > 0 && completed >= total) return "complete";
  return touched ? "in-progress" : "not-started";
}

export function buildSummary(course: CourseBundle, input: SummaryInput): Summary {
  const evidenceByLesson = new Map(input.evidence.map((row) => [row.lessonId, row]));
  const completedLessons = new Set(input.progress.filter((row) => row.status === "completed").map((row) => row.lessonId));
  const touchesByLesson = new Set<string>([
    ...input.progress.map((row) => row.lessonId),
    ...input.evidence.map((row) => row.lessonId),
  ]);
  const courseLessonIds = new Set(course.lessons.map((lesson) => lesson.id));

  const modules: ModuleSummary[] = course.stages.map((stage: Stage) => {
    const lessons = stage.lessons;
    const completedInModule = lessons.filter((lesson) => completedLessons.has(lesson.id)).length;
    const checksAvailable = lessons.reduce((total, lesson) => total + lessonChecksAvailable(lesson), 0);
    const checksPassed = lessons.reduce((total, lesson) => {
      const row = evidenceByLesson.get(lesson.id);
      /* A completed activity can never count more checks than it offers, so a
       * repeated submission cannot inflate this figure. */
      return total + Math.min(row?.successfulChecks || 0, lessonChecksAvailable(lesson));
    }, 0);
    const masterySum = lessons.reduce((total, lesson) => total + Math.min(Math.max(evidenceByLesson.get(lesson.id)?.mastery || 0, 0), 100), 0);
    const mastery = lessons.length > 0 ? Math.round(masterySum / lessons.length) : 0;
    const touched = lessons.some((lesson) => touchesByLesson.has(lesson.id) || completedLessons.has(lesson.id));
    return {
      id: stage.id,
      number: stage.number,
      title: stage.title,
      outcome: stage.outcome,
      lessonsTotal: lessons.length,
      lessonsCompleted: completedInModule,
      checksPassed,
      checksAvailable,
      mastery,
      masteryLabel: masteryLabelFor(mastery),
      status: moduleStatus(completedInModule, lessons.length, touched),
    };
  });

  const lessonsTotal = course.lessons.length;
  const completedTotal = course.lessons.filter((lesson) => completedLessons.has(lesson.id)).length;
  const checksAvailable = course.lessons.reduce((total, lesson) => total + lessonChecksAvailable(lesson), 0);
  const checksPassed = course.lessons.reduce((total, lesson) => {
    const row = evidenceByLesson.get(lesson.id);
    return total + Math.min(row?.successfulChecks || 0, lessonChecksAvailable(lesson));
  }, 0);
  const masterySum = course.lessons.reduce(
    (total, lesson) => total + Math.min(Math.max(evidenceByLesson.get(lesson.id)?.mastery || 0, 0), 100),
    0,
  );
  const mastery = lessonsTotal > 0 ? Math.round(masterySum / lessonsTotal) : 0;

  const lessonsById = new Map(course.lessons.map((lesson) => [lesson.id, lesson]));
  const moduleOfLesson = new Map<string, Stage>();
  for (const stage of course.stages) {
    for (const lesson of stage.lessons) moduleOfLesson.set(lesson.id, stage);
  }

  const courseReviews = input.reviews.filter((row) => courseLessonIds.has(row.lessonId));
  const needsReview = courseReviews
    .filter((row) => row.due)
    .sort((left, right) => right.timesFailed - left.timesFailed || (left.label < right.label ? -1 : 1))
    .slice(0, 5)
    .map((row) => ({
      concept: row.concept,
      focus: focusFor(row.label),
      label: row.label,
      lessonTitle: lessonsById.get(row.lessonId)?.title || "An earlier lesson",
      moduleNumber: moduleOfLesson.get(row.lessonId)?.number || 1,
      timesFailed: row.timesFailed,
    }));
  const strengthened = courseReviews
    .filter((row) => !row.due || row.reviewStreak > 0)
    .sort((left, right) => right.reviewStreak - left.reviewStreak || right.timesRecovered - left.timesRecovered)
    .slice(0, 8)
    .map((row) => ({
      concept: row.concept,
      focus: focusFor(row.label),
      label: row.label,
      timesRecovered: row.timesRecovered,
      reviewStreak: row.reviewStreak,
    }));

  const courseStageIds = new Set(course.stages.map((stage) => stage.id));
  const courseCheckpoints = input.checkpoints.filter((row) => courseStageIds.has(row.stageId));
  /* A version whose stored JSON cannot be read is not a saved version. */
  const readableCheckpoints = courseCheckpoints.filter((row) => row.readable !== false);
  const savedStageIds = new Set(readableCheckpoints.map((row) => row.stageId));
  const savedStageTimes = new Map<string, string>();
  for (const row of readableCheckpoints) {
    const current = savedStageTimes.get(row.stageId);
    if (!current || row.createdAt > current) savedStageTimes.set(row.stageId, row.createdAt);
  }
  const completedLessonTimes = new Map<string, string>();
  for (const row of input.progress) {
    if (row.status !== "completed") continue;
    if (!courseLessonIds.has(row.lessonId)) continue;
    const current = completedLessonTimes.get(row.lessonId);
    if (!current || row.updatedAt > current) completedLessonTimes.set(row.lessonId, row.updatedAt);
  }
  const completion = buildCompletionRecord(course, {
    theme: input.theme,
    completedLessons: completedLessonTimes,
    savedModules: savedStageTimes,
    exams: input.exams,
  });
  const milestones = buildMilestones(course, {
    savedModules: savedStageTimes,
    exams: input.exams,
    completion,
  });

  /* Course completion and skills certification are separate. Both are derived here, from
   * evidence that already exists, so no surface can disagree with another. */
  const certificationEvidence = input.certificationEvidence || { attempts: [], securedConcepts: [], credential: null };
  const certification = deriveCertification({
    courseId: course.courseFacts.id,
    courseComplete: completion.complete,
    attempts: certificationEvidence.attempts.map((attempt) => ({
      attemptId: attempt.attemptId,
      status: "submitted",
      submittedAt: attempt.submittedAt,
      score: attempt.score,
      total: attempt.total,
      buildAwarded: attempt.buildAwarded,
      buildTotal: attempt.buildTotal,
      mandatoryPassed: attempt.mandatoryPassed,
      defenceStatus: attempt.defenceStatus,
    })),
  });
  const certificationAttempt = certificationEvidence.attempts.find((attempt) => attempt.attemptId === certification.attemptId) || null;
  const passport = buildPassport({
    course,
    completion,
    certification,
    modules,
    savedStageIds,
    securedConcepts: certificationEvidence.securedConcepts,
    attempt: certificationAttempt
      ? {
        score: certificationAttempt.score,
        total: certificationAttempt.total,
        buildAwarded: certificationAttempt.buildAwarded,
        buildTotal: certificationAttempt.buildTotal,
      }
      : null,
    defence: defenceSummary(certificationAttempt ? certificationAttempt.defenceStatus : "none"),
    credential: certificationEvidence.credential,
  });

  const bestScore = input.exams.reduce((best, attempt) => Math.max(best, attempt.score), 0);
  const passedExam = input.exams.some((attempt) => attempt.passed);

  const nextAction = recommendNext({
    course,
    completedLessons,
    needsReview,
    finalPassed: passedExam,
  });

  const completionLabel = masteryLabelFor(lessonsTotal > 0 ? Math.round((completedTotal / lessonsTotal) * 100) : 0);

  return {
    course: {
      id: course.courseFacts.id,
      title: course.courseFacts.title,
      ageRange: course.courseFacts.ageRange,
      modulesTotal: course.stages.length,
      lessonsTotal,
    },
    courseProgress: {
      lessonsCompleted: completedTotal,
      lessonsTotal,
      checksPassed,
      checksAvailable,
      mastery,
      masteryLabel: masteryLabelFor(mastery),
      completionLabel,
      status: moduleStatus(completedTotal, lessonsTotal, completedTotal > 0 || touchesByLesson.size > 0),
    },
    modules,
    needsReview,
    strengthened,
    independentCorrections: input.evidence.reduce((total, row) => total + Math.max(row.independentCorrections, 0), 0),
    project: {
      checkpointsSaved: savedStageIds.size,
      modulesTotal: course.stages.length,
      label: masteryLabelFor(course.stages.length > 0 ? Math.round((savedStageIds.size / course.stages.length) * 100) : 0),
      latestAt: latestOf(courseCheckpoints.map((row) => row.createdAt)),
    },
    finalAssessment: {
      status: passedExam ? "passed" : input.exams.length > 0 ? "attempted" : "not-started",
      attempts: input.exams.length,
      bestScore,
      total: course.finalExam.length,
    },
    recentActivityAt: latestOf([
      ...input.evidence.map((row) => row.lastActivityAt),
      ...input.progress.map((row) => row.updatedAt),
      ...courseCheckpoints.map((row) => row.createdAt),
      ...input.exams.map((row) => row.createdAt),
    ]),
    nextAction,
    completion,
    certification,
    passport,
    milestones,
  };
}

function recommendNext({ course, completedLessons, needsReview, finalPassed }: {
  course: CourseBundle;
  completedLessons: Set<string>;
  needsReview: Array<{ focus: string; lessonTitle: string }>;
  finalPassed: boolean;
}): NextAction {
  const stageOfLesson = new Map<string, Stage>();
  for (const stage of course.stages) {
    for (const lesson of stage.lessons) stageOfLesson.set(lesson.id, stage);
  }
  const nextLesson = course.lessons.find((lesson) => !completedLessons.has(lesson.id));
  const reviewNote = needsReview.length > 0
    ? ` Then come back to ${needsReview[0].focus}.`
    : "";

  if (nextLesson) {
    const stage = stageOfLesson.get(nextLesson.id);
    return {
      kind: "lesson",
      title: nextLesson.title,
      detail: `Module ${stage?.number || 1}. ${nextLesson.objective}${reviewNote}`,
      moduleNumber: stage?.number || 1,
      lessonId: nextLesson.id,
    };
  }
  if (!finalPassed) {
    return {
      kind: "final-check",
      title: "Take the final check",
      detail: "Every activity is complete. The final check covers the whole course and the code you repaired along the way.",
      moduleNumber: course.stages.length,
      lessonId: null,
    };
  }
  return {
    kind: "complete",
    title: "Course complete",
    detail: "You have finished every activity and passed the final check. Keep the project you built, and try it with your own content.",
    moduleNumber: course.stages.length,
    lessonId: null,
  };
}

/* The focus wording comes from the same concept rules the tutor uses, so the
 * words on the progress page match the words in the lesson. */
function focusFor(label: string): string {
  return conceptFocusFor(label);
}
