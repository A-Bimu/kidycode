import { z } from "zod";
import { attemptIdSchema, json, readJson } from "@/lib/assessment/api";
import { loadAttempt, recordSignals } from "@/lib/assessment/store";
import { authenticateLearner, databaseError, getDatabase, unauthorized } from "@/lib/server-database";

/*
 * The coarse integrity signals, on their own endpoint so a paste or a tab change is
 * recorded without pretending the work was saved.
 *
 * Four numbers and two timestamps are stored: visibility changes, paste events, the
 * character count of the largest paste, and when the work was saved. Clipboard
 * contents, keystrokes and content of any kind are never stored, and nothing here can
 * change a mark, a pass or a result.
 */

const bodySchema = z.object({
  attemptId: attemptIdSchema,
  visibilityChanges: z.number().int().min(0).max(200).optional(),
  pasteEvents: z.number().int().min(0).max(200).optional(),
  largestPasteChars: z.number().int().min(0).max(20000).optional(),
});

export async function POST(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();

    const parsed = bodySchema.safeParse(await readJson(request));
    if (!parsed.success) return json({ error: "That request could not be read." }, 400);

    const database = getDatabase();
    /* One learner may only record signals against their own attempt. */
    if (!(await loadAttempt(database, learner.id, parsed.data.attemptId))) {
      return json({ error: "That assessment was not found." }, 404);
    }

    await recordSignals(database, learner.id, parsed.data.attemptId, {
      visibilityChanges: parsed.data.visibilityChanges || 0,
      pasteEvents: parsed.data.pasteEvents || 0,
      largestPasteChars: parsed.data.largestPasteChars || 0,
      save: false,
    }, new Date().toISOString());

    return json({ recorded: true });
  } catch (error) {
    return databaseError(error);
  }
}