import { z } from "zod";
import { lessons } from "@/lib/course";
import { authenticateLearner, databaseError, getDatabase, unauthorized } from "@/lib/server-database";

const lessonIds = new Set(lessons.map((lesson) => lesson.id));
const progressSchema = z.object({
  lessonId: z.string().min(1),
  status: z.enum(["started", "completed"]),
  questionCorrect: z.boolean(),
  reflection: z.string().max(1200),
  workspace: z.object({
    blocks: z.array(z.string()).max(40).optional(),
    code: z.string().max(12000).optional(),
  }),
});

export async function GET(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();
    const database = getDatabase();
    const [progress, checkpoints, exams] = await Promise.all([
      database.prepare("SELECT lesson_id AS lessonId, status, question_correct AS questionCorrect, reflection, workspace_json AS workspaceJson, updated_at AS updatedAt FROM course_progress WHERE learner_id = ? ORDER BY updated_at").bind(learner.id).all(),
      database.prepare("SELECT id, stage_id AS stageId, version, reflection, created_at AS createdAt FROM project_checkpoints WHERE learner_id = ? ORDER BY created_at DESC").bind(learner.id).all(),
      database.prepare("SELECT id, score, total, passed, created_at AS createdAt FROM exam_attempts WHERE learner_id = ? ORDER BY created_at DESC LIMIT 5").bind(learner.id).all(),
    ]);
    return Response.json({ learner, progress: progress.results, checkpoints: checkpoints.results, exams: exams.results });
  } catch (error) {
    return databaseError(error);
  }
}

export async function POST(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();
    const parsed = progressSchema.safeParse(await request.json());
    if (!parsed.success || !lessonIds.has(parsed.data.lessonId)) {
      return Response.json({ error: "This lesson progress could not be saved." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const data = parsed.data;
    await getDatabase()
      .prepare(`INSERT INTO course_progress
        (learner_id, lesson_id, status, question_correct, reflection, workspace_json, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (learner_id, lesson_id) DO UPDATE SET
          status = excluded.status,
          question_correct = excluded.question_correct,
          reflection = excluded.reflection,
          workspace_json = excluded.workspace_json,
          updated_at = excluded.updated_at`)
      .bind(learner.id, data.lessonId, data.status, data.questionCorrect ? 1 : 0, data.reflection.trim(), JSON.stringify(data.workspace), now)
      .run();
    return Response.json({ saved: true, updatedAt: now });
  } catch (error) {
    return databaseError(error);
  }
}
