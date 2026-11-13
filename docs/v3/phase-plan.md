# KidyCode V3 — Evidence-led learning experience

Status: **approved execution brief, not a validated release.** Preserve V1/V2 learning contracts and keep security PR #3 separate. Never automatically deploy, migrate production, access real child data, spend without checks, or merge PRs.

## Research baseline (verified 2026-10-26)

1. Raspberry Pi Foundation Code Club: its projects use step-by-step instructions, short project paths, and creative learner outputs. It offers web projects and an editor for HTML/CSS/JS. https://projects.raspberrypi.org/Raspberry/codeclub
2. Code.org Computer Science Discoveries: creative web-building, problem-solving lessons, and educator materials such as learning objectives, assessments, differentiation and extension challenges. https://code.org/en-US/curriculum/computer-science-discoveries
3. freeCodeCamp: investigate official current HTML/CSS/JS project-based progression and feedback; document exact lesson URLs before recommending specific steps. https://www.freecodecamp.org/learn/
4. Scratch: investigate creative learning principles (projects, interests, experimentation); *do not replace typed code with block programming*. https://www.scratchfoundation.org/
5. The Odin Project: reference for older teens/adults only; developer workflow and independent projects. https://www.theodinproject.com/paths/foundations/courses/foundations

**Licensing:** Record source, content type, author/publisher, reuse licence and attribution for any reused material. Without a verified licence, study general teaching ideas and write completely original text, illustrations, questions, examples and code. Never scrape and repost lesson content or imitate copyrighted artwork or branding.

## Existing KidyCode baseline — confirmed in V2 source

- Four coding courses are consolidated in `lib/course-catalog.ts`, with bundles for `ages-10-12`, `ages-13-15`, `ages-16-18`, and `adults`.
- `lib/learning-experience.ts` derives the dashboard, catalogue, Notes Library and Practice Lab from the same underlying course bundles. Preserve this *single source of truth*.
- `app/dashboard/page.tsx` currently displays all four course dashboards with completion counts, links and requirements simultaneously, using demonstration data. Beginner learners need age-specific focus and a clear first action.
- `app/notes/page.tsx` groups actual explanations by module; `app/practice/page.tsx` lists tasks, checks and hints. Keep **Notes and Practice separate** and let lessons link to both.
- `app/page.tsx` exposes a fallback navigation with many links. This is not a beginner-friendly first-run experience.
- V2 PR #2 and security PR #3 are **unmerged**. Cohort-access permission concerns remain release blocking. The V3 learning experience must not widen auth or touch institution routes.

## Instructional principles for V3

1. Every lesson names one learnable concept and what a learner will *make*.
2. First show a concrete result/problem, then a minimal worked example. Avoid walls of introductory prose.
3. Let the learner predict or change **real typed HTML/CSS/JS** and see its effect. One task at a time.
4. Introduce terminology only when needed; explain why a line works in the Notes space.
5. Preserve independent Practice Lab, staged hints (nudge → locate → worked partial), and immediate helpful error feedback without disclosing complete solutions before independent attempts.
6. Each concept improves **one continuous learner-selected website project**. Optional independent transfer challenge uses a different scenario.
7. Prove understanding with a fresh, unprompted task and check actual behavior, not just clicks or completion.
8. Adaptive presentation per age: 10–12 guided, 13–15 creative, 16–18 developer-oriented, adult practical; user can override guidance level. Never skip essential mastery gates.
9. Always provide phone/tablet/desktop responsive layout, keyboard navigation, accessible labels and readable code; **no green** in the KidyCode palette.
10. Keep the number of controls on a beginner step low; no full editor + glossary + notes + navigation + preview simultaneously until the learner requests the advanced workspace.

## Deliverables and quality gates

### Phase 1 — research/audit (first, must pass before Phase 2)
- Create `docs/v3/research-matrix.md`: source URLs, instructional technique, strengths, caveats, reuse licence status and explicit KidyCode implication.
- Create `docs/v3/curriculum-audit.md`: read **all four course bundles** and score current topics/lessons for objectives, prerequisites, explanation clarity, code practice, helpful feedback, project continuity, accessibility, responsive fit; classify top ten difficult concepts by risk, with paths and evidence.
- Create `docs/v3/lesson-blueprint.md`: data model and interaction flow, a simple short lesson and a difficult concept, three age-specific variants plus adult; preserve course IDs and contracts.
- Create three original reference lesson scripts: HTML heading, CSS Flexbox, JavaScript loops; each includes conceptual model, common wrong answer, hints, independent challenge, evidence of mastery, and how the central website progresses.
- Report exactly what was examined and source links; do not call research or source licences verified if not checked.

### Phase 2 — implementation (only after Phase 1 artifacts pass review)
- Build an isolated reusable lesson presenter that can render the reference lessons in guided/balanced/independent modes; reuse the existing typed-code and submission infrastructure where possible.
- Connect notes to `/notes` and practice to `/practice` without turning either into an all-in-one wall of content.
- One clear learner-facing route to current lesson; no organisation/pilot admin controls on beginner pages.
- Age-specific writing, projects and example style without duplicating learning logic. Feature-flag the experiment if needed.
- Prefer tested content contracts and incremental batches over auto rewriting hundreds of lessons.
- No production deployment.

### Phase 3 — test/release-candidate (only after Phase 2 passes)
- Run `npm ci`, `npm run check`, `npm run lint`, `npm run build`, `npm run test:e2e`; mobile/tablet/desktop browser smoke checks if available.
- Add tests for explanation reveal, real-code result, hint ordering, wrong-answer recovery, saved progress, and independent transfer.
- Ensure existing V2 checks remain valid; never weaken assertions to conceal failures.
- Open **draft** PR with commit SHAs, test outputs, changed routes, known limitations, and remaining educator/pilot validation.
- Security PR #3 remains a separate release gate. No child pilot until authentication and institutional data isolation are independently verified.

## Budget & execution policy

The previous user allocation for KidyCode model usage was USD 20; this is **not a programmatic cap**. Do not repeatedly spawn paid tasks on crash. Record tokens/cost if accessible. The 72-hour plan is a target, not a promise or an unattended service guarantee. If a task needs >2 hours or fails its gate, record a precise blocker rather than silently proceeding.

## Status report format after each phase

**Currently doing** / **Completed (with commit and checks)** / **Blocked or unverified** / **Next step** / **Recommendation** / **User action (if any)**.
