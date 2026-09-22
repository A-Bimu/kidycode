import { env } from "cloudflare:workers";
import { hashAccessKey } from "@/lib/access-keys";

export function getDatabase(): D1Database {
  if (!env.DB) {
    throw new Error("KidyCode progress storage is temporarily unavailable.");
  }

  return env.DB;
}

export function databaseError(error: unknown): Response {
  const detail = error instanceof Error ? error.message : "Unexpected database error";
  console.error("KidyCode database request failed", detail);
  return Response.json(
    { error: "Progress could not be saved right now. Your work is still on screen, so please try again." },
    { status: 503 },
  );
}

export async function authenticateLearner(request: Request): Promise<{
  id: string;
  nickname: string;
  age: number;
  theme: string;
  courseId: "ages-10-12" | "ages-13-15" | "ages-16-18" | "adults";
} | null> {
  const cookieValue = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("kidycode_session="))
    ?.slice("kidycode_session=".length);
  let cookieParts: string[] = [];
  try {
    cookieParts = cookieValue ? decodeURIComponent(cookieValue).split(".") : [];
  } catch {
    cookieParts = [];
  }
  const learnerId = request.headers.get("x-kidycode-learner")?.trim() || cookieParts[0];
  const accessKey = request.headers.get("x-kidycode-key")?.trim() || cookieParts[1];
  if (!learnerId || !accessKey || accessKey.length > 128) return null;

  const accessHash = await hashAccessKey(accessKey);
  const database = getDatabase();
  const learner = await database
    .prepare("SELECT id, nickname, age, theme, course_id AS courseId FROM learner_profiles WHERE id = ? AND access_hash = ?")
    .bind(learnerId, accessHash)
    .first<{
      id: string;
      nickname: string;
      age: number;
      theme: string;
      courseId: "ages-10-12" | "ages-13-15" | "ages-16-18" | "adults";
    }>();

  if (!learner) return null;
  return learner;
}

export function unauthorized(): Response {
  return Response.json({ error: "This learner profile could not be verified." }, { status: 401 });
}
