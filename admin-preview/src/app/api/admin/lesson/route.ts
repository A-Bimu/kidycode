import { adminLessonByKey, adminLessonIndex, type AdminLessonRef } from "@/lib/admin-curriculum";
import { lessonQuality } from "@/lib/admin-quality";
import { requireOwner } from "@/lib/preview-runtime";

/*
 * One lesson in full, for the owner's read-only preview — the Node twin of
 * app/api/admin/lesson/route.ts.
 *
 * Nothing here writes, and there is no database access at all: opening a lesson therefore
 * cannot create a practice submission, a progress row, a grade, a checkpoint or a
 * certificate, because there is no code path in this route that could.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
