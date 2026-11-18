# KidyCode V4 — learner experience redesign · Phase 1 and Phase 2

**Status: design proposal. Nothing is implemented yet.** This branch contains the audit and the visual concepts only.
No learner route, component, stylesheet, assessment, progress path, admin surface or deployment has been changed.
Implementation starts only after the owner approves a direction (brief §2 and §10).

## Review this in five minutes

| Look at | File |
| --- | --- |
| What is wrong today, with measurements | `01-ui-audit.md` |
| What other learning products get right | `02-research.md` |
| Colours, tokens, contrast, admin gold | `03-colour-system.md` + `concepts/colour-system.png` |
| The four concepts and how hard ideas get taught | `04-concepts.md` |
| Plan, tests and risks | `05-implementation-plan.md` |

## The screens to look at

Desktop (1440 px), four screens each — dashboard, lesson, practice, progress:

- `concepts/A-ages-10-12-desktop.png` — playful discovery, trail, metaphor illustrations, stars for real work
- `concepts/B-ages-13-15-desktop.png` — studio, missions, project + accent personalisation, versions
- `concepts/C-ages-16-18-desktop.png` — dark workspace, file tree, terminal, honest difficulty, skill matrix
- `concepts/D-adults-desktop.png` — clean, objectives in plain language, a plan that bends, progress as a record

Mobile (390 px): `concepts/A-ages-10-12-mobile.png`, `concepts/BCD-mobile.png`
Colour system and the admin gold refinement: `concepts/colour-system.png`

Each sheet is also a self-contained HTML file next to its PNG, so a screen can be opened, resized and inspected
directly in a browser.

## Before and after evidence

`audit/` holds the current interface as measured and captured on this repository, from a running dev server with a real
seeded learner session:

- `audit/before-02-learn-10-12-1440.png` vs `audit/before-05-learn-adults-1440.png` — the four age experiences today
  render at **exactly the same height (1009 px)** with the same cream background: one interface, four course titles.
- `audit/before-09-lesson-10-12-1440.png` — a single lesson screen: **631 words, 73 interactive elements, 2,762 px**
  before practice, with a module sidebar, five nav items, three step tabs, a six-step rail, a guidance radio group and
  six labelled content cards all competing at once.
- `audit/before-10-lesson-10-12-390.png` — the same screen on a phone: **horizontal overflow**, 3,639 px tall.
- `audit/audit-report.json` — every measurement above, per page, as raw data.

## What the owner is being asked to approve

1. Four genuinely distinct experiences, as drawn — not one interface in four palettes.
2. The colour system in `03-colour-system.md` (all 56 contrast pairs verified; script included and re-runnable).
3. The lesson sequence change: relatable idea → picture → run it → make it → challenge → hints → plain-language error →
   the technical term. **No curriculum content, requirement or pass mark is removed.**
4. The plan and the risk list in `05-implementation-plan.md`.

## Reproduce the checks

```bash
node docs/v4/palette-contrast.mjs      # expects: 0 failing pair(s) of 56
```

## Honest limits of this phase

- These are design sheets, not a built interface. Nothing has been tested with a learner yet.
- The palettes are verified for contrast; they have not been checked against WCAG for every component state, which is a
  Phase 3 test (`05-implementation-plan.md`).
- Mobile layouts are drawn at 390 px. 320 and 360 px behaviour is specified but not yet rendered.
- The audit could not re-derive the original tester feedback: no session notes or recordings exist in the repository, so
  the brief's summary of it is taken as given.
- The design band (UI and UX Design, marked `demo` provenance in the curriculum) was not assessed.
- No deployment was made from this branch, and this branch is deliberately excluded from the Vercel admin preview's
  build step (which builds `feat/admin-review-console` only).
