import { z } from "zod";
import { stages } from "@/lib/course";
import { authenticateLearner, databaseError, getDatabase, unauthorized } from "@/lib/server-database";

const stageIds = new Set(stages.map((stage) => stage.id));
const checkpointSchema = z.object({
  stageId: z.string().min(1),
  reflection: z.string().trim().min(10).max(1200),
  project: z.object({
    blocks: z.array(z.string()).max(80).optional(),
    code: z.string().max(16000).optional(),
    theme: z.string().max(30),
  }),
});

export async function POST(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();
    const parsed = checkpointSchema.safeParse(await request.json());
    if (!parsed.success || !stageIds.has(parsed.data.stageId)) {
      return Response.json({ error: "Finish the stage and write a short reflection before saving." }, { status: 400 });
    }

    const database = getDatabase();
    const versionRow = await database
      .prepare("SELECT COALESCE(MAX(version), 0) + 1 AS nextVersion FROM project_checkpoints WHERE learner_id = ? AND stage_id = ?")
      .bind(learner.id, parsed.data.stageId)
      .first<{ nextVersion: number }>();
    const version = Number(versionRow?.nextVersion ?? 1);
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await database
      .prepare("INSERT INTO project_checkpoints (id, learner_id, stage_id, version, project_json, reflection, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(id, learner.id, parsed.data.stageId, version, JSON.stringify(parsed.data.project), parsed.data.reflection, createdAt)
      .run();
    return Response.json({ checkpoint: { id, stageId: parsed.data.stageId, version, createdAt } }, { status: 201 });
  } catch (error) {
    return databaseError(error);
  }
}
