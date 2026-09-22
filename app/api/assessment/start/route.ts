import { z } from "zod";
import { courses } from "@/lib/course-catalog";
import { clientView, json, notReady, readJson } from "@/lib/assessment/api";
import { finalFormOf, moduleFormOf, selectForm } from "@/lib/assessment/engine";
import { contentFor } from "@/lib/assessment/manifest";
import {
  countSubmittedAttempts,
  insertAttempt,
  loadFormHistory,
  loadOpenAttempt,
  loadRevisionItems,
  type AttemptRow,
} from "@/lib/assessment/store";
import { authenticateLearner, databaseError, getDatabase, unauthorized } from "@/lib/server-database";

/*
 * Starting or resuming an assessment.
 *
 * The course always comes from the authenticated learner. The module is validated
 * against that learner's own course, so a module id from another course is refused.
 * An open attempt is resumed rather than replaced, because opening the page twice must
 * not consume a form.
 */

const startSchema = z.object({
  kind: z.enum(["module", "final"]),
  moduleId: z.string().min(1).max(120).optional(),
});

export async function POST(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();

    const parsed = startSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return json({ error: "That assessment request could not be read." }, 400);
    }

    const course = courses[learner.courseId];
    const content = contentFor(learner.courseId);

    /* A module assessment belongs to one module of the learner's own course. The final
     * assessment covers the whole course, so no module is accepted for it. This is
     * checked before anything else, so a bad request is always a bounded 400. */
    let moduleId: string | null = null;
    if (parsed.data.kind === "module") {
      const stage = course?.stages.find((entry) => entry.id === parsed.data.moduleId);
      if (!stage) return json({ error: "That module is not part of your learning path." }, 400);
      moduleId = stage.id;
    }
    if (!course || !content) return notReady();

    const database = getDatabase();

    /* Per-module gate: the activities of that module must already be complete. The
     * final assessment waits for the whole course, exactly as the completion record
     * defines it. */
    const completed = await database
      .prepare("SELECT lesson_id AS lessonId FROM course_progress WHERE learner_id = ? AND status = 'completed'")
      .bind(learner.id)
      .all<{ lessonId: string }>();
    const completedIds = new Set(completed.results.map((row) => row.lessonId));
    if (parsed.data.kind === "module" && moduleId) {
      const stage = course.stages.find((entry) => entry.id === moduleId)!;
      const missing = stage.lessons.filter((lesson) => !completedIds.has(lesson.id));
      if (missing.length > 0) {
        return json({ error: `Finish the ${missing.length} remaining activit${missing.length === 1 ? "y" : "ies"} in Module ${stage.number} first.` }, 409);
      }
    }
    if (parsed.data.kind === "final") {
      if (!course.lessons.every((lesson) => completedIds.has(lesson.id))) {
        return json({ error: "Complete every activity in the course before the final applied assessment." }, 409);
      }
      const saved = await database
        .prepare("SELECT stage_id AS stageId FROM project_checkpoints WHERE learner_id = ?")
        .bind(learner.id)
        .all<{ stageId: string }>();
      const savedIds = new Set(saved.results.map((row) => row.stageId));
      const unsaved = course.stages.find((stage) => !savedIds.has(stage.id));
      if (unsaved) {
        return json({ error: `Save the Module ${unsaved.number} project version before the final applied assessment.` }, 409);
      }
    }

    /* Resume before selecting anything new. */
    const open = await loadOpenAttempt(database, learner.id, learner.courseId, parsed.data.kind, moduleId);
    const attemptCount = await countSubmittedAttempts(database, learner.id, learner.courseId, parsed.data.kind);
    if (open) {
      const view = clientView(open, content);
      if (!view) return notReady();
      return json({ attempt: view, resumed: true, draft: safeJson(open.draftJson), attemptCount });
    }

    /* A retake opens once the revision work from the previous attempt is marked
     * ready. There is no waiting period: readiness is a check, not a delay. */
    const gate = await retakeGate(database, learner.id, learner.courseId, content.moduleForms.length > 0);
    if (!gate.allowed) {
      return json({
        error: "Finish the revision work from your last assessment before taking a fresh form.",
        revision: gate.pending,
        nextStep: "Open the revision plan and pass the readiness check for each concept listed there.",
      }, 409);
    }

    const history = await loadFormHistory(database, learner.id, learner.courseId, parsed.data.kind, moduleId);
    const candidates: Array<{ id: string }> = parsed.data.kind === "module"
      ? content.moduleForms.filter((form) => form.moduleId === moduleId)
      : content.finalForms;
    const selected = selectForm(candidates, history);
    if (!selected) return notReady();

    const moduleForm = parsed.data.kind === "module" ? moduleFormOf(content, selected.id) : null;
    const finalForm = parsed.data.kind === "final" ? finalFormOf(content, selected.id) : null;
    if (parsed.data.kind === "module" && !moduleForm) return notReady();
    if (parsed.data.kind === "final" && !finalForm) return notReady();

    const form = moduleForm || finalForm!;
    const knowledgeTotal = form.knowledge.reduce((total, item) => total + item.marks, 0);
    const practicalTotal = moduleForm
      ? moduleForm.practical.requirements.reduce((total, entry) => total + entry.marks, 0)
      : 0;
    const debugTotal = finalForm
      ? finalForm.debug.reduce(
        (total, task) => total + task.requirements.reduce((sum, entry) => sum + entry.marks, 0),
        0,
      )
      : 0;
    const buildTotal = finalForm
      ? finalForm.build.requirements.reduce((total, entry) => total + entry.marks, 0)
      : 0;

    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    await insertAttempt(database, learner.id, {
      id,
      courseId: learner.courseId,
      kind: parsed.data.kind,
      moduleId,
      formId: form.id,
      contentVersion: content.contentVersion,
      draftJson: "{}",
      knowledgeTotal,
      practicalTotal,
      debugTotal,
      buildTotal,
      totalAvailable: knowledgeTotal + practicalTotal + debugTotal + buildTotal,
      startedAt: now,
    });

    const created: AttemptRow = {
      id,
      learnerId: learner.id,
      courseId: learner.courseId,
      kind: parsed.data.kind,
      moduleId,
      formId: form.id,
      contentVersion: content.contentVersion,
      status: "in_progress",
      stage: "knowledge",
      draftJson: "{}",
      answersJson: "[]",
      codeJson: "{}",
      knowledgeAwarded: 0,
      knowledgeTotal,
      practicalAwarded: 0,
      practicalTotal,
      debugAwarded: 0,
      debugTotal,
      buildAwarded: 0,
      buildTotal,
      totalAwarded: 0,
      totalAvailable: knowledgeTotal + practicalTotal + debugTotal + buildTotal,
      mandatoryPassed: 0,
      needsVerification: 0,
      defencePassed: 0,
      outcome: null,
      startedAt: now,
      savedAt: now,
      submittedAt: null,
    };
    const view = clientView(created, content);
    if (!view) return notReady();
    return json({ attempt: view, resumed: false, draft: {}, attemptCount });
  } catch (error) {
    return databaseError(error);
  }
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

/*
 * Readiness is checked against the learner's own revision queue only. An empty queue
 * means nothing is outstanding, so an assessment with no weak concepts never blocks.
 */
async function retakeGate(
  database: D1Database,
  learnerId: string,
  courseId: string,
  hasContent: boolean,
): Promise<{ allowed: boolean; pending: Array<{ concept: string; label: string }> }> {
  if (!hasContent) return { allowed: true, pending: [] };
  const rows = await loadRevisionItems(database, learnerId, courseId);
  const pending = rows
    .filter((row) => !row.readinessPassedAt)
    .map((row) => ({ concept: row.concept, label: row.label }));
  return { allowed: pending.length === 0, pending };
}

export const GET = POST;