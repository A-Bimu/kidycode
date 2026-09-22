import type { CourseBundle, WorkspaceFiles } from "@/lib/course";
import { buildCompletionRecord, projectTitleFor, type CompletionRecord } from "@/lib/completion";

/*
 * The learner's portfolio.
 *
 * This is the learner's own view of the website they have been building. It is
 * scoped to the course the learner is assigned to, ordered by the course module
 * order rather than by anything the database returned, and every stored value is
 * treated as untrusted: a checkpoint whose JSON cannot be read is reported as
 * needing another save instead of breaking the whole page.
 *
 * HTML, CSS and JavaScript are returned only here, only to the authenticated
 * learner, bounded in length, and never to a grown-up.
 */

export const MAX_PORTFOLIO_FILE_CHARS = 20000;

export type CheckpointRow = {
  stageId: string;
  version: number;
  projectJson: string;
  reflection: string;
  createdAt: string;
};

export type PortfolioModule = {
  stageId: string;
  number: number;
  title: string;
  outcome: string;
  skill: string;
  saved: boolean;
  readable: boolean;
  savedAt: string | null;
  version: number | null;
  hasReflection: boolean;
};

export type Portfolio = {
  project: { title: string; pitch: string; siteTitle: string; explanation: string };
  modules: PortfolioModule[];
  finalBuild: PortfolioModule | null;
  totals: { saved: number; required: number };
  completion: CompletionRecord;
};

export type ModuleDetail = {
  stageId: string;
  number: number;
  title: string;
  outcome: string;
  reflection: string;
  savedAt: string | null;
  files: WorkspaceFiles;
  truncated: boolean;
};

export type LearnerFacts = {
  theme: string;
  courseId: string;
};

/* A stored version is only usable if its JSON parses and carries text files. A
 * corrupt row is reported, not thrown. */
export function readCheckpointFiles(projectJson: string): WorkspaceFiles | null {
  try {
    const parsed = JSON.parse(projectJson) as Partial<WorkspaceFiles> & { theme?: unknown };
    if (!parsed || typeof parsed !== "object") return null;
    const files: WorkspaceFiles = {
      html: typeof parsed.html === "string" ? parsed.html : "",
      css: typeof parsed.css === "string" ? parsed.css : "",
      javascript: typeof parsed.javascript === "string" ? parsed.javascript : "",
    };
    if (files.html === "" && files.css === "" && files.javascript === "") return null;
    return files;
  } catch {
    return null;
  }
}

function bound(value: string): { text: string; truncated: boolean } {
  if (value.length <= MAX_PORTFOLIO_FILE_CHARS) return { text: value, truncated: false };
  return { text: value.slice(0, MAX_PORTFOLIO_FILE_CHARS), truncated: true };
}

/* One row per module, whichever way the database returned them. */
function latestByStage(rows: CheckpointRow[]): Map<string, CheckpointRow> {
  const latest = new Map<string, CheckpointRow>();
  for (const row of rows) {
    const current = latest.get(row.stageId);
    if (!current || row.createdAt > current.createdAt) latest.set(row.stageId, row);
  }
  return latest;
}

export function buildPortfolio(
  course: CourseBundle,
  learner: LearnerFacts,
  rows: CheckpointRow[],
  evidence: { completedLessons: Map<string, string>; exams: Array<{ score: number; passed: boolean; createdAt: string }> },
): Portfolio {
  const courseStageIds = new Set(course.stages.map((stage) => stage.id));
  const courseRows = rows.filter((row) => courseStageIds.has(row.stageId));
  const latest = latestByStage(courseRows);

  const savedModules = new Map<string, string>();

  const modules: PortfolioModule[] = course.stages.map((stage) => {
    const row = latest.get(stage.id);
    const readable = row ? readCheckpointFiles(row.projectJson) !== null : false;
    if (row && readable) savedModules.set(stage.id, row.createdAt);
    return {
      stageId: stage.id,
      number: stage.number,
      title: stage.title,
      outcome: stage.outcome,
      skill: stage.description,
      saved: Boolean(row),
      readable,
      savedAt: row ? row.createdAt : null,
      version: row ? row.version : null,
      hasReflection: Boolean(row && row.reflection.trim().length > 0),
    };
  });

  const choice = course.projectChoices.find((entry) => entry.id === learner.theme) || course.projectChoices[0];
  const totals = { saved: savedModules.size, required: course.stages.length };
  const finalStage = course.stages[course.stages.length - 1];
  const finalBuild = finalStage ? modules.find((module) => module.stageId === finalStage.id) || null : null;

  /* One calculation, shared with the progress page and the grown-up view. */
  const completion = buildCompletionRecord(course, {
    theme: learner.theme,
    completedLessons: evidence.completedLessons,
    savedModules,
    exams: evidence.exams,
  });

  return {
    project: {
      title: projectTitleFor(course, learner.theme),
      pitch: choice?.pitch || "",
      siteTitle: choice?.siteTitle || "",
      explanation: `You are building ${projectTitleFor(course, learner.theme)}. Every module adds a working part of the same website, and each saved version keeps the code you had at the end of that module.`,
    },
    modules,
    finalBuild,
    totals,
    completion,
  };
}

export function moduleDetail(
  course: CourseBundle,
  rows: CheckpointRow[],
  stageId: string,
): ModuleDetail | null {
  const stage = course.stages.find((entry) => entry.id === stageId);
  if (!stage) return null;
  const row = latestByStage(rows.filter((entry) => entry.stageId === stageId)).get(stageId);
  if (!row) return null;
  const files = readCheckpointFiles(row.projectJson);
  if (!files) return null;
  const html = bound(files.html);
  const css = bound(files.css);
  const javascript = bound(files.javascript);
  return {
    stageId: stage.id,
    number: stage.number,
    title: stage.title,
    outcome: stage.outcome,
    reflection: row.reflection.slice(0, 1200),
    savedAt: row.createdAt,
    files: { html: html.text, css: css.text, javascript: javascript.text },
    truncated: html.truncated || css.truncated || javascript.truncated,
  };
}