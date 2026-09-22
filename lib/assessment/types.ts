import type { CourseId } from "@/lib/course";

/*
 * The Assessment V2 contract.
 *
 * One shared engine and four sets of course-specific content. Everything a mark can
 * be derived from lives in this module tree, in the repository, and is reviewed like
 * any other source file. No language model is called at assessment time.
 *
 * Two rules shape every type below:
 *
 *   1. The client may send answers, code and free text. It may never send a form, a
 *      mark, a course identity, an item version or a pass status.
 *   2. Anything that cannot be decided reliably returns Needs verification. It is
 *      never guessed into a pass or a fail.
 */

export const CONTENT_VERSION = "assessment-v2.1";

export type AssessmentKind = "module" | "final";
export type AttemptStatus = "in_progress" | "submitted";
export type AttemptStage = "knowledge" | "practical" | "review" | "defence" | "done";

/* Internal values are stable and explicit. Learners only ever read the wording in
 * LEARNER_OUTCOMES. */
export type Outcome = "passed" | "not_passed_yet" | "needs_verification";
export type ItemResultStatus = "met" | "unmet" | "needs-verification";
export type ItemType = "knowledge" | "practical" | "debug" | "build";
export type Difficulty = "foundation" | "developing" | "secure" | "advanced";
export type CognitiveLevel = "remember" | "understand" | "apply" | "analyse" | "evaluate";
export type MandatoryKind = "safety" | "privacy" | "accessibility";
export type FileKey = "html" | "css" | "javascript";
export type CodeFiles = Record<FileKey, string>;

export const LEARNER_OUTCOMES: Record<Outcome, string> = {
  passed: "Passed",
  not_passed_yet: "Not passed yet",
  needs_verification: "Needs verification",
};

/* ------------------------------------------------------------------ checks ---- */

/*
 * A requirement is graded from a declarative check, never from an exact code string
 * and never from running the learner's code. The checks are decided by the tolerant
 * readers in this directory.
 */
export type RequirementCheck =
  /* HTML */
  | { kind: "html-element"; file: "html"; tag: string; min?: number; max?: number }
  | { kind: "html-attribute"; file: "html"; tag: string; attr: string; minLength?: number; values?: string[] }
  | { kind: "html-labelled-control"; file: "html" }
  | { kind: "html-fragment-link"; file: "html" }
  | { kind: "html-heading-order"; file: "html" }
  | { kind: "html-document-meta"; file: "html" }
  | { kind: "html-image-alt"; file: "html" }
  | { kind: "html-landmarks"; file: "html"; tags: string[] }
  | { kind: "html-list"; file: "html"; minItems: number }
  | { kind: "html-status-region"; file: "html" }
  | { kind: "html-language"; file: "html" }
  | { kind: "html-text-free-of"; file: "html"; catalogue: "personal-contact" | "private-location" }
  /* CSS */
  | { kind: "css-declaration"; file: "css"; selector?: string; property: string; value: CssValueClass }
  | { kind: "css-at-rule"; file: "css"; at: "media"; minWidth?: number }
  | { kind: "css-custom-properties"; file: "css"; min: number }
  | { kind: "css-var-usage"; file: "css"; min: number }
  | { kind: "css-focus-visible"; file: "css" }
  | { kind: "css-fluid-width"; file: "css" }
  | { kind: "css-readability"; file: "css" }
  | { kind: "css-grid-tracks"; file: "css"; minTracks?: number }
  /* JavaScript, from a structural scan of the token stream */
  | { kind: "js-function"; file: "javascript"; min?: number; paramsMin?: number }
  | { kind: "js-call"; file: "javascript"; method: string; min?: number }
  | { kind: "js-callback"; file: "javascript"; method: string; needsReturn?: boolean; needsComparison?: boolean }
  | { kind: "js-structural"; file: "javascript"; fact: JsFact; min?: number }
  | { kind: "js-member-assignment"; file: "javascript"; property: string }
  | { kind: "js-storage"; file: "javascript"; method: "setItem" | "getItem" | "removeItem" }
  | { kind: "js-literal-any"; file: "javascript"; values: string[] }
  | { kind: "js-request-id"; file: "javascript" }
  | { kind: "js-absent"; file: "javascript"; fact: JsFact }
  /* Deliberately undecidable from the submitted files alone. Never awards a mark and
   * never takes one away: it produces Needs verification with the next step. */
  | { kind: "cannot-verify"; reason: string }
  /* Compared against the learner's own earlier submission, so a live change is proved
   * relative to what they actually built. */
  | { kind: "increase"; inner: RequirementCheck; by: number; on: "html-element" | "html-list-items" | "css-declaration" | "js-call" };

export type CssValueClass =
  | "grid"
  | "flex"
  | "flex-wrap"
  | "wrap"
  | "fr"
  | "minmax"
  | "auto-fit"
  | "relative-length"
  | "percentage"
  | "border-box"
  | "line-height"
  | "font-size"
  | "gap"
  | "outline"
  | "padding"
  | "margin"
  | "border"
  | "colour"
  | "custom-property";

export type JsFact =
  | "conditional"
  | "ternary"
  | "return"
  | "declaration"
  | "try-catch"
  | "finally"
  | "await"
  | "async-function"
  | "strict-equality"
  | "array-literal"
  | "object-literal"
  | "string-literal"
  | "number-literal"
  | "event-listener"
  | "prevent-default"
  | "create-element"
  | "append"
  | "spread"
  | "innerhtml-assignment"
  | "eval"
  | "document-write";

export type Requirement = {
  id: string;
  label: string;
  marks: number;
  check: RequirementCheck;
  concept: string;
  revision?: string;
  mandatory?: MandatoryKind;
};

export type KnowledgeItem = {
  id: string;
  version: string;
  courseId: CourseId;
  moduleId: string;
  formVariant: string;
  objective: string;
  concept: string;
  difficulty: Difficulty;
  cognitive: CognitiveLevel;
  type: "knowledge";
  marks: number;
  prompt: string;
  options: [string, string, string];
  answer: number;
  explanation: string;
  misconceptions: string[];
  revision: string;
};

export type CodeTask = {
  id: string;
  version: string;
  courseId: CourseId;
  moduleId: string;
  formVariant: string;
  type: ItemType;
  title: string;
  brief: string;
  objective: string;
  concept: string;
  difficulty: Difficulty;
  cognitive: CognitiveLevel;
  marks: number;
  editableFiles: FileKey[];
  starterFiles: CodeFiles;
  requirements: Requirement[];
  revision: string;
  /* What a learner must be told, so nothing untaught is ever required. */
  allowedSkills: string[];
};

export type DefenceTask = {
  id: string;
  courseId: CourseId;
  kind: "explain" | "predict" | "change";
  prompt: string;
  snippet: string;
  options?: [string, string, string, string];
  answer?: number;
  explanation: string;
  changeRequirement?: RequirementCheck;
  changeInstruction?: string;
  objectives: string[];
  revision: string;
  /* Extra defence tasks used when a coarse integrity signal suggests checking more.
   * Signals may add or vary a defence task. They can never reduce a mark. */
  escalated?: boolean;
};

export type DefenceTemplate = {
  id: string;
  courseId: CourseId;
  objectives: string[];
  explain: DefenceTask;
  predict: DefenceTask;
  change: DefenceTask;
  escalatedPredict: DefenceTask;
};

export type ModuleForm = {
  id: string;
  courseId: CourseId;
  moduleId: string;
  moduleNumber: number;
  variant: string;
  knowledge: KnowledgeItem[];
  practical: CodeTask;
  difficultyProfile: Record<Difficulty, number>;
  objectives: string[];
};

export type FinalForm = {
  id: string;
  courseId: CourseId;
  variant: string;
  knowledge: KnowledgeItem[];
  debug: CodeTask[];
  build: CodeTask;
  difficultyProfile: Record<Difficulty, number>;
  objectives: string[];
};

export type CourseAssessment = {
  courseId: CourseId;
  contentVersion: string;
  moduleForms: ModuleForm[];
  finalForms: FinalForm[];
  defence: DefenceTemplate[];
};

/* ------------------------------------------------------------------ grading --- */

export type RequirementResult = {
  requirementId: string;
  label: string;
  status: ItemResultStatus;
  awarded: number;
  available: number;
  concept: string;
  mandatory: MandatoryKind | null;
  detail: string;
};

export type ItemResult = {
  itemId: string;
  itemType: ItemType;
  formVariant: string;
  concept: string;
  status: ItemResultStatus;
  awarded: number;
  available: number;
  requirements: RequirementResult[];
  correct?: boolean;
  chosen?: number;
  correctAnswer?: number;
  explanation?: string;
  misconception?: string;
};

export type ScoreBreakdown = {
  awarded: number;
  available: number;
  verifiedAwarded: number;
  verifiedAvailable: number;
};

export type AttemptOutcome = {
  outcome: Outcome;
  mark: ScoreBreakdown;
  knowledge: ScoreBreakdown;
  practical: ScoreBreakdown;
  debug: ScoreBreakdown;
  build: ScoreBreakdown;
  mandatoryPassed: boolean;
  needsVerification: boolean;
  reasons: string[];
  nextStep: string;
};

export type Submission = {
  answers: number[];
  code: Partial<Record<string, CodeFiles>>;
};

/* ------------------------------------------------------------------- content -- */

export type RevisionPack = {
  concept: string;
  courses: CourseId[];
  title: string;
  meaning: string;
  whyItMatters: string;
  workedExample: string;
  commonMistake: string;
  guided: Array<{ prompt: string; options: [string, string, string]; answer: number; explanation: string }>;
  independent: string;
  hints: [string, string, string];
  readiness: Array<{ prompt: string; options: [string, string, string]; answer: number; explanation: string }>;
  lessonId: string;
};

export type ReferenceSection = {
  id: string;
  title: string;
  lines: string[];
  note: string;
};
