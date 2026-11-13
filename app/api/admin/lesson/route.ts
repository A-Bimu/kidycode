import { adminLessonByKey } from "@/lib/admin-curriculum";
import { adminLessonIndex, type AdminLessonRef } from "@/lib/admin-curriculum";
import { lessonQuality } from "@/lib/admin-quality";
import { requireOwner } from "@/lib/admin-runtime";

/*
 * One lesson in full, for the owner's read-only preview.
 *
 * This is where the complete original content appears: objectives, notes, key terms, the
 * activity, the worked example and its explanation, starter files, every hint stage, every
 * automatic requirement, the rubric-equivalent requirement list, and the answer key with
 * each explanation. It is the same material the learner route renders, plus the answers.
 *
 * Nothing here writes. The route has no database access at all: it reads the curriculum from
 * source modules and returns it. Opening a lesson therefore cannot create a practice
 * submission, a progress row, a grade, a checkpoint or a certificate, because there is no
 * code path in this route that could.
 *
 * The response also carries the position of the lesson in its own pathway, so "View as
 * learner" can walk forward and back without a second lookup and without touching learner
 * state.
 */

function lessonRefFor(key: string): AdminLessonRef | null {
  return adminLessonByKey(key);
}

export async function GET(request: Request) {
  const guard = await requireOwner(request);
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const key = url.searchParams.get("key")?.trim() || "";
  if (!key || key.length > 240) {
    return Response.json({ error: "A lesson key is required." }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  }

  const ref = lessonRefFor(key);
  if (!ref) {
    return Response.json({ error: "That lesson is not part of the curriculum index." }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  }

  /* Neighbours come from the flat index so forward and back are exact, including across a
   * unit boundary, and the walked path is identical to the learner's pathway order. */
  const flat = adminLessonIndex();
  const position = flat.findIndex(entry => entry.key === ref.key);
  const previous = position > 0 ? flat[position - 1] : null;
  const next = position >= 0 && position < flat.length - 1 ? flat[position + 1] : null;

  return Response.json(
    {
      provenance: guard.provenance,
      readOnly: true,
      lesson: ref.lesson,
      location: {
        key: ref.key,
        pathwayId: ref.pathwayId,
        pathwayTitle: ref.pathwayTitle,
        ageRange: ref.ageRange,
        kind: ref.kind,
        unitIndex: ref.unitIndex,
        unitId: ref.unitId,
        unitTitle: ref.unitTitle,
        unitNumber: ref.unitNumber,
        positionInPathway: position,
        totalInPathway: flat.length,
      },
      neighbours: {
        previous: previous ? { key: previous.key, title: previous.lesson.title, pathwayTitle: previous.pathwayTitle } : null,
        next: next ? { key: next.key, title: next.lesson.title, pathwayTitle: next.pathwayTitle } : null,
      },
      quality: lessonQuality(ref),
      previewNotice: "Owner preview: this shows the real lesson content, including the answer key, and writes nothing anywhere.",
    },
    { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } },
  );
}
