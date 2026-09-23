/*
 * Assessment persistence.
 *
 * Every statement here is scoped by the authenticated learner id, and the two writes
 * that must happen exactly once (submitting an attempt and issuing a credential) are
 * conditional updates that require precisely one changed row. A repeated or concurrent
 * request therefore cannot award a mark twice, cannot create a second credential and
 * cannot leave a contradictory attempt state.
 *
 * Autosave writes to the open attempt row. It never creates a row and never counts as
 * an attempt.
 */

export const MAX_DRAFT_BYTES = 60000;
export const MAX_CODE_BYTES = 20000;
export const MAX_HISTORY = 24;

export type AttemptRow = {
  id: string;
  learnerId: string;
  courseId: string;
  kind: string;
  moduleId: string | null;
  formId: string;
  contentVersion: string;
  status: string;
  stage: string;
  draftJson: string;
  answersJson: string;
  codeJson: string;
  knowledgeAwarded: number;
  knowledgeTotal: number;
  practicalAwarded: number;
  practicalTotal: number;
  debugAwarded: number;
  debugTotal: number;
  buildAwarded: number;
  buildTotal: number;
  totalAwarded: number;
  totalAvailable: number;
  mandatoryPassed: number;
  needsVerification: number;
  defencePassed: number;
  outcome: string | null;
  startedAt: string;
  savedAt: string | null;
  submittedAt: string | null;
};

export type ItemResultRow = {
  attemptId: string;
  learnerId: string;
  itemId: string;
  requirementId: string;
  formId: string;
  contentVersion: string;
  itemType: string;
  concept: string;
  status: string;
  awarded: number;
  available: number;
  mandatory: string | null;
  detail: string;
  createdAt: string;
};

const ATTEMPT_COLUMNS = `id, learner_id AS learnerId, course_id AS courseId, kind, module_id AS moduleId,
  form_id AS formId, content_version AS contentVersion, status, stage, draft_json AS draftJson,
  answers_json AS answersJson, code_json AS codeJson, knowledge_awarded AS knowledgeAwarded,
  knowledge_total AS knowledgeTotal, practical_awarded AS practicalAwarded, practical_total AS practicalTotal,
  debug_awarded AS debugAwarded, debug_total AS debugTotal, build_awarded AS buildAwarded,
  build_total AS buildTotal, total_awarded AS totalAwarded, total_available AS totalAvailable,
  mandatory_passed AS mandatoryPassed, needs_verification AS needsVerification, defence_passed AS defencePassed,
  outcome, started_at AS startedAt, saved_at AS savedAt, submitted_at AS submittedAt`;

export async function loadFormHistory(
  database: D1Database,
  learnerId: string,
  courseId: string,
  kind: string,
  moduleId: string | null,
): Promise<string[]> {
  const rows = await database
    .prepare(`SELECT form_id AS formId FROM assessment_attempts
      WHERE learner_id = ? AND course_id = ? AND kind = ? AND COALESCE(module_id, '') = ?
      ORDER BY started_at DESC LIMIT ?`)
    .bind(learnerId, courseId, kind, moduleId ?? "", MAX_HISTORY)
    .all<{ formId: string }>();
  return rows.results.map((row) => row.formId);
}

export async function loadOpenAttempt(
  database: D1Database,
  learnerId: string,
  courseId: string,
  kind: string,
  moduleId: string | null,
): Promise<AttemptRow | null> {
  const row = await database
    .prepare(`SELECT ${ATTEMPT_COLUMNS} FROM assessment_attempts
      WHERE learner_id = ? AND course_id = ? AND kind = ? AND COALESCE(module_id, '') = ? AND status = 'in_progress'
      ORDER BY started_at DESC LIMIT 1`)
    .bind(learnerId, courseId, kind, moduleId ?? "")
    .first<AttemptRow>();
  return row || null;
}

export async function loadAttempt(
  database: D1Database,
  learnerId: string,
  attemptId: string,
): Promise<AttemptRow | null> {
  const row = await database
    .prepare(`SELECT ${ATTEMPT_COLUMNS} FROM assessment_attempts WHERE id = ? AND learner_id = ?`)
    .bind(attemptId, learnerId)
    .first<AttemptRow>();
  return row || null;
}

export type NewAttempt = {
  id: string;
  courseId: string;
  kind: string;
  moduleId: string | null;
  formId: string;
  contentVersion: string;
  draftJson: string;
  knowledgeTotal: number;
  practicalTotal: number;
  debugTotal: number;
  buildTotal: number;
  totalAvailable: number;
  startedAt: string;
};

export async function insertAttempt(
  database: D1Database,
  learnerId: string,
  attempt: NewAttempt,
): Promise<void> {
  await database
    .prepare(`INSERT INTO assessment_attempts
      (id, learner_id, course_id, kind, module_id, form_id, content_version, status, stage, draft_json,
       answers_json, code_json, knowledge_total, practical_total, debug_total, build_total, total_available,
       started_at, saved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'in_progress', 'knowledge', ?, '[]', '{}', ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      attempt.id,
      learnerId,
      attempt.courseId,
      attempt.kind,
      attempt.moduleId,
      attempt.formId,
      attempt.contentVersion,
      attempt.draftJson.slice(0, MAX_DRAFT_BYTES),
      attempt.knowledgeTotal,
      attempt.practicalTotal,
      attempt.debugTotal,
      attempt.buildTotal,
      attempt.totalAvailable,
      attempt.startedAt,
      attempt.startedAt,
    )
    .run();
}

/* Autosave is a conditional write on an open attempt only. A submitted attempt is
 * never touched again, so a late autosave cannot reopen or alter a result. */
export async function saveDraft(
  database: D1Database,
  learnerId: string,
  attemptId: string,
  draftJson: string,
  stage: string,
  savedAt: string,
): Promise<boolean> {
  const result = await database
    .prepare(`UPDATE assessment_attempts SET draft_json = ?, stage = ?, saved_at = ?
      WHERE id = ? AND learner_id = ? AND status = 'in_progress'`)
    .bind(draftJson.slice(0, MAX_DRAFT_BYTES), stage, savedAt, attemptId, learnerId)
    .run();
  return (result.meta?.changes ?? 0) === 1;
}

export type FinalizePayload = {
  answersJson: string;
  codeJson: string;
  knowledgeAwarded: number;
  knowledgeTotal: number;
  practicalAwarded: number;
  practicalTotal: number;
  debugAwarded: number;
  debugTotal: number;
  buildAwarded: number;
  buildTotal: number;
  totalAwarded: number;
  totalAvailable: number;
  mandatoryPassed: boolean;
  needsVerification: boolean;
  outcome: string;
  stage: string;
  submittedAt: string;
};

/* Submission is one conditional update. Exactly one changed row means this request won
 * the attempt; anything else means somebody else already submitted it, and the caller
 * reports the stored result instead of grading again. */
export async function finalizeAttempt(
  database: D1Database,
  learnerId: string,
  attemptId: string,
  payload: FinalizePayload,
): Promise<boolean> {
  const result = await database
    .prepare(`UPDATE assessment_attempts SET
      status = 'submitted', stage = ?, answers_json = ?, code_json = ?, submitted_at = ?, saved_at = ?,
      knowledge_awarded = ?, knowledge_total = ?, practical_awarded = ?, practical_total = ?,
      debug_awarded = ?, debug_total = ?, build_awarded = ?, build_total = ?,
      total_awarded = ?, total_available = ?, mandatory_passed = ?, needs_verification = ?, outcome = ?
      WHERE id = ? AND learner_id = ? AND status = 'in_progress'`)
    .bind(
      payload.stage,
      payload.answersJson.slice(0, MAX_CODE_BYTES),
      payload.codeJson.slice(0, MAX_CODE_BYTES * 3),
      payload.submittedAt,
      payload.submittedAt,
      payload.knowledgeAwarded,
      payload.knowledgeTotal,
      payload.practicalAwarded,
      payload.practicalTotal,
      payload.debugAwarded,
      payload.debugTotal,
      payload.buildAwarded,
      payload.buildTotal,
      payload.totalAwarded,
      payload.totalAvailable,
      payload.mandatoryPassed ? 1 : 0,
      payload.needsVerification ? 1 : 0,
      payload.outcome,
      attemptId,
      learnerId,
    )
    .run();
  return (result.meta?.changes ?? 0) === 1;
}

/* Mark rows are inserted with the composite key, so a second submit of the same
 * attempt cannot double a mark even if it slipped past the conditional update. */
export async function insertItemResults(database: D1Database, rows: ItemResultRow[]): Promise<void> {
  if (rows.length === 0) return;
  const statements = rows.slice(0, 400).map((row) =>
    database
      .prepare(`INSERT INTO assessment_item_results
        (attempt_id, learner_id, item_id, requirement_id, form_id, content_version, item_type, concept,
         status, awarded, available, mandatory, detail, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (attempt_id, item_id, requirement_id) DO NOTHING`)
      .bind(
        row.attemptId,
        row.learnerId,
        row.itemId.slice(0, 120),
        row.requirementId.slice(0, 120),
        row.formId.slice(0, 80),
        row.contentVersion.slice(0, 40),
        row.itemType.slice(0, 20),
        row.concept.slice(0, 60),
        row.status.slice(0, 24),
        Math.max(0, Math.min(row.awarded, 100)),
        Math.max(0, Math.min(row.available, 100)),
        row.mandatory ? row.mandatory.slice(0, 20) : null,
        row.detail.slice(0, 400),
        row.createdAt,
      ),
  );
  for (let index = 0; index < statements.length; index += 40) {
    await database.batch(statements.slice(index, index + 40));
  }
}

export async function loadItemResults(
  database: D1Database,
  learnerId: string,
  attemptId: string,
): Promise<ItemResultRow[]> {
  const rows = await database
    .prepare(`SELECT attempt_id AS attemptId, learner_id AS learnerId, item_id AS itemId,
      requirement_id AS requirementId, form_id AS formId, content_version AS contentVersion,
      item_type AS itemType, concept, status, awarded, available, mandatory, detail, created_at AS createdAt
      FROM assessment_item_results WHERE attempt_id = ? AND learner_id = ? ORDER BY item_id, requirement_id`)
    .bind(attemptId, learnerId)
    .all<ItemResultRow>();
  return rows.results;
}

export async function loadSubmittedAttempts(
  database: D1Database,
  learnerId: string,
  courseId: string,
  kind: string,
): Promise<AttemptRow[]> {
  const rows = await database
    .prepare(`SELECT ${ATTEMPT_COLUMNS} FROM assessment_attempts
      WHERE learner_id = ? AND course_id = ? AND kind = ? AND status = 'submitted'
      ORDER BY submitted_at DESC LIMIT ?`)
    .bind(learnerId, courseId, kind, MAX_HISTORY)
    .all<AttemptRow>();
  return rows.results;
}

export async function countSubmittedAttempts(
  database: D1Database,
  learnerId: string,
  courseId: string,
  kind: string,
): Promise<number> {
  const row = await database
    .prepare(`SELECT COUNT(*) AS total FROM assessment_attempts
      WHERE learner_id = ? AND course_id = ? AND kind = ? AND status = 'submitted'`)
    .bind(learnerId, courseId, kind)
    .first<{ total: number }>();
  return row?.total ?? 0;
}

/* ------------------------------------------------------------------ revision -- */

export type RevisionRow = {
  concept: string;
  label: string;
  lessonId: string;
  sourceAttemptId: string;
  sourceKind: string;
  mandatory: string | null;
  readinessPassedAt: string | null;
  updatedAt: string;
};

export async function upsertRevisionItems(
  database: D1Database,
  learnerId: string,
  courseId: string,
  attemptId: string,
  sourceKind: string,
  items: Array<{ concept: string; label: string; lessonId: string; mandatory: string | null }>,
  now: string,
): Promise<void> {
  if (items.length === 0) return;
  const statements = items.slice(0, 40).map((item) =>
    database
      .prepare(`INSERT INTO assessment_revision_items
        (learner_id, course_id, concept, label, lesson_id, source_attempt_id, source_kind, mandatory,
         created_at, updated_at, readiness_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '{}')
        ON CONFLICT (learner_id, course_id, concept) DO UPDATE SET
          label = excluded.label,
          lesson_id = excluded.lesson_id,
          source_attempt_id = excluded.source_attempt_id,
          source_kind = excluded.source_kind,
          mandatory = excluded.mandatory,
          updated_at = excluded.updated_at`)
      .bind(
        learnerId,
        courseId,
        item.concept.slice(0, 60),
        item.label.slice(0, 140),
        item.lessonId.slice(0, 160),
        attemptId,
        sourceKind.slice(0, 20),
        item.mandatory,
        now,
        now,
      ),
  );
  await database.batch(statements);
}

export async function loadRevisionItems(
  database: D1Database,
  learnerId: string,
  courseId: string,
): Promise<RevisionRow[]> {
  const rows = await database
    .prepare(`SELECT concept, label, lesson_id AS lessonId, source_attempt_id AS sourceAttemptId,
      source_kind AS sourceKind, mandatory, readiness_passed_at AS readinessPassedAt, updated_at AS updatedAt
      FROM assessment_revision_items WHERE learner_id = ? AND course_id = ?
      ORDER BY updated_at DESC, concept`)
    .bind(learnerId, courseId)
    .all<RevisionRow>();
  return rows.results;
}

/* Readiness is recorded only for the learner's own row and only ever moves one way:
 * once a concept has been shown as ready it is not unlearned by a later attempt. */
export async function markReadiness(
  database: D1Database,
  learnerId: string,
  courseId: string,
  concepts: string[],
  readinessJson: string,
  now: string,
): Promise<number> {
  const unique = [...new Set(concepts.map((concept) => concept.slice(0, 60)))].slice(0, 40);
  if (unique.length === 0) return 0;
  const placeholders = unique.map(() => "?").join(", ");
  const result = await database
    .prepare(`UPDATE assessment_revision_items SET
      readiness_passed_at = COALESCE(readiness_passed_at, ?),
      readiness_json = ?, updated_at = ?
      WHERE learner_id = ? AND course_id = ? AND concept IN (${placeholders})`)
    .bind(now, readinessJson.slice(0, 2000), now, learnerId, courseId, ...unique)
    .run();
  return Number(result.meta?.changes ?? 0);
}

/* ------------------------------------------------------------------- signals -- */

export type SignalRow = {
  visibilityChanges: number;
  pasteEvents: number;
  largestPasteChars: number;
  saveCount: number;
  firstSavedAt: string | null;
  lastSavedAt: string | null;
};

export async function recordSignals(
  database: D1Database,
  learnerId: string,
  attemptId: string,
  delta: { visibilityChanges: number; pasteEvents: number; largestPasteChars: number; save: boolean },
  now: string,
): Promise<void> {
  const visibility = Math.max(0, Math.min(Math.floor(delta.visibilityChanges), 200));
  const pastes = Math.max(0, Math.min(Math.floor(delta.pasteEvents), 200));
  const largest = Math.max(0, Math.min(Math.floor(delta.largestPasteChars), 20000));
  await database
    .prepare(`INSERT INTO assessment_signals
      (attempt_id, learner_id, visibility_changes, paste_events, largest_paste_chars, save_count,
       first_saved_at, last_saved_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (attempt_id) DO UPDATE SET
        visibility_changes = MIN(assessment_signals.visibility_changes + excluded.visibility_changes, 200),
        paste_events = MIN(assessment_signals.paste_events + excluded.paste_events, 200),
        largest_paste_chars = MAX(assessment_signals.largest_paste_chars, excluded.largest_paste_chars),
        save_count = MIN(assessment_signals.save_count + excluded.save_count, 999),
        first_saved_at = COALESCE(assessment_signals.first_saved_at, excluded.first_saved_at),
        last_saved_at = COALESCE(excluded.last_saved_at, assessment_signals.last_saved_at),
        updated_at = excluded.updated_at`)
    .bind(
      attemptId,
      learnerId,
      visibility,
      pastes,
      largest,
      delta.save ? 1 : 0,
      delta.save ? now : null,
      delta.save ? now : null,
      now,
      now,
    )
    .run();
}

export async function loadSignals(
  database: D1Database,
  learnerId: string,
  attemptId: string,
): Promise<SignalRow> {
  const row = await database
    .prepare(`SELECT visibility_changes AS visibilityChanges, paste_events AS pasteEvents,
      largest_paste_chars AS largestPasteChars, save_count AS saveCount,
      first_saved_at AS firstSavedAt, last_saved_at AS lastSavedAt
      FROM assessment_signals WHERE attempt_id = ? AND learner_id = ?`)
    .bind(attemptId, learnerId)
    .first<SignalRow>();
  return row || { visibilityChanges: 0, pasteEvents: 0, largestPasteChars: 0, saveCount: 0, firstSavedAt: null, lastSavedAt: null };
}

/* ------------------------------------------------------------------- defence -- */

export type DefenceRow = {
  attemptId: string;
  learnerId: string;
  courseId: string;
  templateId: string;
  explainItemId: string;
  predictItemId: string;
  predictExpected: string;
  changeItemId: string;
  changePrompt: string;
  explainResponse: string;
  predictResponse: string;
  changeCodeJson: string;
  predictCorrect: number;
  changeStatus: string;
  status: string;
};

export async function loadDefence(
  database: D1Database,
  learnerId: string,
  attemptId: string,
): Promise<DefenceRow | null> {
  const row = await database
    .prepare(`SELECT attempt_id AS attemptId, learner_id AS learnerId, course_id AS courseId, template_id AS templateId,
      explain_item_id AS explainItemId, predict_item_id AS predictItemId, predict_expected AS predictExpected,
      change_item_id AS changeItemId, change_prompt AS changePrompt, explain_response AS explainResponse,
      predict_response AS predictResponse, change_code_json AS changeCodeJson, predict_correct AS predictCorrect,
      change_status AS changeStatus, status
      FROM assessment_defence WHERE attempt_id = ? AND learner_id = ?`)
    .bind(attemptId, learnerId)
    .first<DefenceRow>();
  return row || null;
}

export async function insertDefence(
  database: D1Database,
  row: {
    attemptId: string;
    learnerId: string;
    courseId: string;
    templateId: string;
    explainItemId: string;
    predictItemId: string;
    predictExpected: string;
    changeItemId: string;
    changePrompt: string;
  },
  now: string,
): Promise<void> {
  await database
    .prepare(`INSERT INTO assessment_defence
      (attempt_id, learner_id, course_id, template_id, explain_item_id, predict_item_id, predict_expected,
       change_item_id, change_prompt, explain_response, predict_response, change_code_json, predict_correct,
       change_status, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', '{}', 0, 'pending', 'pending', ?, ?)
      ON CONFLICT (attempt_id) DO NOTHING`)
    .bind(
      row.attemptId,
      row.learnerId,
      row.courseId,
      row.templateId.slice(0, 80),
      row.explainItemId.slice(0, 120),
      row.predictItemId.slice(0, 120),
      row.predictExpected.slice(0, 400),
      row.changeItemId.slice(0, 120),
      row.changePrompt.slice(0, 600),
      now,
      now,
    )
    .run();
}

export async function updateDefence(
  database: D1Database,
  learnerId: string,
  attemptId: string,
  update: {
    explainResponse: string;
    predictResponse: string;
    changeCodeJson: string;
    predictCorrect: boolean;
    changeStatus: string;
    status: string;
  },
  now: string,
): Promise<boolean> {
  const result = await database
    .prepare(`UPDATE assessment_defence SET explain_response = ?, predict_response = ?, change_code_json = ?,
      predict_correct = ?, change_status = ?, status = ?, updated_at = ?
      WHERE attempt_id = ? AND learner_id = ?`)
    .bind(
      update.explainResponse.slice(0, 2000),
      update.predictResponse.slice(0, 400),
      update.changeCodeJson.slice(0, MAX_CODE_BYTES * 3),
      update.predictCorrect ? 1 : 0,
      update.changeStatus.slice(0, 24),
      update.status.slice(0, 24),
      now,
      attemptId,
      learnerId,
    )
    .run();
  return (result.meta?.changes ?? 0) === 1;
}

export async function flagAttemptDefence(
  database: D1Database,
  learnerId: string,
  attemptId: string,
  passed: boolean,
): Promise<void> {
  await database
    .prepare("UPDATE assessment_attempts SET defence_passed = ? WHERE id = ? AND learner_id = ?")
    .bind(passed ? 1 : 0, attemptId, learnerId)
    .run();
}

/* After the defence the attempt's own outcome is recomputed, because passing the defence is
 * part of passing the final assessment. Only the defence fields change: the marks stay the
 * ones already stored and recorded, so a later defence can never alter a mark. */
export async function updateAttemptOutcome(
  database: D1Database,
  learnerId: string,
  attemptId: string,
  update: { outcome: string; needsVerification: boolean; stage: string },
): Promise<void> {
  await database
    .prepare(`UPDATE assessment_attempts SET outcome = ?, needs_verification = ?, stage = ?
      WHERE id = ? AND learner_id = ?`)
    .bind(update.outcome.slice(0, 32), update.needsVerification ? 1 : 0, update.stage.slice(0, 24), attemptId, learnerId)
    .run();
}

/* --------------------------------------------------------------- credentials -- */

export type CredentialRow = {
  id: string;
  courseId: string;
  level: string;
  certificateName: string;
  projectTitle: string;
  skillsJson: string;
  attemptId: string;
  issuedAt: string;
};

export async function loadCredential(
  database: D1Database,
  learnerId: string,
  courseId: string,
): Promise<CredentialRow | null> {
  const row = await database
    .prepare(`SELECT id, course_id AS courseId, level, certificate_name AS certificateName,
      project_title AS projectTitle, skills_json AS skillsJson, attempt_id AS attemptId, issued_at AS issuedAt
      FROM assessment_credentials WHERE learner_id = ? AND course_id = ?`)
    .bind(learnerId, courseId)
    .first<CredentialRow>();
  return row || null;
}

/* One credential per learner and course. The unique pair makes a repeated issue a
 * no-op, so a replayed request cannot mint a second certificate. */
export async function issueCredential(
  database: D1Database,
  learnerId: string,
  credential: {
    id: string;
    courseId: string;
    level: string;
    certificateName: string;
    projectTitle: string;
    skillsJson: string;
    attemptId: string;
  },
  now: string,
): Promise<CredentialRow | null> {
  await database
    .prepare(`INSERT INTO assessment_credentials
      (id, learner_id, course_id, level, certificate_name, project_title, skills_json, attempt_id, issued_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (learner_id, course_id) DO NOTHING`)
    .bind(
      credential.id,
      learnerId,
      credential.courseId,
      credential.level.slice(0, 60),
      credential.certificateName.slice(0, 80),
      credential.projectTitle.slice(0, 120),
      credential.skillsJson.slice(0, 2000),
      credential.attemptId,
      now,
    )
    .run();
  return loadCredential(database, learnerId, credential.courseId);
}