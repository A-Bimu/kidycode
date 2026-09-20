import { z } from "zod";
import { courses } from "@/lib/course-catalog";
import { authenticateLearner, databaseError, getDatabase, unauthorized } from "@/lib/server-database";

const courseIds = ["ages-10-12", "ages-13-15", "ages-16-18", "adults"] as const;
const examSchema = z.object({
  courseId: z.enum(courseIds),
  answers: z.array(z.number().int().min(0).max(2)).length(10),
  practicalCode: z.string().min(10).max(24000),
  explanation: z.string().trim().min(10).max(1200),
});

export async function POST(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();
    const parsed = examSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: "Answer all ten questions, repair the code and explain the change." }, { status: 400 });
    }
    if (parsed.data.courseId !== learner.courseId) {
      return Response.json({ error: "This final check does not belong to your learning path." }, { status: 403 });
    }

    const course = courses[learner.courseId];
    if (!course || course.lessons.length !== 48 || course.finalExam.length !== 10) {
      return Response.json({ error: "This final check is temporarily unavailable." }, { status: 503 });
    }

    const database = getDatabase();
    const completed = await database
      .prepare("SELECT lesson_id AS lessonId FROM course_progress WHERE learner_id = ? AND status = 'completed'")
      .bind(learner.id)
      .all<{ lessonId: string }>();
    const completedIds = new Set(completed.results.map((row) => row.lessonId));
    if (!course.lessons.every((lesson) => completedIds.has(lesson.id))) {
      return Response.json({ error: "Complete all 48 activities before taking the final check." }, { status: 409 });
    }

    const knowledgeScore = course.finalExam.reduce(
      (score, question, index) => score + (parsed.data.answers[index] === question.answer ? 1 : 0),
      0,
    );
    const practicalPassed = course.practicalExam.requiredPatterns.every((pattern) => {
      try {
        return new RegExp(pattern, "i").test(parsed.data.practicalCode);
      } catch {
        return false;
      }
    });
    const passed = knowledgeScore >= course.courseFacts.passMark && practicalPassed;
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await database
      .prepare("INSERT INTO exam_attempts (id, learner_id, score, total, answers_json, practical_json, passed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(
        id,
        learner.id,
        knowledgeScore,
        course.finalExam.length,
        JSON.stringify({ courseId: learner.courseId, answers: parsed.data.answers }),
        JSON.stringify({
          courseId: learner.courseId,
          code: parsed.data.practicalCode,
          explanation: parsed.data.explanation,
          passed: practicalPassed,
        }),
        passed ? 1 : 0,
        createdAt,
      )
      .run();

    return Response.json({
      attempt: { id, score: knowledgeScore, total: course.finalExam.length, practicalPassed, passed, createdAt },
      corrections: course.finalExam.map((question, index) => ({
        correct: parsed.data.answers[index] === question.answer,
        answer: question.answer,
        explanation: question.explanation,
      })),
    });
  } catch (error) {
    return databaseError(error);
  }
}
