import { courses } from "@/lib/course-catalog";
import { establishGuardian, guardianUnauthorized } from "@/lib/guardian-auth";
import { guardianDisplay } from "@/lib/guardian-identity";
import { listGuardianLinks } from "@/lib/guardian-links";
import { databaseError, getDatabase } from "@/lib/server-database";

/*
 * The guardian's own account view.
 *
 * Reading this is what records a sign-in, so there is no separate sign-in call
 * and no password of any kind. The identity always comes from the platform
 * headers, which is why a caller cannot choose who they are.
 */

export async function GET(request: Request) {
  try {
    const established = await establishGuardian(request);
    if (!established) return guardianUnauthorized();

    const learners = await listGuardianLinks(getDatabase(), established.account.id);
    return Response.json({
      guardian: guardianDisplay(established.account),
      learners: learners.map((row) => ({
        linkRef: row.linkRef,
        firstName: row.learnerName,
        courseGroup: courses[row.courseId as keyof typeof courses]?.courseFacts.ageRange || "KidyCode",
        connectedAt: row.connectedAt,
      })),
    });
  } catch (error) {
    return databaseError(error);
  }
}