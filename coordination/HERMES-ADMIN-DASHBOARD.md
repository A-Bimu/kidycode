# HERMES EXECUTION BRIEF — KIDYCODE OWNER ADMIN CONSOLE
Priority: P0 — build and verify a usable owner dashboard BEFORE the next KidyCode UI/UX review.
Repository: A-Bimu/kidycode
Existing admin development branch to inspect first: feat/admin-review-console
Related: Practice Studio draft PR #26, security PRs #23/#24, issues #21/#25.
Owner's instruction: **Implement this through Hermes, not by manually posing as a student.** Do not deploy, merge to main, spend money, send real messages, or use real child data without explicit owner approval.

## Goal
Build a *real, secured admin dashboard* that allows the KidyCode owner to:
1. Inspect ALL age-group classes/pathways, modules, individual lessons, notes, examples, practice, quiz answers and explanations, project checkpoints and assessments without needing to pass learner gates, submit fake answers, or alter any learner's progress.
2. See real aggregate activity and cohort performance: number of authorized sign-ins (where reliably recorded), active learners, completed/abandoned modules, struggling topics, content quality/assessment issues, and week-to-week drop-off.
3. Review the curriculum quickly so UI/UX and content can be checked before supervised pilot testing.
4. Eventually communicate safely with students and guardians through configurable, opt-in, audited notifications, including progress summaries and gentle re-engagement.

## First step: inspect before coding
- Check actual repository branches, PRs, current deployed environment, schema, auth trust boundaries, guardian/institution roles, existing dashboards, coursework models, database queries, event records and release dependencies. Read AGENTS.md and project coordination documents if present.
- Existing feat/admin-review-console already contains at least lib/admin-security.ts, lib/admin-runtime.ts, lib/admin-curriculum.ts. Reuse/review these; do not duplicate or discard active work, and do not claim the full console is already built.
- Verify admin allowlist uses a trusted verified edge identity (and configured signed identity secret). Never grant platform-wide owner access based only on a client-side flag, email text, learner cookie, arbitrary header, dev override, or organization admin role.
- Check existing GitHub Issue #25 and staging auth security gates; keep admin work isolated.

## P0: Curriculum review console (ship as first reviewable draft PR)
- A secured /admin entry and navigable layout with overview and Curriculum Explorer.
- Pathway/class selection: 10–12, 13–15, 16–18, adults, plus UI/UX design; where classes mean actual institution cohorts, show those separately and only where real cohort records exist.
- Search and filter modules, substrands/concepts, lessons, practice questions, assessments, and status.
- One-click open ANY lesson even if it would be locked in learner mode; **admin-only read-only preview** must not create practice submissions, learner progress, grades, checkpoint completions or certificates.
- Show entire original content: objectives, notes, examples, starter code, expected outcomes, hint stages, rubric, answer key and explanations, grade or mastery expectations, and assessment item bank where authorized. Never leak answer keys to student-facing endpoints or public rendered HTML.
- Highlight missing notes, duplicate questions, broken references, weak explanations, lesson-to-practice gaps, contrast/accessibility issues, and estimated workload; where automatic quality flags are heuristic, label them as suggestions rather than facts.
- Show 'View as learner' for each age path as a **sandboxed read-only simulation** with forward/back navigation that can skip quiz gates for admin only. Prominent OWNER PREVIEW label, disabled grading/progress writes, no certificate creation, no accidentally switching identity into a real learner.
- Preview Code Lab and Design Studio activities in safe example/test mode. Preserve existing Code Lab tests and Practice Studio PR #26.
- Allow owner to attach internal review notes or mark 'reviewed / issue found / needs rewrite' for lessons; back this with secure storage or clearly label local-only when no approved durable storage exists. Do not quietly overwrite source content or publish drafts without a content-review workflow.
- Staging/synthetic fixture mode for owner demonstration while auth/database setup is unavailable; do not label it as real analytics or live student activity.

## P1: Student / cohort overview (only if permitted, real data)
- Overview: total enrolled learners, verified sign-ins (when captured), DAU/WAU and active sessions (defined), pathway/cohort counts, recent completion and retention percentages with actual date windows and denominators.
- Learner progress: age/pathway, active module, attempts, time since last learner action, completed activities, next activity, support requested, flagged assessment/content friction.
- Drill-down by module and skill: attempt distributions, failed requirements, hint usage, retry outcomes, error types, low engagement or drop-off (first lesson, second week, etc.).
- Retention cohort view week 0, week 1, week 2 etc. Must use properly collected event times, learner or anonymous IDs with privacy safeguards, and distinguish enrollment from login and an actual completed lesson.
- 'Trouble spots' and 'hot points': report aggregated interaction events such as 'hint opened', 'check failed', 'lesson reopened', 'button not found', 'abandoned step' where instrumentation exists. Do not introduce covert session replay, keylogging, password capture, precise mouse movement recording, or per-child click heatmaps. If a heatmap is desired, use consented aggregate event counts tied to UI element IDs and enforce minimum group sizes to prevent tracing individuals.
- Compare age-group journeys, show when numbers are too small to conclude. Suppress tiny cohorts and redact identifiers from public or third-party analytics.
- If sign-in histories or interaction telemetry have never been recorded, show 'not tracked yet' rather than fabricate old counts. Add privacy-first server-side instrumentation going forward only after consent/review approval, with a documented data dictionary and retention.

## P2: Notifications, parents, and re-engagement
- Admin-controlled notification center: preview, draft, approve, schedule, send, history, opt-out/audit.
- Parent/guardian weekly (or chosen cadence) progress summaries: started/completed lessons, achievements and next practice suggestion; based only on verified guardian-child links.
- Student reminders: non-shaming, configurable, age-safe; no unsolicited private-contacting minors. Default to guardians for underage accounts unless supported explicit authorization/consent permits child-directed messaging.
- Templates: unfinished lesson, new module available, missed week, achievement, guardian report, manual announcement.
- Permission separation: only authorized owner can broadcast; institution teachers can see only their assigned cohorts and should not send platform-wide notifications; guardians see only authorized linked children.
- Quiet hours, time zones, frequency caps, unsubscribes, bounce/error handling and test-send to sandbox accounts before live delivery.
- Never send real SMS/WhatsApp/email/push, use paid providers, or set up credentials without explicit owner approval.

## User experience & KidyCode visual style
- This is an OPERATIONS TOOL, not a student game: readable data-dense dashboard, low cognitive load, clear navigation, searchable content.
- Priorities: Admin Overview, Curriculum Explorer, Preview as Learner, Cohorts & Learners, Friction & Retention, Notification Center, Admin Settings/Audit.
- Colours: KidyCode warm off-white, navy, dark purple/lavender, restrained accents; NO green.
- Mobile/tablet/laptop responsive, keyboard accessible with correct names, focus order and ARIA; accessible charts and textual summaries; WCAG 2.2 AA as evaluation target (do not claim certification without testing).

## Critical privacy and security requirements
- Owner admin is not automatically a guardian, teacher or student; ensure strict role-based access by server, database and route. Deny by default.
- Protect all admin APIs and server page data; test unauthenticated, forged cookie/header, learner, linked guardian, instructor, institution-admin and platform-owner scenarios.
- Do not expose raw underage learners' personal details, sensitive notes, credentials or secrets in analytics exports, logs, test fixtures, browser bundle or client monitoring.
- No bypass in learner-facing routes: Admin skip is only a separate server-protected, read-only preview. Never issue actual achievement credentials or modify learner state.
- Build GDPR/Kenya Data Protection Act-aware design: data minimization, parental consent, audit trails, aggregation, retention, deletion requests, and permission checks. Legal compliance must be reviewed by a qualified advisor before real deployment.
- Source truth: no fake login counts, no fake retention claims, no actual child contact without permission.

## Implementation order and acceptance
1. **Inspect existing admin branch and repository**; write a compact inventory of reusable routes, models, gaps and auth dependencies.
2. Implement protected owner navigation and P0 curriculum explorer with all modules, all age pathways, safe answer-key review and admin-only read-only lesson preview.
3. Add lesson review status/notes and curriculum quality checks, with transparent storage semantics.
4. Implement P1 analytics on available genuine events; where tracking missing, instrument documented consented future events rather than invent history.
5. Implement P2 notification drafts/templates, guardian authorization, opt-in and test delivery; disable live sending unless approved.
6. Test with synthetic fixtures first: end-to-end browser navigation without quiz gate, empty state, unauthorized access, security tests, axe-like automated accessibility checks if feasible, keyboard-only and 320/768/1440 px browser QA, contrast, no page overflow.
7. Create draft PR for owner review (NOT a production merge); upload screenshots, test outputs and a plain-language admin review checklist.
8. Update this issue with tested links, decisions, limitations and anything genuinely blocked by hosting/verified identities/consent.
9. DO NOT delay P0 for the telemetry and notifications systems; make review usable first. Only claim 'done' for functionality actually implemented and passing tests.

## Definition of done for the requested *admin-before-UX-review* milestone
- Owner can inspect all relevant classes/pathways, modules, detailed notes, questions, correct answers, rubrics and practice with **zero student quiz submissions**.
- Read-only preview can navigate forward/back freely, without granting admin privileges to a real student or affecting progress.
- Unauthorized users cannot call admin APIs, even by guessing links or manipulating headers.
- P0 meets keyboard, basic accessibility and responsive QA; real review screenshots exist.
- Honest 'not yet tracked' states for analytics metrics without data.
- Draft PR linked, CI green; not publicly deployed until owner approves safe authentication/staging.

## Operating instructions for Hermes
Run this in Hermes's own authorized Windows/GitHub execution environment. Read repository rules and agent coordination first. Parallelize independent UI/curriculum/security tests if safe, but coordinate file ownership. Implement with code, tests and commits; do not merely create another list of ideas. Begin P0 immediately when connected. Clearly report whether Hermes runtime actually started and what verification has passed. No background-completion claims unless an actual supported scheduled agent workflow is active.

## UPDATED OWNER REQUEST — LIVE REVIEW LINK AND ACCURATE METRICS (Nov 13, 2026)
The owner explicitly asks Hermes to start and continue through the admin dashboard build, and to make it available at a LIVE REVIEW URL when verified. This authorizes preparing a **no-extra-cost, access-controlled staging/review deployment** using an existing suitable KidyCode hosting account and verified authentication, once safety gates pass. It is NOT authorization to merge production, purchase hosting, reveal child data, loosen authentication, skip safeguarding, or contact learners. Do not take a shortcut by making the admin console public just to supply a link.

**Required handoff in GitHub Issue #27**: exact tested preview URL; deployed git SHA / branch; working owner login and unauthorized/guardian/learner denial evidence; CI and browser test results; provenance of every displayed count; clear labels for missing telemetry ("not tracked yet" rather than estimated/fake); privacy safeguards; and a short owner review checklist. Announce "ready for owner review" only when the linked staging deployment is actually reachable by the authorized owner. Keep the issue updated during execution; if hosting or trusted owner identity is not configured, stop before exposing anything, document the precise blocker, and request the minimum owner action.

**Hermes kickoff path:** `hermes chat --query-file coordination/HERMES-ADMIN-DASHBOARD.md` from a local checkout of `feat/admin-review-console`. This file is a handoff, not proof the local Hermes process has started. Never claim it started unless Hermes or a trusted runner reports that fact.
