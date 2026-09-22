import { z } from "zod";
import { attemptIdSchema, json, readJson } from "@/lib/assessment/api";
import { loadAttempt, recordSignals, saveDraft } from "@/lib/assessment/store";
import { authenticateLearner, databaseError, getDatabase, unauthorized } from "@/lib/server-database";

/*
 * Autosave and the coarse integrity signals.
 *
 * Autosave writes the learner's own draft on their own open attempt. It never creates a
 * row, never creates a second attempt and never counts as an attempt, so a learner who
 * saves repeatedly is not disadvantaged.
 *
 * The signals are four numbers and two timestamps: how many times the page was hidden,
 * how many paste events happened, how large the largest paste was, and when the work
 * was saved. No clipboard contents, no keystrokes and no content of any kind is stored,
 * and a signal can never change a mark.
 */

const bodySchema = z.object({
  attemptId: attemptIdSchema,
  answers: z.array(z.number().int().min(-1).max(2)).max(20).optional(),
  code: z.record(z.unknown()).optional(),
  stage: z.enum(["knowledge", "practical", "review", "defence"]).optional(),
  visibilityChanges: z.number().int().min(0).max(200).optional(),
  pasteEvents: z.number().int().min(0).max(200).optional(),
  largestPasteChars: z.number().int().min(0).max(20000).optional(),
  signalOnly: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();

    const parsed = bodySchema.safeParse(await readJson(request));
    if (!parsed.success) return json({ error: "That save request could not be read." }, 400);

    const database = getDatabase();
    const now = new Date().toISOString();

    /* The attempt is read once, scoped to this learner. Without this the signal row
     * would be written with one learner's id against another learner's attempt, which
     * is exactly the kind of cross-learner row the delete sweep must never have to
     * clean up. */
    const attempt = await loadAttempt(database, learner.id, parsed.data.attemptId);
    if (!attempt) return json({ error: "That assessment was not found." }, 404);

    if (parsed.data.signalOnly) {
      await recordSignals(database, learner.id, parsed.data.attemptId, {
        visibilityChanges: parsed.data.visibilityChanges || 0,
        pasteEvents: parsed.data.pasteEvents || 0,
        largestPasteChars: parsed.data.largestPasteChars || 0,
        save: false,
      }, now);
      return json({ recorded: true });
    }

    /* A submitted attempt is never reopened by a late save, so the learner is told the
     * truth about their draft instead of being told it was kept. */
    if (attempt.status === "submitted") {
      return json({ saved: false, savedAt: null, reason: "This assessment has already been submitted." });
    }

    const draft = JSON.stringify({
      answers: parsed.data.answers || [],
      code: boundedDraftCode(parsed.data.code),
    }).slice(0, 60000);
    const saved = await saveDraft(database, learner.id, parsed.data.attemptId, draft, parsed.data.stage || "knowledge", now);
    await recordSignals(database, learner.id, parsed.data.attemptId, {
      visibilityChanges: parsed.data.visibilityChanges || 0,
      pasteEvents: parsed.data.pasteEvents || 0,
      largestPasteChars: parsed.data.largestPasteChars || 0,
      save: saved,
    }, now);

    /* A save against an attempt that is not this learner's, or one that has already
     * been submitted, changes no row. The learner is told their draft is not being kept
     * rather than being told a falsehood. */
    return json({ saved, savedAt: saved ? now : null });
  } catch (error) {
    return databaseError(error);
  }
}

function boundedDraftCode(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  let count = 0;
  for (const [key, entry] of Object.entries(record)) {
    if (count >= 6 || key.length === 0 || key.length > 120) continue;
    if (!entry || typeof entry !== "object") continue;
    const files = entry as Record<string, unknown>;
    const bounded: Record<string, string> = {};
    for (const file of ["html", "css", "javascript"]) {
      if (typeof files[file] === "string") bounded[file] = (files[file] as string).slice(0, 20000);
    }
    out[key] = bounded;
    count += 1;
  }
  return out;
}