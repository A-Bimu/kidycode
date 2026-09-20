import { z } from "zod";
import { courses } from "@/lib/course-catalog";
import type { Lesson, WorkspaceFiles } from "@/lib/course";
import { authenticateLearner, databaseError, getDatabase, unauthorized } from "@/lib/server-database";

const checkpointSchema = z.object({
  stageId: z.string().min(1).max(120),
  reflection: z.string().trim().min(10).max(1200),
  project: z.object({
    html: z.string().max(24000),
    css: z.string().max(24000),
    javascript: z.string().max(24000),
    theme: z.enum(["interest", "club", "magazine"]),
  }),
});

function projectChecksPass(projectActivity: Lesson, workspace: WorkspaceFiles): boolean {
  return projectActivity.tests.length > 0 && projectActivity.tests.every((test) => {
    try {
      return new RegExp(test.pattern, "i").test(workspace[test.file]);
    } catch {
      return false;
    }
  });
}

export async function POST(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();
    const parsed = checkpointSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: "Finish the module and write a short reflection before saving." }, { status: 400 });
    }

    const course = courses[learner.courseId];
    if (!course) return Response.json({ error: "This learning path is not available." }, { status: 409 });
    const stage = course.stages.find((item) => item.id === parsed.data.stageId);
    if (!stage) {
      return Response.json({ error: "This module does not belong to your learning path." }, { status: 403 });
    }
    if (parsed.data.project.theme !== learner.theme) {
      return Response.json({ error: "This project does not match the website selected for this learner." }, { status: 400 });
    }

    const projectActivity = stage.lessons.find((lesson) => lesson.activityType === "project");
    if (!projectActivity || !projectChecksPass(projectActivity, parsed.data.project)) {
      return Response.json({ error: "Run and pass the project code checks before saving this version." }, { status: 400 });
    }

    const database = getDatabase();
    const completed = await database
      .prepare("SELECT lesson_id AS lessonId FROM course_progress WHERE learner_id = ? AND status = 'completed'")
      .bind(learner.id)
      .all<{ lessonId: string }>();
    const completedIds = new Set(completed.results.map((row) => row.lessonId));
    if (stage.lessons.length !== 6 || !stage.lessons.every((lesson) => completedIds.has(lesson.id))) {
      return Response.json({ error: "Complete all six module activities before saving its project version." }, { status: 409 });
    }

    const id = `${learner.id}:${stage.id}`;
    const createdAt = new Date().toISOString();
    await database
      .prepare(`INSERT INTO project_checkpoints
        (id, learner_id, stage_id, version, project_json, reflection, created_at)
        VALUES (?, ?, ?, 1, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          project_json = excluded.project_json,
          reflection = excluded.reflection,
          created_at = excluded.created_at`)
      .bind(
        id,
        learner.id,
        stage.id,
        JSON.stringify(parsed.data.project),
        parsed.data.reflection,
        createdAt,
      )
      .run();
    return Response.json({ checkpoint: { id, stageId: stage.id, version: 1, createdAt } });
  } catch (error) {
    return databaseError(error);
  }
}
