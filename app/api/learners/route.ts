import { z } from "zod";
import { clearedSessionCookie, hashAccessKey, makeAccessKey, sessionCookie } from "@/lib/access-keys";
import { authenticateLearner, databaseError, getDatabase, unauthorized } from "@/lib/server-database";

const courseIds = ["ages-10-12", "ages-13-15", "ages-16-18", "adults"] as const;
const validAges: Record<(typeof courseIds)[number], readonly number[]> = {
  "ages-10-12": [10, 11, 12],
  "ages-13-15": [13, 14, 15],
  "ages-16-18": [16, 17, 18],
  adults: [19],
};

const learnerSchema = z.object({
  nickname: z.string().trim().min(2).max(20).regex(/^[\p{L}\p{N} _-]+$/u),
  age: z.number().int().min(10).max(99),
  theme: z.enum(["interest", "club", "magazine"]),
  courseId: z.enum(courseIds),
}).superRefine((learner, context) => {
  if (!validAges[learner.courseId].includes(learner.age)) {
    context.addIssue({ code: "custom", path: ["age"], message: "Choose an age that belongs to this course." });
  }
});

export async function POST(request: Request) {
  try {
    const parsed = learnerSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return Response.json({ error: "Use a nickname, choose the correct learning path and select one website project." }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const accessKey = makeAccessKey();
    const accessHash = await hashAccessKey(accessKey);
    const now = new Date().toISOString();
    await getDatabase()
      .prepare("INSERT INTO learner_profiles (id, access_hash, nickname, age, theme, course_id, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(id, accessHash, parsed.data.nickname, parsed.data.age, parsed.data.theme, parsed.data.courseId, now, now)
      .run();

    const response = Response.json({ learner: { id, ...parsed.data } }, { status: 201 });
    response.headers.append("set-cookie", sessionCookie(id, accessKey));
    return response;
  } catch (error) {
    return databaseError(error);
  }
}

/*
 * Clearing this device.
 *
 * This signs the learner out by clearing the session cookie and changes nothing
 * else: every activity, version, reflection and assessment stays saved, and the
 * profile can be opened again with a transfer code or by a connected grown-up.
 * Permanently deleting a profile is a separate operation in /api/learner.
 */
export async function DELETE(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();
    const response = Response.json({
      cleared: true,
      message: "This device is signed out. Your course and saved work are still here.",
    });
    response.headers.append("set-cookie", clearedSessionCookie);
    return response;
  } catch (error) {
    return databaseError(error);
  }
}
