/*
 * Lesson review status and internal notes.
 *
 * STORAGE SEMANTICS, stated plainly because the brief asks for transparency:
 *
 *   There is no approved durable store for review notes yet. Adding one means a new D1
 *   migration, and the database audit scripts pin the migration sequence at 0000-0009 on
 *   purpose, so this work does not quietly add one. The notes are therefore held in the
 *   owner's own browser (localStorage) and are labelled as such in the interface, with an
 *   export/import so a review can be kept or attached to a pull request.
 *
 *   This module holds the rules only. It is pure and browser-free, so what a note may
 *   contain, what a status means and how a review is summarised can be asserted in a test
 *   without a database.
 *
 * A note never edits source content. It is a reviewer's annotation attached to a lesson key.
 */

export const reviewStatuses = ["unreviewed", "reviewed", "issue", "rewrite"] as const;
export type ReviewStatus = (typeof reviewStatuses)[number];

export const reviewStatusLabels: Record<ReviewStatus, string> = {
  unreviewed: "Not reviewed",
  reviewed: "Reviewed",
  issue: "Issue found",
  rewrite: "Needs rewrite",
};

export type LessonReview = {
  status: ReviewStatus;
  note: string;
  updatedAt: string;
};

export type ReviewBook = Record<string, LessonReview>;

export const REVIEW_NOTE_MAX = 2000;

export function isReviewStatus(value: unknown): value is ReviewStatus {
  return typeof value === "string" && (reviewStatuses as readonly string[]).includes(value);
}

export function emptyReview(): LessonReview {
  return { status: "unreviewed", note: "", updatedAt: "" };
}

/* Rejects anything that is not a lesson key the console could have produced, so a stored
 * book cannot carry arbitrary keys into the interface. */
const KEY_PATTERN = /^[a-z0-9][a-z0-9:._-]{0,200}$/i;

export function isValidLessonKey(key: string): boolean {
  return KEY_PATTERN.test(key) && key.split(":").length >= 3;
}

export function sanitizeNote(note: string): string {
  return note.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").slice(0, REVIEW_NOTE_MAX);
}

export function makeReview(status: ReviewStatus, note: string, now: Date = new Date()): LessonReview {
  return { status, note: sanitizeNote(note), updatedAt: now.toISOString() };
}

/* A stored book is untrusted input: it may come from an older version, a hand-edited export
 * or a different browser. Anything malformed is dropped rather than trusted. */
export function parseReviewBook(raw: unknown): ReviewBook {
  if (typeof raw !== "string" || raw.length > 500_000) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  return normalizeReviewBook(parsed);
}

export function normalizeReviewBook(parsed: unknown): ReviewBook {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  const book: ReviewBook = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!isValidLessonKey(key)) continue;
    if (!value || typeof value !== "object") continue;
    const entry = value as Partial<LessonReview>;
    if (!isReviewStatus(entry.status)) continue;
    const note = typeof entry.note === "string" ? sanitizeNote(entry.note) : "";
    const updatedAt = typeof entry.updatedAt === "string" ? entry.updatedAt.slice(0, 40) : "";
    book[key] = { status: entry.status, note, updatedAt };
  }
  return book;
}

export function serializeReviewBook(book: ReviewBook): string {
  return JSON.stringify(normalizeReviewBook(book));
}

export type ReviewSummary = {
  total: number;
  byStatus: Record<ReviewStatus, number>;
  noted: number;
  decided: number;
  completionPercent: number;
};

export function summarizeReview(book: ReviewBook, totalLessons: number): ReviewSummary {
  const byStatus: Record<ReviewStatus, number> = { unreviewed: 0, reviewed: 0, issue: 0, rewrite: 0 };
  let noted = 0;
  for (const entry of Object.values(normalizeReviewBook(book))) {
    byStatus[entry.status] += 1;
    if (entry.note.trim().length > 0) noted += 1;
  }
  const decided = byStatus.reviewed + byStatus.issue + byStatus.rewrite;
  const total = Math.max(totalLessons, decided);
  return {
    total,
    byStatus,
    noted,
    decided,
    completionPercent: total === 0 ? 0 : Math.round((decided / total) * 100),
  };
}
