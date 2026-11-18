"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  emptyReview,
  isReviewStatus,
  makeReview,
  normalizeReviewBook,
  parseReviewBook,
  reviewStatusLabels,
  reviewStatuses,
  serializeReviewBook,
  summarizeReview,
  type ReviewBook,
  type ReviewStatus,
} from "@/lib/admin-review";
import { LessonContent } from "@/components/admin/LessonContent";
import { adminRequestHeaders, captureReviewKeyFromLocation } from "@/components/admin/reviewKey";
import type {
  AnalyticsResponse,
  CurriculumResponse,
  LessonResponse,
  NotificationCatalogue,
  SendPlanResponse,
  SessionState,
} from "@/components/admin/types";

/*
 * The KidyCode owner admin console.
 *
 * One client shell over four read-only owner APIs. It reads; it never writes learner state
 * and it holds no write path to the course. The only thing it stores is the reviewer's own
 * notes, in this browser, clearly labelled as browser-local.
 *
 * If the owner gate is not configured the console says so and shows nothing else, rather
 * than offering a screen that cannot work.
 */

const REVIEW_STORAGE_KEY = "kidycode:admin:review-book:v1";

/* The review book is external state that lives in localStorage, so it is read through
 * useSyncExternalStore rather than copied into React state inside an effect. The snapshot is
 * cached, which keeps it referentially stable, and the server snapshot is a shared empty book
 * so the first paint does not depend on the browser. */
const EMPTY_BOOK: ReviewBook = {};
let cachedBook: ReviewBook | null = null;
const bookListeners = new Set<() => void>();

const reviewStore = {
  subscribe(listener: () => void) {
    bookListeners.add(listener);
    return () => { bookListeners.delete(listener); };
  },
  getSnapshot(): ReviewBook {
    if (cachedBook === null) cachedBook = readReviewBook();
    return cachedBook;
  },
  getServerSnapshot(): ReviewBook {
    return EMPTY_BOOK;
  },
  write(next: ReviewBook) {
    const normalized = normalizeReviewBook(next);
    cachedBook = normalized;
    try {
      window.localStorage.setItem(REVIEW_STORAGE_KEY, serializeReviewBook(normalized));
    } catch {
      /* A blocked storage API still keeps the notes on screen for this visit. */
    }
    bookListeners.forEach(listener => listener());
  },
};

type Tab = "overview" | "explorer" | "preview" | "analytics" | "friction" | "notifications" | "settings";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "explorer", label: "Curriculum Explorer" },
  { id: "preview", label: "Preview as Learner" },
  { id: "analytics", label: "Cohorts & Learners" },
  { id: "friction", label: "Friction & Retention" },
  { id: "notifications", label: "Notification Centre" },
  { id: "settings", label: "Settings & Audit" },
];

function formatWhen(value: string | null | undefined): string {
  if (!value) return "never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

function readReviewBook(): ReviewBook {
  if (typeof window === "undefined") return {};
  try {
    return parseReviewBook(window.localStorage.getItem(REVIEW_STORAGE_KEY) || "");
  } catch {
    return {};
  }
}

export function AdminConsole() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [sessionError, setSessionError] = useState("");
  const [tab, setTab] = useState<Tab>("overview");

  const [curriculum, setCurriculum] = useState<CurriculumResponse | null>(null);
  const [curriculumError, setCurriculumError] = useState("");
  const [lesson, setLesson] = useState<LessonResponse | null>(null);
  const [lessonError, setLessonError] = useState("");
  const [lessonLoadingKey, setLessonLoadingKey] = useState("");

  const book = useSyncExternalStore(reviewStore.subscribe, reviewStore.getSnapshot, reviewStore.getServerSnapshot);

  const [pathwayId, setPathwayId] = useState("all");
  const [unitIndex, setUnitIndex] = useState("all");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [flagFilter, setFlagFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [learnerAnswers, setLearnerAnswers] = useState(false);

  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [analyticsError, setAnalyticsError] = useState("");

  const [catalogue, setCatalogue] = useState<NotificationCatalogue | null>(null);
  const [draftTemplate, setDraftTemplate] = useState("unfinished-lesson");
  const [draftAudience, setDraftAudience] = useState("guardian");
  const [draftName, setDraftName] = useState("SkyCoder");
  const [draftLesson, setDraftLesson] = useState("Create an HTML element");
  const [planResult, setPlanResult] = useState<SendPlanResponse | null>(null);
  const [planError, setPlanError] = useState("");

  useEffect(() => {
    let active = true;
    async function open() {
      try {
        /* A review key supplied once as ?review= is moved into this tab before the first
         * request, so a synthetic review deployment can be opened from a link without the
         * key sitting in the address bar afterwards. */
        captureReviewKeyFromLocation();
        const response = await fetch("/api/admin/session", { cache: "no-store", headers: adminRequestHeaders() });
        const data = await response.json() as SessionState;
        if (!active) return;
        setSession(data);
      } catch (failure) {
        if (!active) return;
        setSessionError(failure instanceof Error ? failure.message : "The console could not be opened.");
      }
    }
    void open();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!session?.authenticated) return;
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/admin/curriculum", { cache: "no-store", headers: adminRequestHeaders() });
        const data = await response.json() as CurriculumResponse & { error?: string };
        if (!active) return;
        if (!response.ok) {
          setCurriculumError(data.error || "The curriculum index could not be loaded.");
          return;
        }
        setCurriculum(data);
      } catch (failure) {
        if (!active) return;
        setCurriculumError(failure instanceof Error ? failure.message : "The curriculum index could not be loaded.");
      }
    }
    void load();
    return () => { active = false; };
  }, [session?.authenticated]);

  const loadLesson = useCallback(async (key: string) => {
    setLessonLoadingKey(key);
    setLessonError("");
    try {
      const response = await fetch(`/api/admin/lesson?key=${encodeURIComponent(key)}`, { cache: "no-store", headers: adminRequestHeaders() });
      const data = await response.json() as LessonResponse & { error?: string };
      if (!response.ok) {
        setLessonError(data.error || "That lesson could not be opened.");
        return;
      }
      setLesson(data);
      setLearnerAnswers(false);
    } catch (failure) {
      setLessonError(failure instanceof Error ? failure.message : "That lesson could not be opened.");
    } finally {
      setLessonLoadingKey("");
    }
  }, []);

  useEffect(() => {
    if (tab !== "analytics" && tab !== "friction") return;
    if (analytics || analyticsError) return;
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/admin/analytics", { cache: "no-store", headers: adminRequestHeaders() });
        const data = await response.json() as AnalyticsResponse & { error?: string };
        if (!active) return;
        if (!response.ok) {
          setAnalyticsError(data.error || "Analytics could not be loaded.");
          return;
        }
        setAnalytics(data);
      } catch (failure) {
        if (!active) return;
        setAnalyticsError(failure instanceof Error ? failure.message : "Analytics could not be loaded.");
      }
    }
    void load();
    return () => { active = false; };
  }, [tab, analytics, analyticsError]);

  useEffect(() => {
    if (tab !== "notifications" || catalogue) return;
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/admin/notifications", { cache: "no-store", headers: adminRequestHeaders() });
        const data = await response.json() as NotificationCatalogue;
        if (!active) return;
        setCatalogue(data);
      } catch {
        /* The panel states the missing catalogue rather than inventing defaults. */
      }
    }
    void load();
    return () => { active = false; };
  }, [tab, catalogue]);

  const persist = useCallback((next: ReviewBook) => {
    reviewStore.write(next);
  }, []);

  const setReview = useCallback((key: string, status: ReviewStatus, note: string) => {
    persist({ ...normalizeReviewBook(reviewStore.getSnapshot()), [key]: makeReview(status, note) });
  }, [persist]);

  const pathways = useMemo(() => curriculum?.pathways ?? [], [curriculum]);
  const lessons = useMemo(() => curriculum?.lessons ?? [], [curriculum]);
  const totalLessons = curriculum?.totals.lessons ?? 0;

  const reviewSummary = useMemo(() => summarizeReview(book, totalLessons), [book, totalLessons]);

  const unitsForPathway = useMemo(() => {
    if (pathwayId === "all") return [];
    return pathways.find(pathway => pathway.id === pathwayId)?.units ?? [];
  }, [pathwayId, pathways]);

  const lessonTypes = useMemo(() => {
    const set = new Set(lessons.map(item => item.type));
    return [...set].sort();
  }, [lessons]);

  const flagCodes = useMemo(() => {
    const set = new Set<string>();
    lessons.forEach(item => item.flags.forEach(code => set.add(code)));
    return [...set].sort();
  }, [lessons]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return lessons.filter(item => {
      if (pathwayId !== "all" && item.pathwayId !== pathwayId) return false;
      if (unitIndex !== "all" && String(item.unitIndex) !== unitIndex) return false;
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (flagFilter !== "all" && !item.flags.includes(flagFilter)) return false;
      const entry = book[item.key] ?? emptyReview();
      if (statusFilter !== "all" && entry.status !== statusFilter) return false;
      if (needle) {
        const haystack = `${item.title} ${item.lessonId} ${item.unitTitle} ${item.pathwayId}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [lessons, pathwayId, unitIndex, typeFilter, flagFilter, statusFilter, query, book]);

  const provenanceLabel = session?.permission === "synthetic-review" ? "Synthetic review" : "Owner session";
  const provenanceClass = session?.permission === "synthetic-review" ? "adm-chip adm-chip-synthetic" : "adm-chip adm-chip-owner";

  function downloadReviewBook() {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), reviews: normalizeReviewBook(book) }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kidycode-admin-review-notes.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function importReviewBook(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as { reviews?: unknown };
        persist(normalizeReviewBook(parsed.reviews));
      } catch {
        /* An unreadable file changes nothing. */
      }
    };
    reader.readAsText(file);
  }

  async function planNotification() {
    setPlanError("");
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: adminRequestHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          template: draftTemplate,
          audience: draftAudience,
          recipientRef: "pathway-wide",
          variables: { name: draftName, lessonTitle: draftLesson, moduleTitle: "Module 2: Connect and describe content", nextSuggestion: "ten minutes on the next lesson", completedCount: "5", streak: "3", organisationName: "KidyCode" },
        }),
      });
      const data = await response.json() as SendPlanResponse & { error?: string };
      if (!response.ok) {
        setPlanError(data.error || "The draft could not be planned.");
        return;
      }
      setPlanResult(data);
    } catch (failure) {
      setPlanError(failure instanceof Error ? failure.message : "The draft could not be planned.");
    }
  }

  const openLessonKey = lesson?.location.key ?? "";
  const openReview = openLessonKey ? (book[openLessonKey] ?? emptyReview()) : emptyReview();

  return (
    <div className="adm-shell">
      <a className="adm-skip" href="#adm-main">Skip to the console content</a>
      <header className="adm-topbar">
        <div className="adm-brand">
          <strong>KidyCode Admin Console</strong>
          <span>Owner operations tool — read only</span>
        </div>
        <div className="adm-topbar-meta">
          <span className={provenanceClass}>{provenanceLabel}</span>
          <span className="adm-chip adm-chip-readonly">No learner writes</span>
          {session?.owner && <span>{session.owner.displayName || session.owner.platformUserId}</span>}
        </div>
      </header>

      {session?.permission === "synthetic-review" && (
        <p className="adm-banner adm-banner-synthetic" role="status">
          <strong>Synthetic review mode.</strong> No owner identity is configured in this deployment, so the console is running against the built-in curriculum only.
          Nothing here is a real learner record, and no count on the analytics screens is live activity unless it says it is recorded.
        </p>
      )}

      {!session?.authenticated && (
        <p className="adm-banner adm-banner-closed" role="status">
          <strong>The owner console is closed.</strong> Owner access needs a signed platform identity
          (<code>KIDYCODE_IDENTITY_SECRET</code> in proxy-signature mode) and an approved account in <code>KIDYCODE_ADMIN_USER_IDS</code>.
          {session?.gate && !session.gate.configured && !session.gate.synthetic && " Neither is configured in this deployment."}
          {session?.notice ? ` ${session.notice}` : ""}
        </p>
      )}
      {sessionError && <p className="adm-banner adm-banner-closed" role="alert">{sessionError}</p>}

      <div className="adm-body">
        {session?.authenticated && (
          <nav className="adm-nav" aria-label="Admin console sections">
            {tabs.map(item => (
              <button
                key={item.id}
                type="button"
                aria-current={tab === item.id ? "true" : undefined}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}

        <main id="adm-main" className="adm-panel">
          {!session && <p className="adm-note">Opening the console…</p>}

          {session?.authenticated && tab === "overview" && (
            <>
              <div className="adm-card">
                <h2>What this console is</h2>
                <p className="adm-card-lede">
                  Every screen is read only. It reads the curriculum from the same modules the learner routes render, so what you
                  inspect here is exactly what a learner would be taught. It holds no path that could submit a quiz answer, change a
                  learner&apos;s progress, complete a checkpoint or issue a certificate.
                </p>
              </div>

              <div className="adm-card">
                <h3>Curriculum at a glance</h3>
                <dl className="adm-stat-grid">
                  <div className="adm-stat"><dt>Pathways</dt><dd>{curriculum?.totals.pathways ?? "…"}</dd><small>coding and UI/UX design</small></div>
                  <div className="adm-stat"><dt>Modules</dt><dd>{curriculum?.totals.units ?? "…"}</dd><small>stages and design modules</small></div>
                  <div className="adm-stat"><dt>Lessons</dt><dd>{curriculum?.totals.lessons ?? "…"}</dd><small>every lesson is openable</small></div>
                  <div className="adm-stat"><dt>With an answer key</dt><dd>{curriculum?.totals.withQuestions ?? "…"}</dd><small>questions and explanations</small></div>
                  <div className="adm-stat"><dt>Your review progress</dt><dd>{reviewSummary.decided}/{reviewSummary.total}</dd><small>{reviewSummary.completionPercent}% marked</small></div>
                  <div className="adm-stat"><dt>Lessons with suggestions</dt><dd>{curriculum?.quality.lessonsWithFlags ?? "…"}</dd><small>heuristic, not verified</small></div>
                </dl>
                <div className="adm-meter" role="img" aria-label={`Review progress ${reviewSummary.completionPercent} percent`}>
                  <span style={{ width: `${reviewSummary.completionPercent}%` }} />
                </div>
                <p className="adm-note">
                  Not reviewed {reviewSummary.byStatus.unreviewed} · Reviewed {reviewSummary.byStatus.reviewed} · Issue found {reviewSummary.byStatus.issue} · Needs rewrite {reviewSummary.byStatus.rewrite} · With a note {reviewSummary.noted}
                </p>
                <div className="adm-button-row">
                  <button type="button" className="adm-button" onClick={() => setTab("explorer")}>Open the Curriculum Explorer</button>
                  <button type="button" className="adm-button adm-button-quiet" onClick={() => setTab("preview")}>Preview as a learner</button>
                </div>
              </div>

              <div className="adm-card">
                <h3>What is honest about this screen</h3>
                <p className="adm-card-lede">
                  Learner counts, sign-in counts and week-on-week retention are only shown where an event was actually recorded.
                  KidyCode records a learner profile, a last-seen timestamp and lesson progress. It does not record sign-ins or
                  interaction events, so those measures say &quot;not tracked yet&quot; beside the reason instead of showing a guess.
                  Owner review notes are saved in this browser only; export them to keep or share them.
                </p>
                <p className="adm-note">{curriculum?.quality.note}</p>
                <p className="adm-note">Source of this curriculum index: {curriculum?.source ?? "loading"}.</p>
              </div>
            </>
          )}

          {session?.authenticated && tab === "explorer" && (
            <>
              {curriculumError && <p className="adm-banner adm-banner-closed" role="alert">{curriculumError}</p>}
              <div className="adm-card">
                <h2>Curriculum Explorer</h2>
                <p className="adm-card-lede">
                  Search and filter every module, lesson, practice question and assessment across all age pathways. Open any lesson —
                  including one that would be locked in learner mode — as a read-only preview.
                </p>
                <div className="adm-filters">
                  <div className="adm-field">
                    <label htmlFor="adm-pathway">Pathway</label>
                    <select id="adm-pathway" value={pathwayId} onChange={event => { setPathwayId(event.target.value); setUnitIndex("all"); }}>
                      <option value="all">All pathways</option>
                      {pathways.map(pathway => (
                        <option key={pathway.id} value={pathway.id}>{pathway.title} — {pathway.ageRange}</option>
                      ))}
                    </select>
                  </div>
                  <div className="adm-field">
                    <label htmlFor="adm-unit">Module</label>
                    <select id="adm-unit" value={unitIndex} onChange={event => setUnitIndex(event.target.value)} disabled={pathwayId === "all"}>
                      <option value="all">All modules</option>
                      {unitsForPathway.map(unit => (
                        <option key={unit.index} value={String(unit.index)}>{unit.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="adm-field">
                    <label htmlFor="adm-type">Lesson type</label>
                    <select id="adm-type" value={typeFilter} onChange={event => setTypeFilter(event.target.value)}>
                      <option value="all">Any type</option>
                      {lessonTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <div className="adm-field">
                    <label htmlFor="adm-status">Review status</label>
                    <select id="adm-status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
                      <option value="all">Any status</option>
                      {reviewStatuses.map(status => <option key={status} value={status}>{reviewStatusLabels[status]}</option>)}
                    </select>
                  </div>
                  <div className="adm-field">
                    <label htmlFor="adm-flag">Automatic suggestion</label>
                    <select id="adm-flag" value={flagFilter} onChange={event => setFlagFilter(event.target.value)}>
                      <option value="all">Any</option>
                      {flagCodes.map(code => <option key={code} value={code}>{code}</option>)}
                    </select>
                  </div>
                  <div className="adm-field">
                    <label htmlFor="adm-search">Search</label>
                    <input id="adm-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Lesson title, idea or module" />
                  </div>
                </div>
                <p className="adm-note" role="status">{filtered.length} of {totalLessons} lessons match.</p>
              </div>

              <div className="adm-grid-2">
                <div className="adm-card">
                  <h3>Lessons</h3>
                  <ul className="adm-list adm-lesson-list">
                    {filtered.slice(0, 400).map(item => {
                      const entry = book[item.key] ?? emptyReview();
                      return (
                        <li key={item.key}>
                          <button
                            type="button"
                            className="adm-lesson-row"
                            aria-current={openLessonKey === item.key ? "true" : undefined}
                            onClick={() => loadLesson(item.key)}
                          >
                            <strong>{item.title}</strong>
                            <small>{item.unitTitle} · {item.type} · {item.minutes === null ? "no time estimate" : `${item.minutes} min`} · {item.questionCount} question{item.questionCount === 1 ? "" : "s"}</small>
                            <span className="adm-tags">
                              {entry.status !== "unreviewed" && (
                                <span className={entry.status === "issue" ? "adm-tag adm-tag-issue" : entry.status === "rewrite" ? "adm-tag adm-tag-rewrite" : "adm-tag adm-tag-reviewed"}>
                                  {reviewStatusLabels[entry.status]}
                                </span>
                              )}
                              {item.flags.slice(0, 4).map(code => <span className="adm-tag adm-tag-suggestion" key={code}>{code}</span>)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                    {filtered.length === 0 && <li className="adm-note">No lesson matches these filters.</li>}
                  </ul>
                  {filtered.length > 400 && <p className="adm-note">Showing the first 400 matches. Narrow the search to see the rest.</p>}
                </div>

                <div className="adm-card">
                  {lessonLoadingKey && <p className="adm-note">Opening {lessonLoadingKey}…</p>}
                  {lessonError && <p className="adm-banner adm-banner-closed" role="alert">{lessonError}</p>}
                  {!lesson && !lessonLoadingKey && (
                    <p className="adm-note">Choose a lesson to read its full content, answer key and automatic suggestions.</p>
                  )}
                  {lesson && (
                    <>
                      <h3>{lesson.lesson.title}</h3>
                      <p className="adm-note">
                        {lesson.location.pathwayTitle} — {lesson.location.ageRange} · {lesson.location.unitTitle} · position {lesson.location.positionInPathway + 1} of {lesson.location.totalInPathway} in this pathway
                      </p>
                      <p className="adm-note">{lesson.previewNotice}</p>
                      <div className="adm-button-row">
                        <button type="button" className="adm-button adm-button-quiet" disabled={!lesson.neighbours.previous} onClick={() => lesson.neighbours.previous && loadLesson(lesson.neighbours.previous.key)}>
                          Previous lesson
                        </button>
                        <button type="button" className="adm-button adm-button-quiet" disabled={!lesson.neighbours.next} onClick={() => lesson.neighbours.next && loadLesson(lesson.neighbours.next.key)}>
                          Next lesson
                        </button>
                        <button type="button" className="adm-button" onClick={() => { setLearnerAnswers(false); setTab("preview"); }}>
                          View as learner
                        </button>
                      </div>
                      <LessonContent lesson={lesson.lesson} mode="review" showAnswers onToggleAnswers={() => undefined} flags={lesson.quality.flags} />
                      <div className="adm-card">
                        <h4>Your review of this lesson</h4>
                        <div className="adm-field">
                          <label htmlFor="adm-review-status">Status</label>
                          <select
                            id="adm-review-status"
                            value={openReview.status}
                            onChange={event => {
                              const value = event.target.value;
                              if (isReviewStatus(value)) setReview(lesson.location.key, value, openReview.note);
                            }}
                          >
                            {reviewStatuses.map(status => <option key={status} value={status}>{reviewStatusLabels[status]}</option>)}
                          </select>
                        </div>
                        <div className="adm-field">
                          <label htmlFor="adm-review-note">Internal note</label>
                          <textarea
                            id="adm-review-note"
                            value={openReview.note}
                            onChange={event => setReview(lesson.location.key, openReview.status, event.target.value)}
                            placeholder="What you found, what to change, who should act."
                          />
                        </div>
                        <p className="adm-note">
                          Saved in this browser only — there is no approved durable store for review notes yet, and this build does not add a
                          database migration for one. Export from Settings &amp; Audit to keep the notes. Last changed {formatWhen(openReview.updatedAt)}.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {session?.authenticated && tab === "preview" && (
            <div className="adm-card">
              <h2>Preview as a learner</h2>
              <p className="adm-card-lede">
                A sandboxed, read-only walk through a lesson exactly as a learner meets it, with the quiz gate skipped for the owner.
                There is no submit, no grading and no progress write anywhere on this screen, and the session never becomes a real
                learner identity.
              </p>
              <div className="adm-button-row">
                <button type="button" className="adm-button adm-button-quiet" disabled={!lesson || !lesson.neighbours.previous} onClick={() => lesson?.neighbours.previous && loadLesson(lesson.neighbours.previous.key)}>
                  Back
                </button>
                <button type="button" className="adm-button adm-button-quiet" disabled={!lesson || !lesson.neighbours.next} onClick={() => lesson?.neighbours.next && loadLesson(lesson.neighbours.next.key)}>
                  Forward
                </button>
                <button type="button" className="adm-button adm-button-quiet" onClick={() => setTab("explorer")}>Pick a different lesson</button>
              </div>
              {!lesson && <p className="adm-note">Open a lesson from the Curriculum Explorer first, or use the Explorer tab to choose one.</p>}
              {lesson && (
                <>
                  <div className="adm-button-row">
                    <label className="adm-field" style={{ maxWidth: "18rem" }}>
                      <span>Jump to a lesson</span>
                      <select
                        value={lesson.location.key}
                        onChange={event => loadLesson(event.target.value)}
                        aria-label="Jump to a lesson"
                      >
                        {lessons.map(item => <option key={item.key} value={item.key}>{item.pathwayId} — {item.title}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="adm-preview-frame">
                    <p className="adm-preview-flag">Owner preview — read only, progress not recorded</p>
                    <p className="adm-note">{lesson.location.pathwayTitle} · {lesson.location.unitTitle} · position {lesson.location.positionInPathway + 1} of {lesson.location.totalInPathway}</p>
                    <h3>{lesson.lesson.title}</h3>
                    <LessonContent
                      lesson={lesson.lesson}
                      mode="learner"
                      showAnswers={learnerAnswers}
                      onToggleAnswers={() => setLearnerAnswers(current => !current)}
                      flags={lesson.quality.flags}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {(session?.authenticated && (tab === "analytics" || tab === "friction")) && (
            <>
              {analyticsError && <p className="adm-banner adm-banner-closed" role="alert">{analyticsError}</p>}
              <div className="adm-card">
                <h2>{tab === "analytics" ? "Cohorts and learners" : "Friction and retention"}</h2>
                <p className="adm-card-lede">
                  Aggregates read from the database, each with the table it came from and a plain-language definition. Groups below
                  {analytics ? ` ${analytics.report.kAnonymityFloor}` : " the"} learners are suppressed so a small cohort cannot reveal one child.
                </p>
                {analytics && <p className="adm-note">Generated {formatWhen(analytics.report.generatedAt)} · window {analytics.report.windowDays} days.</p>}
              </div>

              {analytics && tab === "analytics" && (
                <>
                  <div className="adm-card">
                    <h3>Recorded figures</h3>
                    <div className="adm-table-wrap">
                      <table className="adm-table">
                        <thead>
                          <tr><th scope="col">Measure</th><th scope="col">Value</th><th scope="col">Where it comes from</th><th scope="col">What was counted</th></tr>
                        </thead>
                        <tbody>
                          {analytics.report.metrics.map(metric => (
                            <tr key={metric.id}>
                              <th scope="row">{metric.label}</th>
                              <td>
                                {metric.provenance === "recorded"
                                  ? `${metric.value ?? 0}${metric.unit ? ` ${metric.unit}` : ""}`
                                  : metric.provenance === "unavailable" ? "unavailable in this database" : "not tracked yet"}
                                {metric.note && <><br /><small className="adm-note">{metric.note}</small></>}
                              </td>
                              <td><code>{metric.source}</code></td>
                              <td>{metric.definition}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="adm-card">
                    <h3>Learners by pathway</h3>
                    {analytics.report.byCourse.length === 0
                      ? <p className="adm-note">No learner profile is recorded yet.</p>
                      : (
                        <ul className="adm-list">
                          {analytics.report.byCourse.map(row => (
                            <li key={row.label}>
                              {row.label}: {row.suppressed ? `fewer than ${analytics.report.kAnonymityFloor} learners — suppressed` : `${row.count} learners`}
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>

                  <div className="adm-card">
                    <h3>Cohorts</h3>
                    {analytics.report.byCohort.length === 0
                      ? <p className="adm-note">No institution cohort is recorded, so there is nothing to show here. Cohorts appear only when real cohort records exist.</p>
                      : (
                        <ul className="adm-list">
                          {analytics.report.byCohort.map(row => (
                            <li key={row.label}>
                              {row.label}: {row.suppressed ? `fewer than ${analytics.report.kAnonymityFloor} enrolled learners — suppressed` : `${row.count} enrolled learners`}
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>
                </>
              )}

              {analytics && tab === "friction" && (
                <>
                  <div className="adm-card adm-warn">
                    <h3>Not tracked yet</h3>
                    <p className="adm-card-lede">
                      These measures have no recorded source in this database. They are listed with the reason and what would have to be
                      instrumented, and they are never estimated. Nothing is back-filled.
                    </p>
                    <ul className="adm-list">
                      {analytics.report.notTracked.map(item => (
                        <li key={item.id}>
                          <strong>{item.label}</strong>
                          <p className="adm-note">{item.reason}</p>
                          <p className="adm-note">To instrument: {item.toInstrument}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="adm-card">
                    <h3>Struggling topics (recorded: attempts and successful checks)</h3>
                    {analytics.report.strugglingTopics.length === 0
                      ? <p className="adm-note">No lesson evidence is recorded yet.</p>
                      : (
                        <div className="adm-table-wrap">
                          <table className="adm-table">
                            <thead><tr><th scope="col">Lesson</th><th scope="col">Attempts</th><th scope="col">Successful checks</th></tr></thead>
                            <tbody>
                              {analytics.report.strugglingTopics.map(row => (
                                <tr key={row.lessonId}>
                                  <td>{row.lessonId}</td>
                                  <td>{row.attempts < analytics.report.kAnonymityFloor ? `fewer than ${analytics.report.kAnonymityFloor} — suppressed` : row.attempts}</td>
                                  <td>{row.suppressed || row.successRate === null ? "suppressed" : `${row.successRate}%`}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                  </div>

                  <div className="adm-card">
                    <h3>What a retention view would need</h3>
                    <p className="adm-card-lede">
                      A week-on-week retention chart needs an event history keyed to each learner&apos;s first week. KidyCode keeps one
                      last-seen timestamp per learner and no activity log, so no honest week-0 / week-1 figure can be drawn from it.
                      This screen therefore shows nothing here rather than a plausible shape. The privacy-first instrumentation listed
                      above, with a minimum group size and a documented retention period, is what would make this screen real.
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          {session?.authenticated && tab === "notifications" && (
            <>
              <div className="adm-card">
                <h2>Notification Centre</h2>
                <p className="adm-card-lede">
                  Draft a message and see exactly what it would say, plus a dry-run delivery plan. Nothing is sent. No provider, no
                  credential and no connection exists in this build, and live delivery stays off until the owner approves a provider and
                  the consent work is done.
                </p>
                <p className="adm-note">{catalogue?.notice ?? "Loading the template catalogue…"}</p>
                <p className="adm-note">
                  Rules enforced here: only the platform owner may broadcast; an institution role reaches only its own cohorts; a guardian
                  reaches only a verifiably linked child; a learner under 18 is not messaged directly without explicit child-directed
                  consent; quiet hours {catalogue ? `${catalogue.quietHours.startHour}:00 to ${catalogue.quietHours.endHour}:00 ${catalogue.quietHours.timeZone}` : "apply"}; and a cap of {catalogue?.frequencyCapPerWeek ?? 2} messages per recipient per week.
                </p>
              </div>

              <div className="adm-grid-2">
                <div className="adm-card">
                  <h3>Draft</h3>
                  <div className="adm-field">
                    <label htmlFor="adm-template">Template</label>
                    <select id="adm-template" value={draftTemplate} onChange={event => setDraftTemplate(event.target.value)}>
                      {(catalogue?.templates ?? ["unfinished-lesson"]).map(template => <option key={template} value={template}>{template}</option>)}
                    </select>
                  </div>
                  <div className="adm-field">
                    <label htmlFor="adm-audience">Audience</label>
                    <select id="adm-audience" value={draftAudience} onChange={event => setDraftAudience(event.target.value)}>
                      {(catalogue?.audiences ?? ["guardian"]).map(audience => <option key={audience} value={audience}>{audience}</option>)}
                    </select>
                  </div>
                  <div className="adm-field">
                    <label htmlFor="adm-name">Learner nickname (never a full name)</label>
                    <input id="adm-name" type="text" value={draftName} onChange={event => setDraftName(event.target.value)} maxLength={24} />
                  </div>
                  <div className="adm-field">
                    <label htmlFor="adm-lesson">Lesson title</label>
                    <input id="adm-lesson" type="text" value={draftLesson} onChange={event => setDraftLesson(event.target.value)} maxLength={80} />
                  </div>
                  <div className="adm-button-row">
                    <button type="button" className="adm-button" onClick={planNotification}>Preview and dry-run plan</button>
                  </div>
                  {planError && <p className="adm-banner adm-banner-closed" role="alert">{planError}</p>}
                </div>

                <div className="adm-card">
                  <h3>What would be sent</h3>
                  {!planResult && <p className="adm-note">Run a preview to see the message and the delivery plan.</p>}
                  {planResult && (
                    <>
                      <p><strong>{planResult.preview.subject}</strong></p>
                      <p className="adm-note">{planResult.preview.body}</p>
                      <h4>Delivery plan — dry run only</h4>
                      <ul className="adm-list">
                        {planResult.plan.reasons.map((reason, index) => <li key={index} className="adm-note">{reason}</li>)}
                      </ul>
                      <p className="adm-note adm-blocked">
                        Live delivery enabled: no. This build has no send path, so no SMS, WhatsApp, email or push leaves the server.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {session?.authenticated && tab === "settings" && (
            <>
              <div className="adm-card">
                <h2>Settings and audit</h2>
                <p className="adm-card-lede">What this deployment can prove about itself, and what it cannot.</p>
                <dl className="adm-stat-grid">
                  <div className="adm-stat"><dt>Owner allowlist configured</dt><dd>{session.gate.configured ? "yes" : "no"}</dd><small>KIDYCODE_ADMIN_USER_IDS plus a signing secret</small></div>
                  <div className="adm-stat"><dt>Identity trust mode</dt><dd style={{ fontSize: "1rem" }}>{session.identityTrust}</dd><small>proxy-signature is the only mode that grants owner access</small></div>
                  <div className="adm-stat"><dt>Read-only console</dt><dd style={{ fontSize: "1rem" }}>yes</dd><small>no write path to learner state</small></div>
                  <div className="adm-stat"><dt>Review notes</dt><dd style={{ fontSize: "1rem" }}>browser-local</dd><small>no durable store yet</small></div>
                </dl>
              </div>

              <div className="adm-card">
                <h3>Review notes</h3>
                <p className="adm-card-lede">
                  {reviewSummary.decided} of {reviewSummary.total} lessons marked, {reviewSummary.noted} with a note. Stored in this browser only.
                </p>
                <div className="adm-button-row">
                  <button type="button" className="adm-button" onClick={downloadReviewBook}>Export notes (JSON)</button>
                  <label className="adm-field" style={{ maxWidth: "20rem" }}>
                    <span>Import notes (JSON)</span>
                    <input
                      type="file"
                      accept="application/json"
                      onChange={event => {
                        const file = event.target.files?.[0];
                        if (file) importReviewBook(file);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="adm-card">
                <h3>Data this console reads</h3>
                <ul className="adm-list">
                  {analytics
                    ? analytics.report.metrics.map(metric => (
                      <li key={metric.id}><strong>{metric.label}</strong> — <code>{metric.source}</code>. {metric.definition}</li>
                    ))
                    : <li className="adm-note">Open Cohorts &amp; Learners to load the data dictionary for this database.</li>}
                </ul>
              </div>

              <div className="adm-card">
                <h3>Owner review checklist</h3>
                <ol>
                  <li>Open the Curriculum Explorer and confirm every age pathway is listed, including UI/UX design.</li>
                  <li>Open one lesson per pathway and check the notes, example, hints and answer key read correctly.</li>
                  <li>Use Preview as Learner to walk forward and back across a module boundary, and confirm no progress is written.</li>
                  <li>Mark a lesson as an issue and export your notes from this screen.</li>
                  <li>Open Friction &amp; Retention and confirm the measures that say &quot;not tracked yet&quot; are the ones KidyCode does not record.</li>
                  <li>Draft one guardian message and confirm the dry-run plan refuses live delivery.</li>
                </ol>
              </div>
            </>
          )}
        </main>
      </div>

      <footer className="adm-footer">
        <p>
          KidyCode owner console · read only · no learner state is written, no certificate is issued and no message is sent.
          The console is closed to every role that is not an approved owner with a signed identity.
        </p>
        <p><Link href="/">Back to KidyCode</Link></p>
      </footer>
    </div>
  );
}
