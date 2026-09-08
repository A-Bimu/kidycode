import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const learnerProfiles = sqliteTable(
  "learner_profiles",
  {
    id: text("id").primaryKey(),
    accessHash: text("access_hash").notNull(),
    nickname: text("nickname").notNull(),
    age: integer("age").notNull(),
    theme: text("theme").notNull(),
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
