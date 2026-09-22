import { json } from "@/lib/assessment/api";
import { REFERENCE_RULES, referenceSectionsFor } from "@/lib/assessment/reference-sheet";
import { authenticateLearner, databaseError, unauthorized } from "@/lib/server-database";

/*
 * The built-in reference sheet.
 *
 * General syntax only, served from the server so the client cannot extend what it is
 * allowed to read, and identical for every learner because it contains nothing specific
 * to a question or a task.
 */

export async function GET(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();
    return json({ rules: REFERENCE_RULES, sections: referenceSectionsFor() });
  } catch (error) {
    return databaseError(error);
  }
}