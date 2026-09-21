import { z } from "zod";
import { courses } from "@/lib/course-catalog";
import type { Lesson } from "@/lib/course";
import { clearerExplanationFor, conceptFocusFor, smallestHintFor } from "@/lib/tutor";
import {
  MAX_DUE_ITEMS,
  countDueReviews,
  loadDueReviews,
  loadReview,
  recordReviewOutcome,
  type ReviewRow,
} from "@/lib/review";
import { authenticateLearner, databaseError, getDatabase, unauthorized } from "@/lib/server-database";

const reviewSchema = z.object({
  concept: z.string().min(1).max(60),
  recalled: z.boolean(),
});

/* A review item is presented with the learner's own words for the idea, the
 * requirement that first exposed it, and the smallest hint available. */
function present(row: ReviewRow, lesson: Lesson | undefined) {
  return {
    concept: row.concept,
    label: row.label,
    focus: conceptFocusFor(row.label),
    hint: smallestHintFor(row.label),
    explanation: clearerExplanationFor(row.label),
    lessonId: row.lessonId,
    lessonTitle: lesson?.title || "An earlier lesson",
    moduleNumber: lesson?.activityNumber || 0,
    timesFailed: row.timesFailed,
    timesRecovered: row.timesRecovered,
    reviewStreak: row.reviewStreak,
    firstFailedAt: row.firstFailedAt,
    lastFailedAt: row.lastFailedAt,
  };
}

/* Only this learner's own items, and only for lessons on their own path. */
export async function GET(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();
    const course = courses[learner.courseId];
    if (!course) return Response.json({ error: "This learning path is not available." }, { status: 409 });

    const database = getDatabase();
    const lessonsById = new Map(course.lessons.map((lesson) => [lesson.id, lesson]));
    const rows = await loadDueReviews(database, learner.id);
    return Response.json({
      maxItems: MAX_DUE_ITEMS,
      totalDue: await countDueReviews(database, learner.id),
      items: rows
        .filter((row) => lessonsById.has(row.lessonId))
        .map((row) => present(row, lessonsById.get(row.lessonId))),
    });
  } catch (error) {
    return databaseError(error);
  }
}

export async function POST(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();
    const parsed = reviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: "This review answer could not be read." }, { status: 400 });
    }

    const database = getDatabase();
    const current = await loadReview(database, learner.id, parsed.data.concept);
    if (!current) {
      return Response.json({ error: "This item is not on your review list." }, { status: 403 });
    }

    const course = courses[learner.courseId];
    const lesson = course?.lessons.find((candidate) => candidate.id === current.lessonId);
    const now = new Date().toISOString();
    const updated = await recordReviewOutcome(database, learner.id, parsed.data.concept, parsed.data.recalled, now);
    const retired = Boolean(updated && !updated.due);

    return Response.json({
      recalled: parsed.data.recalled,
      retired,
      item: updated ? present(updated, lesson) : null,
      totalDue: await countDueReviews(database, learner.id),
    });
  } catch (error) {
    return databaseError(error);
  }
}