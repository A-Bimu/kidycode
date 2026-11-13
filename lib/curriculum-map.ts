import { courses } from "@/lib/course-catalog";
import { codingCourseIds, type Provenance } from "@/lib/learning-experience";
import { designCourses } from "@/lib/design-course";
import { buildOutside } from "@/lib/build-outside";
import { transferEvidenceKinds, transferProjectBanks } from "@/lib/transfer-projects";

/*
 * The KidyCode curriculum map.
 *
 * The map answers one question for a learner, a guardian or an institution: what is taught
 * here, in what order, and what evidence each part produces. It is derived from the courses
 * and programmes themselves, so a module added to a pathway appears here without an edit.
 *
 * Every pathway carries a provenance label and every covered pathway names its transfer
 * contract, so a reader can tell a published pathway from a demonstration from work still
 * pending a supervised pilot.
 */

export type CurriculumUnit = {
  id: string;
  number: number;
  title: string;
  outcome: string;
  activities: number;
};

export type CurriculumPathway = {
  id: string;
  kind: "coding" | "design" | "tooling";
  title: string;
  ageRange: string;
  units: CurriculumUnit[];
  project: string;
  assessment: string;
  transfer: { title: string; projects: string[]; evidence: string[] } | null;
  provenance: Provenance;
};

export type CurriculumGate = { label: string; statement: string };

export type CurriculumMap = {
  pathways: CurriculumPathway[];
  totals: { pathways: number; units: number; activities: number };
  gates: CurriculumGate[];
};

export function curriculumMap(): CurriculumMap {
  const pathways: CurriculumPathway[] = codingCourseIds.map((courseId) => {
    const bundle = courses[courseId];
    const bank = transferProjectBanks.find((candidate) => candidate.courseId === courseId) || null;
    return {
      id: courseId,
      kind: "coding",
      title: bundle.courseFacts.title,
      ageRange: bundle.courseFacts.ageRange,
      units: bundle.stages.map((stage) => ({
        id: stage.id,
        number: stage.number,
        title: stage.title,
        outcome: stage.outcome,
        activities: stage.lessons.length,
      })),
      project: bundle.projectChoices.map((choice) => choice.title).join(", "),
      assessment: `${bundle.finalExam.length} final questions and one practical repair, pass mark ${bundle.courseFacts.passMark}`,
      transfer: bank
        ? {
            title: `${bank.pathwayTitle} transfer bank`,
            projects: bank.projects.map((project) => project.title),
            evidence: [...transferEvidenceKinds],
          }
        : null,
      provenance: "real",
    };
  });

  for (const design of designCourses.slice(0, 1)) {
    pathways.push({
      id: design.id,
      kind: "design",
      title: design.title,
      ageRange: "Ages 10 and above",
      units: design.modules.map((module) => ({
        id: module.id,
        number: module.number,
        title: module.title,
        outcome: module.outcome,
        activities: module.lessons.length,
      })),
      project: "A studio brief per module, ending in a one-page presentation of the finished design.",
      assessment: "A short reasoning check after each lesson; no code workspace and no code test.",
      transfer: null,
      provenance: "demo",
    });
  }

  pathways.push({
    id: buildOutside.id,
    kind: "tooling",
    title: buildOutside.title,
    ageRange: "Ages 13 and above, supervised",
    units: buildOutside.stations.map((station) => ({
      id: station.id,
      number: station.order,
      title: station.title,
      outcome: station.why,
      activities: 1,
    })),
    project: "Move one working page into real files, a real editor, version control, GitHub and a published link.",
    assessment: "A practice task and a check per station; accounts and publishing are supervised.",
    transfer: null,
    provenance: "pending",
  });

  const totals = {
    pathways: pathways.length,
    units: pathways.reduce((total, pathway) => total + pathway.units.length, 0),
    activities: pathways.reduce((total, pathway) => total + pathway.units.reduce((sum, unit) => sum + unit.activities, 0), 0),
  };

  return {
    pathways,
    totals,
    gates: [
      { label: "Provenance", statement: "Every pathway is labelled real, demo or pending, and the label is shown wherever the pathway is offered." },
      { label: "Transfer", statement: "A pathway is complete only when it names a transfer contract with all four evidence kinds, so a skill can be proved on a new problem." },
      { label: "Supervision", statement: "The Build Outside station that creates real accounts and publishes a page runs only with guardian consent and a controlled pilot." },
      { label: "Certificate", statement: "Certificate wording stays pending written institutional approval, and no university association or co-branding is used before it exists." },
    ],
  };
}

export function curriculumMapIssues(): string[] {
  const issues: string[] = [];
  const map = curriculumMap();
  if (map.pathways.length < 6) issues.push("the map must list the four pathways and the two new programmes.");
  for (const pathway of map.pathways) {
    if (pathway.units.length < 1) issues.push(`${pathway.id}: the pathway has no units.`);
    const numbers = pathway.units.map((unit) => unit.number);
    if (Math.min(...numbers) !== 1 || new Set(numbers).size !== numbers.length) issues.push(`${pathway.id}: the units must be numbered from 1 without repeats.`);
    if (pathway.project.trim().length < 20) issues.push(`${pathway.id}: name the project or studio work.`);
    if (pathway.assessment.trim().length < 20) issues.push(`${pathway.id}: state how the pathway is assessed.`);
    /* A coding pathway must name its transfer contract; the design and tooling programmes
     * are single-discipline and deliberately have none. */
    if (pathway.kind === "coding" && !pathway.transfer) issues.push(`${pathway.id}: a coding pathway must name its transfer contract.`);
    if (pathway.transfer && pathway.transfer.evidence.length !== transferEvidenceKinds.length) {
      issues.push(`${pathway.id}: the transfer contract must name all four evidence kinds.`);
    }
  }
  if (map.totals.units !== map.pathways.reduce((total, pathway) => total + pathway.units.length, 0)) issues.push("the totals must match the pathways.");
  if (map.gates.length < 4) issues.push("the map must name its gates.");
  return issues;
}
