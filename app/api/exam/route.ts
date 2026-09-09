import { z } from "zod";
import { courseFacts, finalExam, practicalExam } from "@/lib/course";
import { authenticateLearner, databaseError, getDatabase, unauthorized } from "@/lib/server-database";

const examSchema = z.object({
  answers: z.array(z.number().int().min(0).max(3)).length(finalExam.length),
  practicalCode: z.string().min(10).max(12000),
  explanation: z.string().trim().min(10).max(600),
});

export async function POST(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();
    const parsed = examSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: "Answer every question, repair the code and explain the change." }, { status: 400 });
    }

    const knowledgeScore = finalExam.reduce((score, question, index) => score + (parsed.data.answers[index] === question.answer ? 1 : 0), 0);
    const practicalPassed = practicalExam.requiredPatterns.every((pattern) => new RegExp(pattern, "i").test(parsed.data.practicalCode));
    const passed = knowledgeScore >= courseFacts.passMark && practicalPassed;
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await getDatabase()
      .prepare("INSERT INTO exam_attempts (id, learner_id, score, total, answers_json, practical_json, passed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(id, learner.id, knowledgeScore, finalExam.length, JSON.stringify(parsed.data.answers), JSON.stringify({ code: parsed.data.practicalCode, explanation: parsed.data.explanation, passed: practicalPassed }), passed ? 1 : 0, createdAt)
      .run();

    return Response.json({
      attempt: { id, score: knowledgeScore, total: finalExam.length, practicalPassed, passed, createdAt },
      corrections: finalExam.map((question, index) => ({ correct: parsed.data.answers[index] === question.answer, answer: question.answer, explanation: question.explanation })),
    });
  } catch (error) {
    return databaseError(error);
  }
}
