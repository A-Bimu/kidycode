/* Shared payload shapes for the owner admin console. They mirror what the server routes
 * return; nothing here is computed in the browser. */

export type Provenance = "owner" | "synthetic";

export type SessionState = {
  authenticated: boolean;
  permission: "owner" | "synthetic-review" | null;
  owner: { platformUserId: string; displayName: string | null } | null;
  gate: { configured: boolean; synthetic: boolean };
  readOnly: true;
  notice?: string;
  identityTrust: string;
};

export type AdminUnitStub = { index: number; id: string; title: string; lessonCount: number };
export type AdminPathwaySummary = {
  id: string;
  title: string;
  ageRange: string;
  kind: "coding" | "design";
  units: AdminUnitStub[];
};

export type LessonSummary = {
  key: string;
  pathwayId: string;
  unitIndex: number;
  unitTitle: string;
  unitNumber: number;
  lessonId: string;
  title: string;
  type: string;
  language: string;
  minutes: number | null;
  questionCount: number;
  hasAnswerKey: boolean;
  flags: string[];
};

export type CurriculumResponse = {
  provenance: Provenance;
  source: string;
  readOnly: true;
  generatedAt: string;
  pathways: AdminPathwaySummary[];
  lessons: LessonSummary[];
  totals: { pathways: number; units: number; lessons: number; withQuestions: number };
  quality: {
    heuristic: true;
    note: string;
    totalLessons: number;
    lessonsWithFlags: number;
    flagCounts: Array<{ code: string; count: number }>;
    duplicatePromptCount: number;
  };
};

export type PracticeQuestionView = {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type LessonDetail = {
  id: string;
  title: string;
  type: string;
  language: string;
  minutes: number | null;
  objective: string;
  notes: string[];
  keyTerms: string[];
  activity: string;
  workedExample: string;
  exampleExplanation: string;
  starterFiles: { html: string; css: string; javascript: string } | null;
  hints: string[];
  requirements: string[];
  questions: PracticeQuestionView[];
  reflection: string;
};

export type LessonLocation = {
  key: string;
  pathwayId: string;
  pathwayTitle: string;
  ageRange: string;
  kind: "coding" | "design";
  unitIndex: number;
  unitId: string;
  unitTitle: string;
  unitNumber: number;
  positionInPathway: number;
  totalInPathway: number;
};

export type QualityFlag = { code: string; level: "info" | "suggestion"; message: string; detail?: string };

export type LessonResponse = {
  provenance: Provenance;
  readOnly: true;
  lesson: LessonDetail;
  location: LessonLocation;
  neighbours: {
    previous: { key: string; title: string; pathwayTitle: string } | null;
    next: { key: string; title: string; pathwayTitle: string } | null;
  };
  quality: {
    key: string;
    pathwayTitle: string;
    unitTitle: string;
    lessonTitle: string;
    lessonType: string;
    minutes: number | null;
    flags: QualityFlag[];
  };
  previewNotice: string;
};

export type Metric = {
  id: string;
  label: string;
  provenance: "recorded" | "not-tracked" | "unavailable";
  value: number | string | null;
  unit?: string;
  definition: string;
  source: string;
  window?: { from: string; to: string };
  denominator?: number;
  note?: string;
};

export type AnalyticsReport = {
  generatedAt: string;
  windowDays: number;
  metrics: Metric[];
  byCourse: Array<{ label: string; count: number | null; suppressed: boolean }>;
  byCohort: Array<{ label: string; count: number | null; suppressed: boolean }>;
  strugglingTopics: Array<{ lessonId: string; attempts: number; successRate: number | null; suppressed: boolean }>;
  notTracked: Array<{ id: string; label: string; reason: string; toInstrument: string }>;
  kAnonymityFloor: number;
  privacyNote: string;
};

export type AnalyticsResponse = { provenance: Provenance; readOnly: true; report: AnalyticsReport };

export type NotificationCatalogue = {
  provenance: Provenance;
  readOnly: true;
  templates: string[];
  audiences: string[];
  quietHours: { startHour: number; endHour: number; timeZone: string };
  frequencyCapPerWeek: number;
  liveDeliveryEnabled: false;
  notice: string;
};

export type SendPlanResponse = {
  provenance: Provenance;
  readOnly: true;
  permission: { allowed: boolean; reason: string };
  plan: {
    deliverable: boolean;
    liveDeliveryEnabled: false;
    reasons: string[];
    preview: { subject: string; body: string; template: string; audience: string };
    dryRunOnly: true;
  };
  preview: { subject: string; body: string; template: string; audience: string };
  notice: string;
};
