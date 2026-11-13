import { adminLessonIndex, adminPathways } from "@/lib/admin-curriculum";
import { curriculumQuality } from "@/lib/admin-quality";
import { requireOwner } from "@/lib/admin-runtime";

/*
 * The curriculum index for the owner console.
 *
 * Read only. It returns every pathway, unit and lesson the console can open, together with
 * the heuristic quality flags for each lesson, so the explorer can search, filter and sort
 * without a second request. Full lesson content - notes, examples, hints, answer keys - is
 * fetched by /api/admin/lesson only when a lesson is opened.
 *
 * The answer keys are present in this payload by design: this is the owner console and the
 * brief asks the owner to inspect them. The route is owner-gated before anything is built,
 * the response is marked no-store, and nothing here is ever rendered on a learner route.
 */
export async function GET(request: Request) {
  const guard = await requireOwner(request);
  if (!guard.ok) return guard.response;

  const pathways = adminPathways();
  const refs = adminLessonIndex();
  const quality = curriculumQuality(refs);
  const qualityByKey = new Map(quality.lessons.map(entry => [entry.key, entry]));

  const lessons = refs.map(ref => ({
    key: ref.key,
    pathwayId: ref.pathwayId,
    unitIndex: ref.unitIndex,
    unitTitle: ref.unitTitle,
    unitNumber: ref.unitNumber,
    lessonId: ref.lesson.id,
    title: ref.lesson.title,
    type: ref.lesson.type,
    language: ref.lesson.language,
    minutes: ref.lesson.minutes,
    questionCount: ref.lesson.questions.length,
    hasAnswerKey: ref.lesson.questions.length > 0,
    flags: qualityByKey.get(ref.key)?.flags.map(flag => flag.code) ?? [],
  }));

  return Response.json(
    {
      provenance: guard.provenance,
      source: "lib/course-* and lib/design-course.ts, the same modules the learner routes render",
      readOnly: true,
      generatedAt: new Date().toISOString(),
      pathways,
      lessons,
      totals: {
        pathways: pathways.length,
        units: pathways.reduce((total, pathway) => total + pathway.units.length, 0),
        lessons: lessons.length,
        withQuestions: lessons.filter(lesson => lesson.hasAnswerKey).length,
      },
      quality: {
        heuristic: quality.heuristic,
        note: quality.note,
        totalLessons: quality.totalLessons,
        lessonsWithFlags: quality.lessonsWithFlags,
        flagCounts: quality.flagCounts,
        duplicatePromptCount: quality.duplicates.length,
      },
    },
    { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } },
  );
}
