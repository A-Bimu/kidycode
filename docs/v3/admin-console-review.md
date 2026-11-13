# KidyCode owner admin console — P0 review note

Branch: `feat/admin-review-console` · draft PR: **do not merge** · author: Hermes
Date: 2026-11-13

This note records exactly what was built, what was verified, what was *not* built, and the one
thing that blocks a live review link.

## 1. What shipped (P0)

A secured owner console at `/admin` with seven sections, backed by four read-only owner APIs.

| Surface | Route | What it does |
| --- | --- | --- |
| Curriculum index | `GET /api/admin/curriculum` | Every pathway, module and lesson; per-lesson heuristic flags; totals |
| Lesson detail | `GET /api/admin/lesson?key=…` | Full original content incl. answer key, hints, rubric, starter files, neighbours |
| Aggregate analytics | `GET /api/admin/analytics` | Recorded figures with source tables, k-anonymity suppression, "not tracked yet" list |
| Notification draft | `GET`/`POST /api/admin/notifications` | Template preview + dry-run delivery plan; no send path exists |
| Session probe | `GET /api/admin/session` | Only non-gated endpoint; returns gate state and nothing sensitive |

UI sections: Overview · Curriculum Explorer · Preview as Learner · Cohorts & Learners ·
Friction & Retention · Notification Centre · Settings & Audit.

The console is **read only by construction**. The only database-touching route is analytics and
it issues `SELECT`s only. The lesson route has no database access at all, so opening a lesson
cannot create a practice submission, progress row, grade, checkpoint or certificate. A test
asserts that every admin data route calls `requireOwner` and contains no write statement.

### Coverage

- 8 pathways: `ages-10-12`, `ages-13-15`, `ages-16-18`, `adults` (coding) + `design:ages-10-12`,
  `design:ages-13-15`, `design:ages-16-18`, `design:adults` (UI/UX design).
- 60 modules, **248 lessons**, 244 with an answer key. Every lesson is openable, including the
  final assessment of each pathway, which is gated for a learner.
- Search + filters: pathway, module, lesson type, review status, automatic-suggestion code, free
  text. Lesson list shows per-lesson review state and flag tags.
- "Preview as Learner" is a sandboxed read-only walk: prominent `OWNER PREVIEW — READ ONLY`
  banner, forward/back across module and pathway boundaries, quiz gate skipped for the owner,
  answer key behind a deliberate toggle. No submit, grading, certificate or completion control
  exists on that screen (asserted).

### Review notes (honest storage semantics)

Lesson review status (`not reviewed / reviewed / issue found / needs rewrite`) and an internal
note are real and working, stored in the owner's browser (`localStorage`) with JSON export and
import. This is labelled on screen as **"Saved in this browser only"**.

Why not a table: the database audit scripts pin the migration sequence at `0000–0009`
(`scripts/audit-database.mjs` asserts `0009` is newest and the prefix list is exactly
`0000…0009`; `scripts/validate-certification.mjs` pins `assessment_credentials` to `0007`).
Adding a migration would mean editing two guard scripts whose job is to notice schema drift, so
this work does not add one. A durable store is a follow-up that needs an approved migration.

### Curriculum quality checks

`lib/admin-quality.ts` scans all 248 lessons for thin or missing notes, missing worked examples,
missing hints, lessons with no automatic requirement, quizzes with no or too few questions,
answer indices out of range, duplicate options, empty options, weak explanations, images without
alt text, inputs without an id, empty buttons, absent or excessive time estimates, and duplicate
question prompts across lessons.

Every item is labelled **"suggestion"** or **"info"**, and the UI says: *"These are suggestions
produced by a reading of the content, not findings of fact. A reviewer decides."*

Current readings (real, from the catalogue): 93 of 248 lessons carry at least one suggestion;
114 duplicate-prompt groups. The duplicate count is high mainly because the four UI/UX design
bands deliberately teach the same design idea with the same check prompt, and the four coding
pathways share a common final-knowledge bank. That is a content decision to review, not a defect
the tool proved.

## 2. Analytics honesty (P1, partial by design)

Recorded and shown, each with its source table and a plain-language definition:

`learner_profiles` (total, active in 7 days, active in 30 days) · `course_progress` (completions,
rows started, completions in window) · `project_checkpoints` · `exam_attempts` ·
`assessment_credentials` · learners by pathway · cohort enrolment counts · struggling topics from
`lesson_evidence`.

Declared **"not tracked yet"**, with the reason and what would have to be instrumented:

- Verified sign-ins — no auth event is written; a sign-in leaves no row.
- DAU/WAU — only one last-seen timestamp per learner is stored.
- Week-over-week retention cohorts — needs an event history, not a single timestamp.
- Hint usage / failed checks / abandoned steps — `lesson_evidence` stores per-lesson counts, not
  event-level records.

No retention chart is drawn. The screen says plainly why rather than showing a plausible shape.
Groups smaller than 5 are suppressed (`K_ANONYMITY_FLOOR`), and no learner is ever named.

## 3. Notifications (P2, deliberately inert)

Templates: unfinished lesson, new module, missed week, achievement, guardian report,
announcement. Rendering, permission rules, quiet hours (19:00–07:00 in the recipient's zone),
a 2-per-week frequency cap and a dry-run plan are implemented and tested.

`planSend` returns `liveDeliveryEnabled: false` as a constant. There is no provider, no
credential and no network call in the module. Permission separation is enforced in pure code:
owners may broadcast; an institution role reaches only a cohort it leads and never a learner
directly; a guardian reaches only a linked child; an under-18 learner is refused without
explicit child-directed consent.

## 4. Security model

Owner access requires **both**: `proxy-signature` trust mode with a `KIDYCODE_IDENTITY_SECRET`
of ≥32 characters, **and** an allowlisted `platform_user_id` in `KIDYCODE_ADMIN_USER_IDS`, **and**
a valid HMAC (`x-kidycode-identity-signature` over `id\nemail\nissued-at`, 300 s skew,
constant-time compare). An unsigned header, a learner cookie, a guardian identity, an
`organisation_admin` row, a query parameter and `platform-headers` mode all fail closed.

### Synthetic review mode (demonstration only)

Because no signing edge and no owner account exist yet, a second path is available for
demonstration. It needs **three** independent things: `KIDYCODE_ADMIN_REVIEW_DEMO=1`, a
`KIDYCODE_ADMIN_REVIEW_KEY` of ≥16 characters held by the deployment, and the request presenting
that key in `x-kidycode-review-demo` (constant-time compared). It is **refused the moment a real
signing secret is configured**, and every response it produces is stamped
`provenance: "synthetic"` and shown behind a banner. The old well-known value from the first
draft of this work was removed: a test asserts it no longer opens anything and that no review
key is hard-coded anywhere in the source.

The browser receives the key once as `?review=<key>` and immediately strips it from the address
bar into `sessionStorage`; it is never rendered.

## 5. Verification (all run on this checkout)

```
npm run check   PASS   tsc + 20 existing validators + 4 new admin suites (84 checks)
npm run lint    PASS   0 errors, 0 warnings
npm run build   PASS   Worker bundle, assets, Sites metadata, all migrations
node tests/admin/security.test.mjs         33 checks
node tests/admin/curriculum.test.mjs       14 checks
node tests/admin/quality-and-safety.test.mjs 26 checks
node tests/admin/analytics.test.mjs        11 checks
node scripts/admin-qa.mjs                  36 browser checks, 11 screenshots
```

### Denial evidence (live HTTP, two deployments)

Against a deployment with **no** owner configuration (port 3001) and one with synthetic review
only (port 3003), all of these returned **403**:

| Probe | Result |
| --- | --- |
| `GET /api/admin/{curriculum,lesson,analytics,notifications}` unauthenticated | 403 |
| `POST /api/admin/notifications` unauthenticated | 403 |
| Forged `oai-authenticated-user-id` + `oai-authenticated-user-email` (unsigned) | 403 |
| Forged `x-kidycode-identity-signature` with no secret configured | 403 |
| Learner session cookie `kidycode_session=…` | 403 |
| Learner headers `x-kidycode-learner` + `x-kidycode-key` | 403 |
| Guardian identity headers | 403 |
| Review header with the deployment flag off | 403 |
| Wrong review key, correct length | 403 |
| `GET /admin` (page shell) | 200, but renders the closed state and no data; `noindex` |

### Browser QA (36/36)

Closed state · key opens the console and cleans the URL · 8 pathways incl. design · filters and
search · lesson with notes/example/hints/rubric/answer key · correct answer marked · review
status + note controls labelled · flags labelled as suggestions · OWNER PREVIEW banner · answer
key hidden until asked, then 10/10 answers on the gated final assessment · forward/back ·
analytics source tables · suppression · four "not tracked yet" entries · no fabricated retention ·
no-send promise · dry-run refuses live delivery · trust-boundary state · checklist · **no
horizontal overflow at 320 / 768 / 1440 px** · every interactive control has an accessible name
(6 927 AX nodes) · `navigation`/`main`/`heading` landmarks · working skip link · visible 3 px
focus ring on keyboard navigation.

One real layout bug was found and fixed by this QA: a stretched CSS grid row pushed the lesson
list ~1 000 px below its heading, so the list looked empty. `align-content: start` on the card
fixed it, and the QA now asserts the list starts above the fold.

Screenshots: `docs/v3/admin-qa/*.png` (11 images), machine-readable results in
`docs/v3/admin-qa/report.json`.

## 6. Blocked: no live review URL

**No preview URL is provided, and none was deployed.** The blocker is precise:

1. **No hosting path is configured in this environment.** The repository has no `wrangler.toml`,
   no Cloudflare account or API credential, and `.github/workflows/kidycode-v3-verify.yml` has a
   single verify job with no deploy step. Deploying would need an account I have no access to and
   an owner decision that has not been given.
2. **No trusted owner identity is provisioned.** `KIDYCODE_IDENTITY_SECRET` and
   `KIDYCODE_ADMIN_USER_IDS` exist nowhere in the repo or environment. A deployed console would
   therefore be *closed to the owner too*. The only way to open it without that identity is
   synthetic review, and putting a synthetic review key on a public URL is exactly the shortcut
   the brief forbids ("do not take a shortcut by making the admin console public just to supply
   a link").

### Minimum owner action to unblock a live link

Either:

- **(A) Real owner access (preferred).** Choose a deployment target on the existing KidyCode
  account, set `KIDYCODE_IDENTITY_TRUST=proxy-signature`, `KIDYCODE_IDENTITY_SECRET` (≥32 chars)
  and `KIDYCODE_ADMIN_USER_IDS=<your platform user id>` as deployment secrets, and confirm the
  edge signs forwarded identities with that secret. Then approve one staging deploy of
  `feat/admin-review-console`.

Or:

- **(B) Temporary keyed review.** Approve a single staging deploy with
  `KIDYCODE_ADMIN_REVIEW_DEMO=1` and a random `KIDYCODE_ADMIN_REVIEW_KEY`, and treat the link as
  a capability URL for the owner only. This makes no child data reachable — synthetic review
  only serves the built-in curriculum — but it is still an owner decision, not a default.

Until one of those is approved, the console can be reviewed locally:

```bash
# .dev.vars (git-ignored) with KIDYCODE_ADMIN_REVIEW_DEMO=1 and a random KIDYCODE_ADMIN_REVIEW_KEY
bash scripts/sites-env.sh -- node node_modules/vite/bin/vite.js --port 3003
# open: http://127.0.0.1:3003/admin?review=<the key>   → open once, the key leaves the address bar
```

## 7. Owner review checklist

1. Open the Curriculum Explorer; confirm all four age pathways **and** all four UI/UX design bands
   are listed.
2. Open one lesson per pathway; check notes, worked example, hints, rubric and answer key read
   correctly.
3. Open the final assessment of a pathway — it is learner-gated — and confirm you reached it
   without answering anything.
4. Use Preview as Learner; walk forward and back across a module boundary; confirm no submit or
   completion control exists.
5. Mark a lesson "issue found", add a note, and export the notes.
6. Open Friction & Retention; confirm the "not tracked yet" measures match what KidyCode does not
   record.
7. Draft one guardian message; confirm the plan refuses live delivery.
8. Decide on (A) or (B) above.

## 8. Known limitations

- Review notes are browser-local, not durable (see §1).
- Analytics are limited to what the schema records; no retention view can be drawn honestly.
- Design-band duplicate question prompts are reported, not resolved — that is a content decision.
- Coaching/preview of Code Lab and Design Studio activities is not included in this phase; the
  Practice Studio (PR #26) and its tests were not touched.
- WCAG 2.2 AA is the **evaluation target**; the automated checks above cover names, landmarks,
  focus visibility, contrast tokens and no-overflow, but this is not a certification.
- No institution-teacher or guardian-facing admin views were added; the console is owner-only.