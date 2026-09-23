import { z } from "zod";
import { json, readJson, badRequest, notFound } from "@/lib/assessment/api";
import { gradePractice, gradeReadiness, toClientRevisionPack } from "@/lib/assessment/engine";
import { contentFor } from "@/lib/assessment/manifest";
import { assessedConcepts, revisionPackFor } from "@/lib/assessment/revision";
import { loadRevisionItems, markReadiness } from "@/lib/assessment/store";
import { authenticateLearner, databaseError, getDatabase, unauthorized } from "@/lib/server-database";

/*
 * The revision page for one concept.
 *
 * Identity and course both come from the authenticated learner, so a concept that belongs to
 * another course is refused even though the id looks valid. The page is served without any
 * answer index, and the marking happens here, so the learner only learns what was right after
 * they have answered. Nothing on this route can change a stored mark: practice and readiness
 * are formative.
 */

const answerSchema = z.array(z.number().int().min(-1).max(2)).max(4);

const postSchema = z.object({
  concept: z.string().min(3).max(120),
  kind: z.enum(["practice", "readiness"]),
  answers: answerSchema,
});

function conceptFor(concept: string, courseId: string) {
  const content = contentFor(courseId as never);
  if (!content) return null;
  if (!assessedConcepts(content).some((entry) => entry.concept === concept)) return null;
  return revisionPackFor(concept);
}

export async function GET(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();

    const concept = new URL(request.url).searchParams.get("concept") || "";
    if (concept.length < 3 || concept.length > 120) return badRequest("That revision page could not be read.");
    const pack = conceptFor(concept, learner.courseId);
    if (!pack) return notFound("That revision page is not part of your learning path.");

    const rows = await loadRevisionItems(getDatabase(), learner.id, learner.courseId);
    const mine = rows.find((row) => row.concept === concept) || null;
    return json({ pack: toClientRevisionPack(pack, mine?.readinessPassedAt ?? null) });
  } catch (error) {
    return databaseError(error);
  }
}

export async function POST(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();

    const parsed = postSchema.safeParse(await readJson(request));
    if (!parsed.success) return badRequest("Those answers could not be read.");
    const pack = conceptFor(parsed.data.concept, learner.courseId);
    if (!pack) return notFound("That revision page is not part of your learning path.");

    const database = getDatabase();
    const now = new Date().toISOString();

    if (parsed.data.kind === "practice") {
      const results = gradePractice(pack, parsed.data.answers);
      return json({
        practice: results,
        passed: results.every((result) => result.correct),
      });
    }

    const graded = gradeReadiness(pack, parsed.data.answers);
    /* A pass records readiness for the learner's own concept only, and only ever adds:
     * markReadiness never clears a timestamp that is already there. */
    if (graded.passed) {
      await markReadiness(database, learner.id, learner.courseId, [pack.concept], JSON.stringify(parsed.data.answers), now);
    }
    const rows = await loadRevisionItems(database, learner.id, learner.courseId);
    const mine = rows.find((row) => row.concept === pack.concept) || null;
    return json({
      readiness: graded.results,
      passed: graded.passed,
      readinessPassedAt: mine?.readinessPassedAt ?? (graded.passed ? now : null),
      nextStep: graded.passed
        ? "This concept is ready. Your next attempt unlocks once every concept in your plan is ready."
        : "Read the page again, use the hints, then answer the readiness questions once more.",
    });
  } catch (error) {
    return databaseError(error);
  }
}