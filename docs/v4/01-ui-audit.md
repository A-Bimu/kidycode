# KidyCode V4 — Phase 1 UI audit

**What this is.** A measured audit of the current learner-facing KidyCode interface, produced
against the V4 brief. Every claim below is either a file/line citation or a number measured from
the running application; the screenshots in `docs/v4/audit/` were captured from this repository
at commit `ba606a4` on a local dev server, with a real seeded learner session for the lesson
screens.

**How it was produced.** I ran the app (`vite` dev server, port 3001), seeded one real learner
through the real API (`scripts/e2e-browser-seed.mjs ages-10-12 3 SkyCoder`, no child data), and
captured eight pages with headless Chrome over CDP at 1440 and 390 px, recording page height,
word count, interactive-element count, navigation-link count, computed body background and
horizontal overflow. Raw measurements: `docs/v4/audit/audit-report.json`.

**What I could not verify.** There are no tester session recordings or interview notes in the
repository, so the tester feedback is taken as given by the brief rather than re-derived. I did
not complete a full course as a learner, and the UI and UX Design band is marked `demo`
provenance in the curriculum itself, so its content was not assessed.

---

## Where it stands

The learner app is a **single interface with four course labels**. The engineering underneath is
sound — real curriculum, real assessment gating, honest "not tracked yet" labelling, genuine
safeguarding copy — but the presentation is institutional, dense, and identical for an
11-year-old and a 40-year-old.

Headline measurement. The four age experiences are, as rendered, the same page:

| Page | Height | Words | Interactive elements | Body background |
| --- | --- | --- | --- | --- |
| `/learn` (ages 10–12) | 1009 px | 139 | 9 | `rgb(247,243,234)` |
| `/learn/13-15` | 1009 px | 151 | 9 | `rgb(247,243,234)` |
| `/learn/16-18` | 1009 px | 146 | 9 | `rgb(247,243,234)` |
| `/learn/adults` | 1009 px | 143 | 6 | `rgb(247,243,234)` |

Identical height to the pixel, near-identical word counts, one shared background. The
side-by-side screenshots `before-02-learn-10-12-1440.png` and `before-05-learn-adults-1440.png`
differ only in the course label, the project-choice copy, and an age selector that exists for
children. This is exactly the failure mode the brief names in §2.

---

## Findings

### F1 — One interface, four audiences · **critical** · all four bands

`app/globals.css:1-14` defines one token set used by every learner page. There is no per-age
token layer and no per-age component: `components/LearningApp.tsx` is a single 1,594-line client
component that branches on `courseId` internally, and `app/learn/13-15/page.tsx`,
`app/learn/16-18/page.tsx` and `app/learn/adults/page.tsx` each render that same component with a
different course object. Any age difference today is a conditional inside one file.

*Screenshots:* `before-02` vs `before-05`. *Brief:* §2, §10.

### F2 — The banned palette is the learner palette · **critical** · all four bands

`app/globals.css:1-14`:

```
--paper: #f7f3ea;      warm ivory — the page background of every learner screen
--paper-deep: #ece5d8; tan/beige
--white: #fffdf8;      warm off-white, not white
--amber: #ee9d2b;      muddy amber (the primary focus ring and button shadow)
--coral: #c84d42;
--line: #d6cdbc;       warm grey-tan borders
```

Measured `body` background on all eight captured pages: `rgb(247,243,234)`. Every colour the
brief lists under "Absolutely avoid" — cream, beige, nude, tan, warm ivory, muddy amber — is the
current learner theme. Green does not currently appear, and must not be introduced.

*Brief:* §3.

### F3 — The lesson screen is a wall of competing structure · **critical** · all four bands

Measured on the real seeded ages 10–12 learner at `/learn` (`before-09-lesson-10-12-1440.png`):
**631 words, 73 interactive elements, 2,762 px tall** before the learner reaches practice. On
that one screen a beginner simultaneously meets:

1. a module sidebar listing 8 modules plus two extra groups, each with its own progress fraction;
2. a top bar reading `MODULE 1 · LESSON 4 OF 6`, a course title, a progress bar and `8 of 62 checks passed`;
3. five top-level nav items (`Learn`, `My website`, `My progress`, `Module checks`, `Final check`);
4. three step tabs (`Notes` / `Practice` / `Quick check`);
5. a six-step journey rail (`See the problem`, `See the example`, `Build it`, `Check it`, `Prove it`, `Use it`) — `components/LessonJourney.tsx:33-36,47`;
6. a three-way "how much support do you want" radio group, each option carrying its own explanation — `components/LessonJourney.tsx:74`;
7. six or more stacked content cards, each with its own kicker label (`START HERE`, `FIRST, UNDERSTAND THE IDEA`, `WORKED EXAMPLE`, `WORDS TO KNOW`, …).

Each element is individually defensible. Together they ask a child to hold six systems in working
memory before writing one line of HTML — the exact cognitive-load failure NN/g warns about for
this age (see §research).

### F4 — Prose is doing the work that demonstration should do · **critical** · all four bands

The lesson body is a vertical stack of labelled paragraphs. On the seeded lesson the learner is
asked to read roughly 300 words of explanation *before* the first interactive moment, then a
further block after it. The worked example is a static code block; there is nothing to drag,
toggle, press or break. Duolingo's own published position — "the most effective learning comes
through experience, not a long list of instructions" — is the opposite of this ordering.

### F5 — Mobile is an afterthought and overflows · **high** · all four bands

At 390 × 844 px the lesson page measured **horizontal overflow = true**, 3,639 px tall, 543 words.
The dashboard and catalogue hold up better, but the two-pane lesson layout (sidebar + main) has no
mobile posture — it is the desktop layout reflowed. The brief asks for mobile first (§8); today
mobile is the narrowest rendering of a desktop page.

### F6 — The landing page is an essay · **high** · shared

`/` measured **11,377 px tall, 1,062 words, with horizontal overflow at 1440 px**. An 11-screen
scroll is not a first impression; the brief's target first impression ("WOW! This looks fun") is
currently delivered as a long text document with stat rows.

### F7 — There is no learner dashboard · **critical** · all four bands

`app/dashboard/page.tsx:13-20` calls `learnerDashboard(courseId, { completedLessons: new Map(),
savedModules: new Map(), exams: [] })` — progress is **empty by construction** — and the page
states plainly: *"Demonstration data: no learner work is saved on this screen."* It lists all four
courses at once as cards showing `Activities 0 / N` and `Project versions 0 / N`.

So the screens that answer "what have I achieved, what do I do next, how far have I come" do not
exist for a real learner. The brief's §6 is therefore not a redesign task but the construction of
a missing surface.

### F8 — Navigation is flat, equal-weight and partly not for learners · **high** · all four bands

`components/ExperienceNav.tsx:5-15` renders nine identical-weight links for every age:
`Dashboard`, `Courses`, `Notes Library`, `Practice Lab`, `Design Studio`, `UI and UX Design`,
`Build Outside`, `Curriculum map`, `Pilot workspace`. Measured on `/dashboard`: 10 nav links.
Two of these (`Curriculum map`, `Pilot workspace`) are an internal map and an institution/B2B
surface; presenting them to a child at the same weight as "keep learning" is organisational
leakage, and nine equal choices is the opposite of a clear next action.

### F9 — Formal, institutional typography and hard edges · **high** · all four bands

Georgia serif headings (`.onboarding-copy h1`, `.journey-card h2`, `.profile-mismatch h1` in
`app/globals.css`), zero border radius anywhere, 2–4 px hard offset shadows
(`box-shadow: 4px 4px 0 var(--amber)`), and a logo rotated 45°. The visual language of a legal
document or an exam paper. Nothing in it signals play, making, or "you can do this".

### F10 — Progress exists but is not shown where it motivates · **high** · all four bands

The data layer already computes progress (`lib/learning-experience.ts`, `learnerDashboard`,
`buildCompletionRecord`, milestones, passport). The learner never sees a personal progress view —
the counts on `/dashboard` are demo-zero, and the lesson shows `8 of 62 checks passed` as a thin
bar. The motivation surfaces the brief asks for (§6, §7) are missing, not the data.

### F11 — Technical terms arrive before meaning · **medium** · all four bands

The seeded lesson's "WORDS TO KNOW" glossary (unordered list / ordered list / list item) sits
*after* the explanation and the worked example, and each term is defined in terms of other
terms. The brief's §4 order — relatable explanation → visual → interactive → experiment →
challenge → hints → feedback — is currently explanation → explanation → example → glossary →
practice. Terminology is doing the early work that metaphor should do.

### F12 — Errors are reported, not taught · **medium** · all four bands

`components/LessonJourney.tsx:199-203` shows misconception help only after a failed check, and
requirement results are rendered as pass/fail rows
(`.journey-requirements li.is-pass` / `.is-fail`, `app/lesson-journey.css`). The mechanism is
right — help appears on demand, never before — but the presentation is a results table rather
than a friendly "here is what the browser saw, and here is the one thing to change".

---

## What is already good, and must be preserved

- **The curriculum is real and complete.** 4 coding pathways × 8 units × 6 activities, plus the
  design band; 248 lessons indexed by the admin console. Nothing here needs rewriting.
- **The pedagogical spine is sound.** The six moments (hook → model → build → check → explain →
  transfer) are a genuinely good lesson arc. The V4 job is to *present* them, not replace them.
- **Assessment gating is honest.** Pass marks, practical defence, transfer tasks, and no path that
  awards progress without meeting requirements. V4 must not touch this.
- **Progressive support already exists in principle** — the three guidance modes (Guided /
  Balanced / Independent) are the right idea, presented as a form control rather than a learning
  aid.
- **Safeguarding and privacy copy is strong** and often better than the visual design around it.
- **Honest labelling** ("Demonstration data", "not tracked yet", provenance stamps) is a product
  virtue worth preserving through the redesign.

---

## The gap, in one line

KidyCode currently tells a learner **what the system contains** (modules, checks, requirements,
glossary, provenance). It needs to show them **what they can make, in the next ten minutes**, and
then get out of the way.
