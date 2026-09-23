import { z } from "zod";
import { courses } from "@/lib/course-catalog";
import { establishGuardian, guardianUnauthorized } from "@/lib/guardian-auth";
import { resolveGuardianLink } from "@/lib/guardian-links";
import { toGuardianSummary } from "@/lib/guardian-view";
import { loadLearnerSummary } from "@/lib/progress-view";
import { databaseError, getDatabase } from "@/lib/server-database";

/*
 * The guardian's read of one learner's progress.
 *
 * Three conditions are checked on the server before any learner data is read: a guardian is
 * authenticated, an active link exists between that guardian and the learner, and the learner
 * belongs to the course the summary is built from. The learner is only ever reached through the
 * guardian's own link, so knowing a learner identifier is never enough. Revoking the link makes
 * the next request fail here, immediately.
 *
 * The summary is built by the same calculation the learner's own pages use, then reduced through
 * the strict allow list in lib/guardian-view.ts. Answers, code, defence responses, integrity
 * signals, marks and internal identifiers are not in that allow list, so they cannot leak.
 */

const querySchema = z.object({ link: z.string().min(1).max(64) });

export async function GET(request: Request) {
  try {
    const established = await establishGuardian(request);
    if (!established) return guardianUnauthorized();

    const parsed = querySchema.safeParse({
      link: new URL(request.url).searchParams.get("link") || "",
    });
    if (!parsed.success) {
      return Response.json({ error: "Choose a learner from your list." }, { status: 400 });
    }

    const database = getDatabase();
    const link = await resolveGuardianLink(database, established.account.id, parsed.data.link);
    if (!link) {
      return Response.json({ error: "That learner is not connected to you." }, { status: 403 });
    }

    /* Third condition: the learner must belong to the course used for the summary. The course
     * comes from the learner's own record, never from the request. */
    const course = courses[link.courseId as keyof typeof courses];
    if (!course) {
      return Response.json({ error: "This learning path is not available." }, { status: 409 });
    }

    /* The project the learner chose, so the record can name it. No other learner field is read
     * here, and no identifier leaves through the allow list. */
    const learnerRow = await database
      .prepare("SELECT theme FROM learner_profiles WHERE id = ?")
      .bind(link.learnerId)
      .first<{ theme: string }>();

    const summary = await loadLearnerSummary(database, {
      id: link.learnerId,
      courseId: link.courseId,
      theme: learnerRow?.theme || "",
    });
    if (!summary) {
      return Response.json({ error: "This learning path is not available." }, { status: 409 });
    }

    return Response.json({
      summary: toGuardianSummary(summary, {
        firstName: link.learnerName,
        courseGroup: course.courseFacts.ageRange,
      }),
    });
  } catch (error) {
    return databaseError(error);
  }
}