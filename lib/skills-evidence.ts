import { getCourse } from "@/lib/course-catalog";
import type { CourseId } from "@/lib/course";
import { technologiesTaught } from "@/lib/completion";
import { transferEvidenceKinds, transferProjectBank, type TransferEvidenceKind } from "@/lib/transfer-projects";

/*
 * The Skills Evidence Record.
 *
 * A completion record says a course was finished. A Skills Evidence Record says what the
 * learner can actually do, and on what evidence that claim rests. It is built from the
 * contracts that already exist rather than from a new tally: the four transfer evidence
 * kinds come from the pathway's own transfer bank, the module work comes from the course's
 * project checkpoints, and the final measure comes from the assessment.
 *
 * Two rules are held in the shape of the record:
 *
 *   1. Every entry carries a provenance label, so a reader can tell designed evidence from
 *      a demonstration from evidence still pending a pilot.
 *   2. The record never asserts accreditation. `accreditation` is the literal false, and the
 *      certificate relationship is stated plainly as a separate, still pending gate.
 */

export type EvidenceSource = "transfer-project" | "module-project" | "final-assessment";
export type SkillsEvidenceKind = TransferEvidenceKind | "module-project" | "final-assessment";

export type SkillsEvidenceEntry = {
  kind: SkillsEvidenceKind;
  label: string;
  source: EvidenceSource;
  provenance: "real" | "demo" | "pending";
  statement: string;
};

export type SkillsEvidenceRecord = {
  recordName: "KidyCode Skills Evidence Record";
  courseId: CourseId;
  courseTitle: string;
  ageRange: string;
  technologies: string;
  entries: SkillsEvidenceEntry[];
  certificateRelationship: string;
  accreditation: false;
};

export const MODULE_PROJECT_PROVENANCE = "real" as const;

/* The four transfer kinds are described by the pathway's own bank, so the record cannot
 * drift from the transfer contract. */
export function skillsEvidenceRecord(courseId: CourseId): SkillsEvidenceRecord {
  const bundle = getCourse(courseId);
  const bank = transferProjectBank(courseId);

  const entries: SkillsEvidenceEntry[] = transferEvidenceKinds.map((kind) => ({
    kind,
    label: transferKindLabel[kind],
    source: "transfer-project",
    provenance: "real",
    statement: bank.evidence[kind],
  }));

  entries.push({
    kind: "module-project",
    label: "A working website that grew through the course",
    source: "module-project",
    provenance: MODULE_PROJECT_PROVENANCE,
    statement: `One saved, tested project version for each of the ${bundle.stages.length} ${bundle.courseFacts.title} modules, built from the four-lesson module and its project checkpoint.`,
  });

  entries.push({
    kind: "final-assessment",
    label: "A practical repair and a knowledge check",
    source: "final-assessment",
    provenance: "real",
    statement: `The course's final assessment: ${bundle.finalExam.length} knowledge questions and a practical repair, with a pass mark of ${bundle.courseFacts.passMark} out of 100.`,
  });

  return {
    recordName: "KidyCode Skills Evidence Record",
    courseId,
    courseTitle: bundle.courseFacts.title,
    ageRange: bundle.courseFacts.ageRange,
    technologies: technologiesTaught(bundle),
    entries,
    certificateRelationship:
      "A certificate is issued only by the eligibility check that reads the learner's own assessment record. No evidence entry in this record issues one, and the certificate wording is still pending institutional approval.",
    accreditation: false,
  };
}

const transferKindLabel: Record<TransferEvidenceKind, string> = {
  "independent-start": "Starts a new problem without being told where to begin",
  planning: "Writes a plan before building",
  "working-behaviour": "Tests in small changes and names what broke",
  "changed-requirement": "Keeps a working build working when the brief changes",
};

export function skillsEvidenceIssues(courseId: CourseId): string[] {
  const issues: string[] = [];
  const record = skillsEvidenceRecord(courseId);
  if (record.accreditation !== false) issues.push(`${courseId}: the record must never assert accreditation.`);
  for (const kind of transferEvidenceKinds) {
    if (!record.entries.some((entry) => entry.kind === kind)) issues.push(`${courseId}: the record is missing the ${kind} evidence.`);
  }
  if (!record.entries.some((entry) => entry.source === "module-project")) issues.push(`${courseId}: the record must name the module project evidence.`);
  if (!record.entries.some((entry) => entry.source === "final-assessment")) issues.push(`${courseId}: the record must name the final assessment evidence.`);
  for (const entry of record.entries) {
    if (entry.statement.trim().length < 40) issues.push(`${courseId}/${entry.kind}: state the evidence in full.`);
    if (!["real", "demo", "pending"].includes(entry.provenance)) issues.push(`${courseId}/${entry.kind}: the entry needs a provenance label.`);
  }
  if (!/pending institutional approval/i.test(record.certificateRelationship)) issues.push(`${courseId}: the record must state that the certificate wording is still pending.`);
  return issues;
}
