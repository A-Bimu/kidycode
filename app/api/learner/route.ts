import { z } from "zod";
import { clearedSessionCookie } from "@/lib/access-keys";
import { authenticateLearner, databaseError, getDatabase, unauthorized } from "@/lib/server-database";

/*
 * Permanently deleting a learner profile.
 *
 * This is deliberately separate from DELETE /api/learners, which only clears this
 * device's session. Deleting is irreversible, so it needs an explicit confirmation
 * in the body as well as the two step confirmation in the interface, and it removes
 * every dependent row in one transaction rather than trusting a cascade to exist.
 *
 * Nothing here creates a replacement profile: after this, the learner starts again
 * only by choosing to.
 */

const bodySchema = z.object({ confirm: z.literal("delete my profile") });

/* Every table that belongs to a learner. Written out rather than inferred, so a new
 * table cannot be forgotten silently: the lifecycle test counts these tables. */
export const LEARNER_OWNED_TABLES = [
  "course_progress",
  "lesson_evidence",
  "tutor_interventions",
  "concept_review",
  "project_checkpoints",
  "exam_attempts",
  "guardian_links",
  "guardian_connect_codes",
  "learner_transfer_codes",
  /* Assessment V2. The attempt children are listed before the attempt itself so the
   * delete never depends on a cascade to stay consistent. */
  "assessment_item_results",
  "assessment_signals",
  "assessment_defence",
  "assessment_credentials",
  "assessment_revision_items",
  "assessment_attempts",
] as const;

export async function DELETE(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return Response.json({ error: "Permanent deletion needs an explicit confirmation." }, { status: 400 });
    }

    const database = getDatabase();
    /* One transaction: the learner's own rows, then the profile itself. */
    await database.batch([
      ...LEARNER_OWNED_TABLES.map((table) =>
        database.prepare(`DELETE FROM ${table} WHERE learner_id = ?`).bind(learner.id)),
      database.prepare("DELETE FROM learner_profiles WHERE id = ?").bind(learner.id),
    ]);

    const response = Response.json({ deleted: true, message: "This profile and everything saved with it has been deleted." });
    response.headers.append("set-cookie", clearedSessionCookie);
    return response;
  } catch (error) {
    return databaseError(error);
  }
}
