import {
  detailedExplanation,
  type CodeFile,
  type CodeTest,
  type CourseBundle,
  type CourseFacts,
  type CourseId,
  type Lesson,
  type PracticeQuestion,
  type PracticalExamDefinition,
  type ProjectChoice,
  type Stage,
  type WorkspaceFiles,
} from "@/lib/course";

export type QuestionSpec = [prompt: string, correct: string, wrongOne: string, wrongTwo: string, explanation: string];

export type LessonSpec = {
  id: string;
  title: string;
  minutes: number;
  language: Lesson["language"];
  objective: string;
  notes: [string, string];
  keyTerms: string[];
  exampleTitle: string;
  exampleCode: string;
  exampleExplanation: string;
  task: string;
  starterFiles: WorkspaceFiles;
  editableFiles: CodeFile[];
  tests: CodeTest[];
  hints: [string, string, string];
  question: QuestionSpec;
  reflection?: string;
};

export type StageSpec = {
  id: string;
  title: string;
  description: string;
  outcome: string;
  lessons: [LessonSpec, LessonSpec, LessonSpec, LessonSpec];
  project: LessonSpec & { reflection: string };
  quizQuestion: QuestionSpec;
};

export type CourseSpec = {
  id: CourseId;
  title: string;
  ageRange: string;
  ages: number[];
  estimatedHours: string;
  passMark: number;
  projectChoices: ProjectChoice[];
  stages: [StageSpec, StageSpec, StageSpec, StageSpec, StageSpec, StageSpec, StageSpec, StageSpec];
  finalExam: [QuestionSpec, QuestionSpec, QuestionSpec, QuestionSpec, QuestionSpec, QuestionSpec, QuestionSpec, QuestionSpec, QuestionSpec, QuestionSpec];
  practicalExam: PracticalExamDefinition;
};

export const files = (html: string, css = "", javascript = ""): WorkspaceFiles => ({ html, css, javascript });
export const test = (file: CodeFile, label: string, pattern: string): CodeTest => ({ file, label, pattern });

export function question([prompt, correct, wrongOne, wrongTwo, explanation]: QuestionSpec): PracticeQuestion {
  const answer = Array.from(prompt).reduce((total, character) => total + character.charCodeAt(0), 0) % 3;
  const options: [string, string, string] = answer === 0
    ? [correct, wrongOne, wrongTwo]
    : answer === 1
      ? [wrongOne, correct, wrongTwo]
      : [wrongOne, wrongTwo, correct];
  return { prompt, options, answer, explanation };
}

function buildLesson(courseId: CourseId, stageId: string, spec: LessonSpec, activityType: Lesson["activityType"], activityNumber: number): Lesson {
  const lesson: Lesson = {
    id: `${courseId}-${stageId}-${spec.id}`,
    title: spec.title,
    minutes: spec.minutes,
    objective: spec.objective,
    activityType,
    activityNumber,
    language: spec.language,
    explanation: spec.notes,
    keyTerms: spec.keyTerms,
    exampleTitle: spec.exampleTitle,
    exampleCode: spec.exampleCode,
    exampleExplanation: spec.exampleExplanation,
    task: spec.task,
    starterFiles: spec.starterFiles,
    editableFiles: spec.editableFiles,
    tests: spec.tests,
    hints: spec.hints,
    question: question(spec.question),
    reflection: spec.reflection,
  };
  return { ...lesson, explanation: detailedExplanation(lesson) };
}

export function createCourse(spec: CourseSpec): CourseBundle {
  const stages: Stage[] = spec.stages.map((stageSpec, stageIndex) => {
    const stageId = `${spec.id}-${stageSpec.id}`;
    const challenges = stageSpec.lessons.map((lessonSpec, lessonIndex) => buildLesson(spec.id, stageSpec.id, lessonSpec, "challenge", lessonIndex + 1));
    const project = buildLesson(spec.id, stageSpec.id, stageSpec.project, "project", 5);
    const quiz: Lesson = {
      id: `${stageId}-quiz`,
      title: `${stageSpec.title} check`,
      minutes: 9,
      objective: "Check the knowledge and code-reading skills from this module.",
      activityType: "quiz",
      activityNumber: 6,
      language: challenges[0].language,
      explanation: ["Answer five questions after completing the four lessons and project checkpoint. Four correct answers open the next module."],
      keyTerms: Array.from(new Set(challenges.flatMap((lesson) => lesson.keyTerms))),
      exampleTitle: "Use evidence from your code",
      exampleCode: "Read the question, predict the result, then compare every option with code you used.",
      exampleExplanation: "The check measures understanding and code reading, not memory alone.",
      task: "Answer all five questions and review the explanation for anything you miss.",
      starterFiles: files(""),
      editableFiles: [],
      tests: [],
      hints: ["Return to the lesson that introduced the idea.", "Read its worked example from top to bottom.", "Try again after explaining the idea in your own words."],
      questions: [...challenges.map((lesson) => lesson.question!), question(stageSpec.quizQuestion)],
    };
    return { id: stageId, number: stageIndex + 1, title: stageSpec.title, description: stageSpec.description, outcome: stageSpec.outcome, lessons: [...challenges, project, quiz] };
  });
  const lessons = stages.flatMap((stage) => stage.lessons);
  const courseFacts: CourseFacts = { id: spec.id, title: spec.title, ageRange: spec.ageRange, ages: spec.ages, lessonCount: lessons.length, stageCount: stages.length, estimatedHours: spec.estimatedHours, passMark: spec.passMark };
  return { courseFacts, stages, lessons, projectChoices: spec.projectChoices, finalExam: spec.finalExam.map(question), practicalExam: spec.practicalExam };
}
