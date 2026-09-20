# KidyCode curriculum map

## Product promise

KidyCode teaches real web coding in the browser. Learners read clear notes, study a complete example, type code, run it, repair mistakes, answer a quick check and apply the skill to one website that grows throughout the course.

The learning loop is deliberately consistent:

1. Notes explain one new idea and every unfamiliar symbol.
2. A worked example shows the smallest complete pattern.
3. Practice asks the learner to edit real HTML, CSS or JavaScript.
4. Automatic requirements identify which part works and which part still needs attention.
5. Three hints move from a small nudge to an explicit pattern.
6. A quick check asks the learner to explain or recognise the idea.
7. The module project applies several skills to the learner's chosen website.
8. A five-question module check decides whether the next module opens.

## Shared course structure

Every learning path contains eight modules. Each module contains four focused coding lessons, one project checkpoint and one five-question knowledge check. Each complete course therefore contains 48 activities, eight saved project versions, ten final questions and one practical repair.

| Module | Main capability | Project evidence |
| --- | --- | --- |
| 1 | Structure content with semantic HTML | A readable page outline |
| 2 | Create links, media and accessible forms | A useful visitor action |
| 3 | Build a consistent CSS visual system | Reusable page styling |
| 4 | Adapt layouts for phones, tablets and laptops | A responsive interface |
| 5 | Store values, write functions and make decisions | Visible programmed behaviour |
| 6 | Organise repeated information as data | Content rendered from structured values |
| 7 | Connect controls, validation, feedback and saved state | A complete interaction |
| 8 | Debug, test, improve access and prepare a release | A tested website the learner can explain |

## Ages 10 to 12

The first pathway teaches HTML, CSS and beginner JavaScript with shorter tasks and more explicit notes. New syntax is explained before it is used. Learners choose an Interest Guide, Club Website or Mini Magazine. The final website includes semantic content, responsive styling, a safe interaction and a creator note that avoids personal information.

## Ages 13 to 15

This pathway develops more independent web-development habits. Learners choose a Personal Portfolio, Community Event Hub or Small Business Website. They work with semantic structure, accessible forms, design systems, responsive layouts, functions, arrays, DOM rendering, form validation and local browser storage.

## Ages 16 to 18

This pathway prepares learners for further study and entry-level portfolio work. Learners choose a Revision Planner, Opportunity Directory or Service Dashboard. The course adds application state, stable data records, immutable updates, CRUD operations, asynchronous requests, loading and error states, safe rendering, accessibility audits and release documentation.

## Adults

The adult beginner path uses professional examples without assuming prior experience. Learners choose a Professional Portfolio, Organisation Website or Service Business Website. It covers the same web foundations as the 13 to 15 route, while the wording and project decisions focus on work, business and community use.

## Evidence and progression

An activity is complete only when the learner passes its code requirements and knowledge check. Project checkpoints also require a short explanation. A module opens only after the previous activities are complete. The final check opens after all 48 activities.

The final result combines knowledge and skill:

- At least 7 of 10 final knowledge questions must be correct.
- The practical repair must satisfy all required code checks.
- The learner must explain what was changed and why.

## Safety and privacy

The learner profile uses a nickname, age group and selected project. A child is not asked for a full name, school, phone number or location. Course examples teach safe public credits and use text-only rendering for untrusted values. Progress and project versions are tied to a private learner session.

## Source of truth

Structured course material lives in `lib/course.ts` and `lib/pathway-course.ts`. Course-specific project choices live in the three pathway modules beside them. Automated validation checks course size, activity order, notes, examples, hints, questions, glossary coverage, code-test syntax and final assessments before a production build can pass.
