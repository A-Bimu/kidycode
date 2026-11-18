import { adminLessonIndex, adminPathways } from "@/lib/admin-curriculum";
import { curriculumQuality } from "@/lib/admin-quality";
import { requireOwner } from "@/lib/preview-runtime";

/*
 * The curriculum index for the owner console — read only, identical in shape to
 * app/api/admin/curriculum/route.ts.
 *
 * The pathway, unit and lesson content all comes from the vendored copy of the same source
 * modules the learner routes render, so what the owner reviews here is the real curriculum
 * and not a sample. The answer keys are present by design: this is the owner console and the
 * brief asks the owner to inspect them. Nothing here reads or writes a database.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
      source: "lib/course-* and lib/design-course.ts, the same modules the learner routes render (vendored unchanged for this review build)",
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
