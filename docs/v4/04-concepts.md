# KidyCode V4 — the four concepts (Phase 2)

Four learner experiences, deliberately not one interface with four course titles. Each concept is drawn at 1440 px and
at 390 px; the rendered sheets are the review artefacts:

| Concept | Desktop | Mobile |
| --- | --- | --- |
| A · Ages 10–12 — Playful Discovery | `concepts/A-ages-10-12-desktop.png` | `concepts/A-ages-10-12-mobile.png` |
| B · Ages 13–15 — Creative Exploration | `concepts/B-ages-13-15-desktop.png` | `concepts/B..D mobile` (below) |
| C · Ages 16–18 — Developer Studio | `concepts/C-ages-16-18-desktop.png` | `concepts/BCD-mobile.png` |
| D · Adults — Professional Learning | `concepts/D-adults-desktop.png` | `concepts/BCD-mobile.png` |
| Colour system + admin gold | `concepts/colour-system.png` | — |

Every number, lesson title, unit name, project name and pass mark in the sheets comes from the real course data or from
the real seeded learner session used in the audit. Nothing is invented to make a screen look busy.

---

## A · Ages 10–12 — Playful Discovery

**Personality:** a creative playground with a trail. Rounded (22 px), buoyant, dark ink on white, four bright accents
used as fills, gold stars for real work. Baloo 2 headings over Nunito Sans.

**Surface map:** the dashboard is a *path* surface (one next step, the trail visible, no numbers to interpret); the
lesson is a *learn* surface (one idea per screen); practice is an *operate* surface; progress is a *monument-free*
monitor — islands and a shelf, no charts.

**What changes from today**

| Today | V4 |
| --- | --- |
| Cream page (`#F7F3EA`) with amber callouts | White and icy blue, brand blue primary, accents as fills |
| Sidebar listing 8 modules + 2 groups, always open | A trail of the next four steps; the whole map lives on the progress screen |
| `MODULE 1 · LESSON 4 OF 6` and `8 of 62 checks passed` in the bar | Dot progress `step 1 of 3`, and a plain "8 of 48 activities" on the dashboard |
| Six-step journey rail | Three dots: Notes → Practice → Quick check |
| Six labelled content cards | A metaphor illustration, one idea, worst-case three short steps, vocabulary last |
| Guidance-mode radio group ("how much support") | A single "Need a hint? (1 of 3)" button |
| Requirements rendered as pass/fail rows | Friendly checks that read as sentences ("Three items in your list") |

**Not changed:** the six pedagogical moments still drive the lesson (they are re-banded, not removed), assessment gating,
the seeded-learner identity, no write path from the owner preview, and every safeguard on the profile form.

---

## B · Ages 13–15 — Creative Exploration

**Personality:** a studio. Violet-led, 14 px radii, hairlines, flat panels, no confetti. Poppins over Inter Tight.
Milestone copy says "mission", not "lesson".

**What is genuinely different from A, not just recoloured**

- **Framing:** work arrives as a *mission* with a brief, constraints and an estimate, not a lesson with steps.
- **Choice:** the learner picks the project (Community Event Hub / Personal Portfolio / Small Business Website) and
  **picks an accent colour that is a real CSS variable in their own files** — personalisation that teaches custom
  properties rather than decorating the shell.
- **Failure is content:** the practice screen shows a failing test *and* a console with real output. The unit screen
  tracks versions (`v1 … v4`), because a 14-year-old will compare their own versions.
- **No childish reward loop:** progress is a portfolio of versions and a skill toolkit, not stars.

**Surface map:** dashboard = *operate* (mission board + project switcher); lesson = *learn* with a runnable demo;
practice = *command/inspect*; progress = *explore* over their own portfolio.

---

## C · Ages 16–18 — Developer Studio

**Personality:** the workstation they will meet in a first job. Midnight navy surfaces, hairlines, Space Grotesk over
Inter Tight, JetBrains Mono for everything code. 10 px radii, no rounded playfulness.

**What is genuinely different**

- **Honest difficulty labelling.** The lesson states "This one is genuinely fiddly. Most people get it wrong the first
  time by mutating the array in place." — borrowed from the research finding that telling learners a task is hard
  increases persistence rather than scaring them off.
- **A real toolchain shape.** File tree, editor, terminal output with a failing assertion, live preview, and three
  checks — the same screen a junior developer uses, at a scale they can hold.
- **Mastery, not points.** The skill matrix shows four levels earned by *passing the checks for that skill*, and states
  that nothing can be ground out with time.
- **Portfolio gap made explicit:** five portfolio requirements with the unit that satisfies each.

**Surface map:** dashboard = *monitor/operate*; lesson = *learn* (concept → lab → proof); practice = *command/inspect*;
progress = *monitor* with a capability ledger.

---

## D · Adults — Professional Learning

**Personality:** calm, uncluttered, respectful. White, cool grey-blue, one deep blue, sky for accents; IBM Plex Serif
headings over IBM Plex Sans. 8–12 px radii, near-flat, almost no colour decoration.

**What is genuinely different**

- **Objectives in plain language**, listed as capabilities ("Publish a working web page", "Handle real user input"),
  each with the unit that delivers it — the thing an adult actually wants to know before starting.
- **A plan that bends:** 15 minutes evenings / 45 minutes three days a week / 2 hours weekends, which reorders the path.
- **No invented metrics.** The dashboard shows activities completed and units finished, and says outright that KidyCode
  does not record sign-ins, daily activity or time-on-task — matching the real analytics contract rather than inventing
  a "hours learned" number.
- **Progress as a record, not a game:** a plain table of units and statuses, plus "You can now / Next you will be able
  to", plus the real assessment shape (10 questions + one practical repair, pass mark 7).

**Surface map:** dashboard = *decide/learn* at the top, *operate* below; lesson = *learn* with a narrow measure;
practice = *operate*; progress = *monitor* as a document.

---

## How the difficult concepts are taught

The audit's core complaint is not the curriculum but the ordering. V4 applies one sequence to every hard concept, and
keeps the full technical definition — it just arrives last:

**relatable idea → picture → run it → make it work → small challenge → hints on request → plain-language error → the technical name**

| Concept | Real lesson | The move V4 makes |
| --- | --- | --- |
| **HTML structure** | "Create an HTML element" | Open with "your page is a stack of boxes", show one box drawn next to its tag, then let them type the tag and watch the preview fill. The word *element* appears after they have made one. |
| **HTML lists** | "Build a useful list" | The illustration on the lesson sheet: a shopping list beside `<ul><li>`. Terms (*unordered list*, *list item*) moved to the step that unlocks after practice. |
| **CSS** | "Style with CSS" | Before/after toggle on a real element, then "name it once" (custom properties). The rules arrive one property at a time with the preview changing live. |
| **Flexbox** | "Arrange a row with Flexbox" | Start with the outcome ("put these three cards in a row that survives a narrow screen"), give draggable `justify-content` / `gap` controls, then introduce `display: flex`. |
| **CSS Grid** | "Responsive layouts" | Compare a real 360 px render against a 1440 px render, and only then name `grid-template-columns`. |
| **JS variables** | "Store a group in an array" / "Store a collection" | Lead with "the page should work out the total, not you" — the variable is the answer to a problem the learner has just felt. |
| **Functions** | "Organise code with a function" / "Write a focused function" | Show the same three lines repeated, ask what is annoying about it, then extract one function and watch both call sites shrink. |
| **Arrays** | "Store a collection in an array" / "Add a record without mutating the array" | Cards in a tray, with add / change / remove demonstrated before `map`, `filter` or immutability are named. |
| **Loops** | "Loops" / "Create elements with a loop" | Do one item by hand three times, then show the loop collapsing it — the motivation is felt before the syntax. |
| **DOM** | "DOM, forms and browser storage" | The console and the preview sit side by side so the learner sees *which* object they are changing; the acronym is unpacked after the first successful change. |

**Progressive disclosure rules used throughout**

- One decision per screen on mobile; at most three bands on desktop.
- A hint is a single button that reveals *one* step, and states how many remain (`Hint 1/3`).
- Vocabulary chips appear only on the step where the term is first useful — never as a glossary ahead of the task.
- Errors read as observations ("expected 4 items, received undefined") plus one sentence on what to try.
- Nothing is removed from the curriculum: every definition, requirement and rubric in the source lessons is still
  reachable on the same screen, just after the moment it explains.

---

## What stays exactly as it is

The four course pathways and all curriculum content; the assessment engine, answer validation and pass marks; the tutor
and recall features; progress tracking and saved learner work; the Notes / Practice separation; guardian and institution
functionality; authentication and every security control; the admin console's approved structure. V4 changes presentation
and adds per-age layout, tokens and components — it does not change what is taught, what is graded, or what is stored.
