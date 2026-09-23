import { z } from "zod";
import { loadLearnerSummary } from "@/lib/progress-view";
import { authenticateLearner, databaseError, getDatabase, unauthorized } from "@/lib/server-database";

/* The only input is an optional learner id, which must match the authenticated learner. That
 * makes an attempt to read someone else's progress an explicit, testable rejection rather than a
 * silent empty answer. The summary itself is built by lib/progress-view.ts, which is also what
 * the Skills Passport, the certificate and the guardian summary read, so no two surfaces can
 * disagree about completion or certification. */
const querySchema = z.object({
  learnerId: z.string().min(1).max(64).optional(),
});

export async function GET(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();

    const parsed = querySchema.safeParse({
      learnerId: new URL(request.url).searchParams.get("learnerId") || undefined,
    });
    if (!parsed.success) {
      return Response.json({ error: "This progress request could not be read." }, { status: 400 });
    }
    if (parsed.data.learnerId && parsed.data.learnerId !== learner.id) {
      return Response.json({ error: "This progress belongs to another learner." }, { status: 403 });
    }

    const summary = await loadLearnerSummary(getDatabase(), learner);
    if (!summary) return Response.json({ error: "This learning path is not available." }, { status: 409 });

    return Response.json({ summary });
  } catch (error) {
    return databaseError(error);
  }
}