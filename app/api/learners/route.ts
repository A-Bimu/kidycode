import { z } from "zod";
import { databaseError, getDatabase } from "@/lib/server-database";

const learnerSchema = z.object({
  nickname: z.string().trim().min(2).max(20).regex(/^[\p{L}\p{N} _-]+$/u),
  age: z.number().int().min(10).max(12),
  theme: z.enum(["wildlife", "museum", "space"]),
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
      return Response.json({ error: "Use a nickname, choose age 10 to 12 and select one project." }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const accessKey = makeAccessKey();
    const accessHash = await hashAccessKey(accessKey);
    const now = new Date().toISOString();
    await getDatabase()
      .prepare("INSERT INTO learner_profiles (id, access_hash, nickname, age, theme, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(id, accessHash, parsed.data.nickname, parsed.data.age, parsed.data.theme, now, now)
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
