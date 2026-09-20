import { z } from "zod";
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

function makeAccessKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("");
}

async function hashAccessKey(accessKey: string): Promise<string> {
  const bytes = new TextEncoder().encode(accessKey);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  try {
    const parsed = learnerSchema.safeParse(await request.json());
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
    response.headers.append(
      "set-cookie",
      `kidycode_session=${encodeURIComponent(`${id}.${accessKey}`)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=15552000`,
    );
    return response;
  } catch (error) {
    return databaseError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();
    const response = Response.json({ cleared: true });
    response.headers.append(
      "set-cookie",
      "kidycode_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    );
    return response;
  } catch (error) {
    return databaseError(error);
  }
}
