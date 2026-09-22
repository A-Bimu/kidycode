import { z } from "zod";
import { clientView, json, notReady } from "@/lib/assessment/api";
import { contentFor } from "@/lib/assessment/manifest";
import { countSubmittedAttempts, loadAttempt, loadOpenAttempt } from "@/lib/assessment/store";
import { authenticateLearner, databaseError, getDatabase, unauthorized } from "@/lib/server-database";

/*
 * Reading the state of an attempt, so an interrupted assessment can be resumed.
 *
 * The attempt is looked up by its id together with the authenticated learner id, in one
 * statement. Another learner's attempt therefore answers 404 and is indistinguishable
 * from one that does not exist, and no id can be guessed into somebody else's work.
 */

const querySchema = z.object({
  attempt: z.string().min(6).max(64).optional(),
  kind: z.enum(["module", "final"]).optional(),
  moduleId: z.string().min(1).max(120).optional(),
});

export async function GET(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();

    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      attempt: url.searchParams.get("attempt") || undefined,
      kind: url.searchParams.get("kind") || undefined,
      moduleId: url.searchParams.get("moduleId") || undefined,
    });
    if (!parsed.success) return json({ error: "That assessment request could not be read." }, 400);

    const database = getDatabase();
    const attempt = parsed.data.attempt
      ? await loadAttempt(database, learner.id, parsed.data.attempt)
      : await loadOpenAttempt(database, learner.id, learner.courseId, parsed.data.kind || "module", parsed.data.moduleId || null);
    /* An explicit id that is not this learner's attempt is not found. There is no
     * difference between somebody else's attempt and one that does not exist. */
    if (!attempt) {
      if (parsed.data.attempt) return json({ error: "That assessment was not found." }, 404);
      return json({ attempt: null, resumable: false });
    }

    const content = contentFor(learner.courseId);
    if (!content) return notReady();
    const view = clientView(attempt, content);
    if (!view) return notReady();
    const attemptCount = await countSubmittedAttempts(database, learner.id, learner.courseId, attempt.kind);
    return json({
      attempt: view,
      draft: safeJson(attempt.draftJson),
      attemptCount,
      resumable: attempt.status === "in_progress",
    });
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