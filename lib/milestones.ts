import type { CompletionRecord } from "@/lib/completion";
import type { CourseBundle } from "@/lib/course";

/*
 * Recent milestones.
 *
 * Derived, never stored: every line here is a restatement of evidence that already
 * exists, so there is no milestone table, no duplicate total and no unread state to
 * keep in step. Nothing in this module can leak code, a reflection, an answer or a
 * struggle, because none of those are inputs.
 */

export type Milestone = {
  kind: "module" | "final-assessment" | "course";
  label: string;
  at: string;
};

export const MAX_MILESTONES = 8;

export type MilestoneInput = {
  savedModules: Map<string, string>;
  exams: Array<{ passed: boolean; createdAt: string }>;
  completion: CompletionRecord;
};

export function buildMilestones(course: CourseBundle, input: MilestoneInput): Milestone[] {
  const milestones: Milestone[] = [];

  for (const stage of course.stages) {
    const at = input.savedModules.get(stage.id);
    if (at) milestones.push({ kind: "module", label: `Saved the Module ${stage.number} project version`, at });
  }

  /* Only the first passing attempt is a milestone. Later attempts are not events a
   * grown-up needs to see. */
  const firstPass = input.exams
    .filter((attempt) => attempt.passed)
    .sort((left, right) => (left.createdAt < right.createdAt ? -1 : 1))[0];
  if (firstPass) {
    milestones.push({ kind: "final-assessment", label: "Passed the final assessment", at: firstPass.createdAt });
  }

  if (input.completion.complete && input.completion.completedAt) {
    milestones.push({ kind: "course", label: "Completed the course", at: input.completion.completedAt });
  }

  return milestones
    .sort((left, right) => (left.at < right.at ? 1 : left.at > right.at ? -1 : 0))
    .slice(0, MAX_MILESTONES);
}

/* The grown-up sees the wording and the date, and nothing else. */
export type GuardianMilestone = { label: string; at: string };

export function toGuardianMilestones(milestones: Milestone[]): GuardianMilestone[] {
  return milestones.map((milestone) => ({ label: milestone.label, at: milestone.at }));
}
