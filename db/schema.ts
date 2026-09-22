import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const learnerProfiles = sqliteTable(
  "learner_profiles",
  {
    id: text("id").primaryKey(),
    accessHash: text("access_hash").notNull(),
    nickname: text("nickname").notNull(),
    age: integer("age").notNull(),
    theme: text("theme").notNull(),
    courseId: text("course_id").notNull().default("ages-10-12"),
    createdAt: text("created_at").notNull(),
    lastSeenAt: text("last_seen_at").notNull(),
  },
  (table) => [uniqueIndex("learner_profiles_access_hash_unique").on(table.accessHash)],
);

export const courseProgress = sqliteTable(
  "course_progress",
  {
    learnerId: text("learner_id")
      .notNull()
      .references(() => learnerProfiles.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull(),
    status: text("status").notNull().default("started"),
    questionCorrect: integer("question_correct", { mode: "boolean" }).notNull().default(false),
    reflection: text("reflection").notNull().default(""),
    workspaceJson: text("workspace_json").notNull().default("{}"),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.learnerId, table.lessonId] }),
    index("course_progress_learner_updated_idx").on(table.learnerId, table.updatedAt),
  ],
);

export const projectCheckpoints = sqliteTable(
  "project_checkpoints",
  {
    id: text("id").primaryKey(),
    learnerId: text("learner_id")
      .notNull()
      .references(() => learnerProfiles.id, { onDelete: "cascade" }),
    stageId: text("stage_id").notNull(),
    version: integer("version").notNull(),
    projectJson: text("project_json").notNull(),
    reflection: text("reflection").notNull().default(""),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("project_checkpoints_learner_stage_idx").on(table.learnerId, table.stageId, table.createdAt)],
);

export const examAttempts = sqliteTable(
  "exam_attempts",
  {
    id: text("id").primaryKey(),
    learnerId: text("learner_id")
      .notNull()
      .references(() => learnerProfiles.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    total: integer("total").notNull(),
    answersJson: text("answers_json").notNull(),
    practicalJson: text("practical_json").notNull(),
    passed: integer("passed", { mode: "boolean" }).notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("exam_attempts_learner_created_idx").on(table.learnerId, table.createdAt)],
);

/* Adaptive tutor evidence. One row per learner and lesson, holding only counts,
 * requirement labels and timestamps. Learner code is never stored here. */
export const lessonEvidence = sqliteTable(
  "lesson_evidence",
  {
    learnerId: text("learner_id")
      .notNull()
      .references(() => learnerProfiles.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull(),
    attempts: integer("attempts").notNull().default(0),
    successfulChecks: integer("successful_checks").notNull().default(0),
    hintsRequested: integer("hints_requested").notNull().default(0),
    mastery: integer("mastery").notNull().default(0),
    struggleJson: text("struggle_json").notNull().default("[]"),
    independentCorrections: integer("independent_corrections").notNull().default(0),
    lastInterventionLevel: integer("last_intervention_level").notNull().default(0),
    interventionPending: integer("intervention_pending", { mode: "boolean" }).notNull().default(false),
    codePassedAt: text("code_passed_at"),
    quickCheckPassedAt: text("quick_check_passed_at"),
    bestQuizScore: integer("best_quiz_score").notNull().default(0),
    completedAt: text("completed_at"),
    createdAt: text("created_at").notNull(),
    lastActivityAt: text("last_activity_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.learnerId, table.lessonId] }),
    index("lesson_evidence_learner_activity_idx").on(table.learnerId, table.lastActivityAt),
  ],
);

/* A guardian is identified by the platform identity headers, never by anything
 * the browser sends in a body. Only the fields needed to recognise a guardian
 * again are kept here. */
export const guardianAccounts = sqliteTable(
  "guardian_accounts",
  {
    id: text("id").primaryKey(),
    platformUserId: text("platform_user_id").notNull(),
    email: text("email").notNull(),
    displayName: text("display_name"),
    createdAt: text("created_at").notNull(),
    lastSignInAt: text("last_sign_in_at").notNull(),
    failedClaimAttempts: integer("failed_claim_attempts").notNull().default(0),
    lastClaimAttemptAt: text("last_claim_attempt_at"),
  },
  (table) => [uniqueIndex("guardian_accounts_platform_user_unique").on(table.platformUserId)],
);

/* One row per guardian and learner pair, including revoked pairs, so a revoke
 * keeps its history and a later reconnect updates the same row. */
export const guardianLinks = sqliteTable(
  "guardian_links",
  {
    id: text("id").primaryKey(),
    linkRef: text("link_ref").notNull(),
    guardianId: text("guardian_id")
      .notNull()
      .references(() => guardianAccounts.id, { onDelete: "cascade" }),
    learnerId: text("learner_id")
      .notNull()
      .references(() => learnerProfiles.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("active"),
    initiatedBy: text("initiated_by").notNull().default("learner"),
    connectedAt: text("connected_at").notNull(),
    revokedAt: text("revoked_at"),
  },
  (table) => [
    uniqueIndex("guardian_links_pair_unique").on(table.guardianId, table.learnerId),
    uniqueIndex("guardian_links_ref_unique").on(table.linkRef),
    index("guardian_links_learner_idx").on(table.learnerId, table.status),
  ],
);

/* A one-time code a learner shows to a grown-up. Only the digest is stored, and
 * the row is removed with the learner it belongs to. */
export const guardianConnectCodes = sqliteTable(
  "guardian_connect_codes",
  {
    id: text("id").primaryKey(),
    learnerId: text("learner_id")
      .notNull()
      .references(() => learnerProfiles.id, { onDelete: "cascade" }),
    codeDigest: text("code_digest").notNull(),
    createdAt: text("created_at").notNull(),
    expiresAt: text("expires_at").notNull(),
    usedAt: text("used_at"),
    usedByGuardianId: text("used_by_guardian_id").references(() => guardianAccounts.id, { onDelete: "set null" }),
    invalidatedAt: text("invalidated_at"),
    failedAttempts: integer("failed_attempts").notNull().default(0),
  },
  (table) => [
    uniqueIndex("guardian_connect_codes_digest_unique").on(table.codeDigest),
    index("guardian_connect_codes_learner_idx").on(table.learnerId, table.expiresAt),
  ],
);

/* A durable record of weak concepts that outlives the lesson where they were
 * first missed, so the tutor can come back to them later. Only requirement
 * labels, concept keys and counts are stored, never learner code. */
export const conceptReview = sqliteTable(
  "concept_review",
  {
    learnerId: text("learner_id")
      .notNull()
      .references(() => learnerProfiles.id, { onDelete: "cascade" }),
    concept: text("concept").notNull(),
    label: text("label").notNull(),
    lessonId: text("lesson_id").notNull(),
    timesFailed: integer("times_failed").notNull().default(1),
    timesRecovered: integer("times_recovered").notNull().default(0),
    reviewStreak: integer("review_streak").notNull().default(0),
    due: integer("due", { mode: "boolean" }).notNull().default(true),
    firstFailedAt: text("first_failed_at").notNull(),
    lastFailedAt: text("last_failed_at").notNull(),
    lastReviewedAt: text("last_reviewed_at"),
  },
  (table) => [
    primaryKey({ columns: [table.learnerId, table.concept] }),
    index("concept_review_due_idx").on(table.learnerId, table.due, table.lastFailedAt),
  ],
);

/* One row per piece of support given, so a learner's independence can be judged
 * from real evidence. Requirement labels are stored, never learner code. */
export const tutorInterventions = sqliteTable(
  "tutor_interventions",
  {
    id: text("id").primaryKey(),
    learnerId: text("learner_id")
      .notNull()
      .references(() => learnerProfiles.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull(),
    level: integer("level").notNull(),
    focus: text("focus").notNull(),
    requirementJson: text("requirement_json").notNull().default("[]"),
    source: text("source").notNull().default("check"),
    resolvedIndependently: integer("resolved_independently", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("tutor_interventions_learner_lesson_idx").on(table.learnerId, table.lessonId, table.createdAt),
  ],
);
