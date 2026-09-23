import { z } from "zod";
import { boundedCode, json, notReady, readJson } from "@/lib/assessment/api";
import { decideDefence, finalFormOf, gradeChange, predictionCorrect } from "@/lib/assessment/engine";
import { contentFor } from "@/lib/assessment/manifest";
import { defenceTemplateById, templatesFor } from "@/lib/assessment/defence";
import {
  flagAttemptDefence,
  loadAttempt,
  loadDefence,
  loadSignals,
  insertDefence,
  updateAttemptOutcome,
  updateDefence,
} from "@/lib/assessment/store";
import { authenticateLearner, databaseError, getDatabase, unauthorized } from "@/lib/server-database";
import type { CourseId } from "@/lib/course";

/*
 * The code defence at runtime.
 *
 * The template and its tasks are chosen by the server from the learner's own course and the
 * attempt they just sat, and the choice is recorded once so a resumed defence asks the same
 * questions. The client never selects a template, never sends a result and never sees an
 * answer: the prediction is marked against the reviewed index and the live change is marked by
 * the same deterministic requirement checker the rest of the engine uses. A change that cannot
 * be decided becomes Needs verification rather than a guess.
 */

const postSchema = z.object({
  attemptId: z.string().min(6).max(64),
  /* A draft saves the learner's work without deciding anything, so an interrupted defence
   * resumes at the step it was left on. Only a submit decides. */
  mode: z.enum(["draft", "submit"]).default("submit"),
  explain: z.string().max(2000).default(""),
  predictChoice: z.number().int().min(0).max(3).nullable().default(null),
  changeCode: z.object({
    html: z.string().max(20000).optional(),
    css: z.string().max(20000).optional(),
    javascript: z.string().max(20000).optional(),
  }).optional(),
});

async function context(request: Request) {
  const learner = await authenticateLearner(request);
  if (!learner) return { error: unauthorized() };
  const content = contentFor(learner.courseId);
  if (!content) return { error: notReady() };
  return { learner, content };
}

/*
 * The tasks this learner's attempt must answer. The signal counts choose only whether the
 * escalated prediction is added, and they can never take a task away or lower a mark.
 */
async function assign(database: D1Database, learnerId: string, courseId: string, attemptId: string) {
  const attempt = await loadAttempt(database, learnerId, attemptId);
  if (!attempt || attempt.courseId !== courseId) return null;
  /* Only the final applied assessment carries an independent-understanding check. A module
   * check never does. */
  if (attempt.kind !== "final") return null;

  const existing = await loadDefence(database, learnerId, attemptId);
  if (existing) {
    const template = defenceTemplateById(existing.templateId);
    return template ? { attempt, template, row: existing } : null;
  }

  /* The first template whose course matches, chosen from the attempt itself so a resumed
   * defence and a submitted one agree. */
  const owned = templatesFor(courseId as CourseId);
  if (owned.length === 0) return null;
  const index = [...attemptId].reduce((total, letter) => total + letter.charCodeAt(0), 0);
  const template = owned[index % owned.length];

  const signals = await loadSignals(database, learnerId, attemptId);
  const escalated = signals.pasteEvents > 0 && signals.largestPasteChars >= 120;
  const predict = escalated ? template.escalatedPredict : template.predict;

  await insertDefence(database, {
    attemptId,
    learnerId,
    courseId,
    templateId: template.id,
    explainItemId: template.explain.id,
    predictItemId: predict.id,
    predictExpected: String(predict.answer),
    changeItemId: template.change.id,
    changePrompt: (template.change.changeInstruction || template.change.prompt).slice(0, 600),
  }, new Date().toISOString());

  const row = await loadDefence(database, learnerId, attemptId);
  return row ? { attempt, template, row } : null;
}

/* The submitted files for one task of the attempt, so the change is graded against the
 * learner's own work. A malformed stored payload becomes empty files rather than an error. */
function safeFiles(codeJson: string, taskId: string) {
  try {
    const parsed = JSON.parse(codeJson) as Record<string, unknown>;
    const files = parsed?.[taskId];
    return files && typeof files === "object" ? (files as { html?: string; css?: string; javascript?: string }) : {};
  } catch {
    return {};
  }
}

/* The words that go with a stored decision, so a resumed defence explains itself even though
 * nothing is decided twice. */
function decisionCopy(status: string): { reason: string; nextStep: string } {
  if (status === "passed") {
    return {
      reason: "The explanation, the prediction and the live change all hold together.",
      nextStep: "Your independent-understanding check is complete for this assessment.",
    };
  }
  if (status === "needs-verification") {
    return {
      reason: "The change you made could not be checked automatically, so a person needs to look at it.",
      nextStep: "Keep your project as it is and ask your connected grown-up or your teacher to check the change with you.",
    };
  }
  return {
    reason: "The defence was not passed yet.",
    nextStep: "Read the task again, make the change in your own project, then try the defence once more.",
  };
}

export async function GET(request: Request) {
  try {
    const base = await context(request);
    if ("error" in base) return base.error;
    const attemptId = new URL(request.url).searchParams.get("attemptId") || "";
    if (attemptId.length < 6 || attemptId.length > 64) return json({ error: "That defence could not be found." }, 404);

    const assigned = await assign(getDatabase(), base.learner.id, base.learner.courseId, attemptId);
    if (!assigned) return json({ error: "That defence could not be found." }, 404);
    const { attempt, template, row } = assigned;
    const predict = row.predictItemId === template.escalatedPredict.id ? template.escalatedPredict : template.predict;

    return json({
      defence: {
        attemptId,
        attemptStatus: attempt.status,
        templateId: template.id,
        escalated: row.predictItemId === template.escalatedPredict.id,
        explain: { prompt: template.explain.prompt, snippet: template.explain.snippet },
        predict: { prompt: predict.prompt, snippet: predict.snippet, options: predict.options ?? [] },
        change: { prompt: template.change.prompt, instruction: template.change.changeInstruction ?? "", snippet: template.change.snippet },
        status: row.status,
        predictCorrect: Boolean(row.predictCorrect),
        changeStatus: row.changeStatus,
        explainResponse: row.explainResponse,
        /* Enough for the interface to put the learner back on the step they left, without
         * sending anything the learner should not see. */
        predictChoice: row.predictResponse === "" ? null : Number(row.predictResponse),
        changeSaved: row.changeCodeJson !== "{}",
        ...(row.status === "passed" || row.status === "not_passed" || row.status === "needs-verification"
          ? decisionCopy(row.status)
          : {}),
      },
    });
  } catch (error) {
    return databaseError(error);
  }
}

export async function POST(request: Request) {
  try {
    const base = await context(request);
    if ("error" in base) return base.error;

    const parsed = postSchema.safeParse(await readJson(request));
    if (!parsed.success) return json({ error: "That defence could not be read." }, 400);

    const database = getDatabase();
    const assigned = await assign(database, base.learner.id, base.learner.courseId, parsed.data.attemptId);
    if (!assigned) return json({ error: "That defence could not be found." }, 404);
    const { attempt, template, row } = assigned;

    if (attempt.kind !== "final" || attempt.status !== "submitted") {
      return json({ error: "Finish the assessment before the code defence." }, 409);
    }

    /* A defence already decided is reported rather than re-decided, so a repeated or
     * interrupted submission cannot turn a decision into a second one. The guidance is derived
     * from the stored status, so a learner who comes back still sees what happens next. */
    if (row.status === "passed" || row.status === "not_passed" || row.status === "needs-verification") {
      return json({
        decision: {
          status: row.status,
          predictCorrect: Boolean(row.predictCorrect),
          changeStatus: row.changeStatus,
          ...decisionCopy(row.status),
        },
        replay: true,
      });
    }

    const predict = row.predictItemId === template.escalatedPredict.id ? template.escalatedPredict : template.predict;

    /* A draft is saved as evidence and decides nothing: no marks, no outcome, no status. */
    if (parsed.data.mode === "draft") {
      const now = new Date().toISOString();
      await updateDefence(database, base.learner.id, parsed.data.attemptId, {
        explainResponse: parsed.data.explain,
        predictResponse: parsed.data.predictChoice === null ? "" : String(parsed.data.predictChoice),
        changeCodeJson: JSON.stringify(parsed.data.changeCode || {}),
        predictCorrect: Boolean(row.predictCorrect),
        changeStatus: row.changeStatus,
        status: row.status,
      }, now);
      return json({ draft: true, savedAt: now });
    }

    const prediction = predictionCorrect(predict, parsed.data.predictChoice);
    const build = finalFormOf(base.content, attempt.formId)?.build;
    if (!build) return notReady();
    /* The change is graded on the learner's own submitted project with the change applied, and
     * against that same submission as the baseline. */
    const submitted = safeFiles(attempt.codeJson, build.id);
    const change = gradeChange(template, { ...submitted, ...boundedCode(parsed.data.changeCode || {}) }, build, submitted);
    const decision = decideDefence({
      explain: parsed.data.explain,
      predictionCorrect: prediction.correct,
      changeStatus: change.status,
    });

    const now = new Date().toISOString();
    await updateDefence(database, base.learner.id, parsed.data.attemptId, {
      explainResponse: parsed.data.explain,
      predictResponse: String(parsed.data.predictChoice ?? ""),
      changeCodeJson: JSON.stringify(parsed.data.changeCode || {}),
      predictCorrect: prediction.correct,
      changeStatus: change.status,
      status: decision.status,
    }, now);

    await flagAttemptDefence(database, base.learner.id, parsed.data.attemptId, decision.status === "passed");
    /* The stored marks never move: only the outcome and its verification state are
     * recomputed, because passing the defence is part of passing the final assessment. */
    await updateAttemptOutcome(database, base.learner.id, parsed.data.attemptId, {
      outcome: decision.status === "passed" ? "passed" : decision.status === "needs-verification" ? "needs_verification" : "not_passed_yet",
      needsVerification: decision.status === "needs-verification",
      stage: decision.status === "passed" ? "done" : "review",
    });

    return json({
      decision: {
        status: decision.status,
        predictCorrect: decision.predictCorrect,
        changeStatus: decision.changeStatus,
        reason: decision.reason,
        nextStep: decision.nextStep,
        changeDetail: change.detail,
      },
      replay: false,
    });
  } catch (error) {
    return databaseError(error);
  }
}