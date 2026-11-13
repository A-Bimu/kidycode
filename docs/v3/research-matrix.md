# KidyCode V3 Phase 1 - Research matrix

Scope: `A-Bimu/kidycode` only. Source branch `plan/v3-hermes-learning-experience` at
`c560fede07357fd354e037dde1ae64e14f876bf3`. Phase 1 deliverable per `docs/v3/phase-plan.md`.

Verification date: 2026-10-26. Every URL below was requested and its HTTP status recorded.
Every licence claim below states where it was read. A licence that could not be read on the
publisher's own page is marked **UNVERIFIED** and is never treated as reusable.

How to read the licence column:

- **Verified** - read on the publisher's own licence or terms page, or on the publisher's own
  package metadata, at the URL given.
- **UNVERIFIED** - the publisher has not been shown to grant that permission at the URL given.
  Treat the material as all rights reserved until a licence is read.

## Summary matrix

| # | Source | Primary URL (checked) | HTTP | Content type | Publisher | Reuse licence (status) | Licence read at | KidyCode implication |
|---|--------|----------------------|------|--------------|-----------|------------------------|-----------------|----------------------|
| 1 | Code Club / Raspberry Pi projects | https://projects.raspberrypi.org/Raspberry/codeclub | 200 | Step-by-step web projects, HTML/CSS/JS | Raspberry Pi Foundation | CC BY-SA (attribution + share-alike) - **Verified** | https://www.raspberrypi.org/creative-commons/ | Study the sequence and the creative-output framing. Any reuse of actual text, code or artwork would force attribution and the same share-alike licence on our derivative. KidyCode content stays original. |
| 2 | Code.org CS Discoveries | https://code.org/en-US/curriculum/computer-science-discoveries | 200 | Full middle-school CS course, lesson plans, assessments | Code.org (now presented as CodeAI) | Curriculum CC BY-NC-SA 4.0 - **Verified**; videos CC BY-NC-ND 4.0 - **Verified**; software open source | https://code.org/en-US/about/code-org-free-curriculum-commitment and https://code.org/en-US/terms-of-service | Non-commercial only and no derivatives for the videos. **Do not reuse any Code.org material in a commercial product.** Study the educator-materials structure only. |
| 3 | freeCodeCamp curriculum | https://www.freecodecamp.org/learn/ | 200 | Interactive coding challenges and certifications | freeCodeCamp.org (501(c)(3)) | Curriculum content CC BY-SA 4.0 AND software BSD-3-Clause - **Verified via published package metadata** | https://registry.npmjs.org/@freecodecamp/curriculum/latest (`"license":"(BSD-3-Clause AND CC-BY-SA-4.0)"`) and https://github.com/freeCodeCamp/freeCodeCamp/blob/main/LICENSE.md (BSD 3-Clause) | Attribution plus share-alike for any reused curriculum text. Its graded-challenge feedback model is the useful idea; KidyCode writes its own tasks. |
| 4 | Scratch / Scratch Foundation | https://www.scratchfoundation.org/ | 200 | Block-based creative coding, community, remixing | Scratch Foundation | Editor source AGPLv3; support materials per-material (AGPLv3, CC BY-SA or other); **Scratch Materials and Scratch Team Marks are all rights reserved, personal/educational/non-commercial only** - **Verified** | https://mitscratch.freshdesk.com/en/support/solutions/articles/4000219182-scratch-terms-of-service (Last Updated 22 January 2026) | Study the creative-learning principles only. Do not copy Scratch artwork, the Scratch Cat, logos or names, and do not reproduce the Service. Confirms the brief's rule: do not replace typed code with block programming. |
| 5 | The Odin Project Foundations | https://www.theodinproject.com/paths/foundations/courses/foundations | 200 | Developer-workflow course for older teens and adults | The Odin Project | Curriculum CC BY-NC-SA 4.0, attribution to Erik Trautman - **Verified** | https://raw.githubusercontent.com/TheOdinProject/curriculum/main/license.md and https://www.theodinproject.com/terms_of_use | Non-commercial and share-alike. Reference for developer workflow and independent projects only; no text reuse. Its Terms reserve all trademark and intellectual-property rights. |

## Detail per source

### 1. Code Club / Raspberry Pi Foundation projects

- Pages checked: project index https://projects.raspberrypi.org/Raspberry/codeclub (200),
  technology index https://projects.raspberrypi.org/en/technology/web_development (200),
  a web pathway https://projects.raspberrypi.org/en/pathways/web-intro.
- Instructional technique observed on the live pages: every project is a short step-by-step
  build that ends in something the learner made themselves. The learning path is described as
  **321...Make!**: 3 Explore projects introduce the skills, 2 Design projects let the learner
  apply them with their own interests, 1 Invent project meets a brief, then a Make project.
  Each project ends in a quick quiz of short multiple-choice questions with feedback and a
  badge. A published learning graph shows progression, and a web editor (Raspberry Pi Editor /
  Trinket) lets the learner change real HTML and CSS.
- Strengths: creative outcome first, one skill per project, explicit progression, learner
  follows a plan rather than a wall of theory.
- Caveats: the editor and the account can sit outside KidyCode, its CSS is pre-built and only
  customised in the introduction path, and the quiz is a completion signal rather than proof of
  independent skill.
- Licence: Raspberry Pi Foundation states that its learning resources and documentation are
  released under CC BY-SA (attribution and share-alike), read at
  https://www.raspberrypi.org/creative-commons/ (page timestamp 2020-03-31). Share-alike means
  a derived work must carry the same licence; KidyCode therefore studies the sequence and
  writes all of its own copy, questions, examples and code.
- Explicit KidyCode implication: adopt "make something real, one skill at a time", the
  Explore/Design/Invent escalation and the end-of-project check. Reject the pre-built CSS and
  the block editor. Do not copy project text or images.

### 2. Code.org Computer Science Discoveries

- Page checked: https://code.org/en-US/curriculum/computer-science-discoveries (200).
- Instructional technique observed: a year-long course of 7 flexible units, each usable on its
  own. Each lesson ships with a lesson plan carrying learning objectives, assessment
  strategies, teacher implementation tips, differentiation ideas and extension activities.
  Tools include Web Lab (HTML/CSS), Game Lab, App Lab and AI Lab. Progress is tracked per
  learner with completion status and time spent.
- Strengths: the educator materials are the best-structured part - objectives, differentiation
  and extension are written separately from the learner activity.
- Caveats: the page now presents "AI Discoveries" as the replacement course for 2026-27 and
  describes CS Discoveries as remaining accessible rather than actively maintained. The URL
  still resolves (200) but the naming and the surrounding navigation have moved on.
- Licence: Code.org states free, openly licensed curriculum under CC BY-NC-SA 4.0 (read at
  https://code.org/en-US/about/code-org-free-curriculum-commitment). The Terms of Service add
  that curriculum and tutorial materials may only be used for non-commercial computer-science
  educational purposes, that videos are CC BY-NC-ND 4.0, and that the software is open source.
- Explicit KidyCode implication: NC plus ND means **zero material reuse** in a product that is
  not clearly non-commercial. Take the idea of separating objectives, differentiation and
  extension from the learner step, which the phase-plan's instructional principles already
  encode.

### 3. freeCodeCamp

- Page checked: https://www.freecodecamp.org/learn/ (200). Current certification pathways listed
  there include Responsive Web Design v9, JavaScript v9 and Full-Stack Developer v9, plus a
  daily coding challenge.
- Instructional technique observed: one small challenge at a time, each with an instruction, a
  starter editor and an automatic test that must pass before progressing; certification is the
  accumulation of many small verified tasks plus independent projects.
- Strengths: the tightest build, run, check loop of the five; immediate, local feedback; the
  learner always edits real typed code.
- Caveats: aimed at self-directed older learners; almost no explicit age or difficulty
  scaffolding; assistance is mostly test pass/fail rather than explanatory.
- Licence: verified through the publisher's own published package metadata rather than the
  repository README. `@freecodecamp/curriculum` on npm declares
  `"license":"(BSD-3-Clause AND CC-BY-SA-4.0)"` (read at
  https://registry.npmjs.org/@freecodecamp/curriculum/latest), and the repository `LICENSE.md` is
  BSD 3-Clause (read at https://raw.githubusercontent.com/freeCodeCamp/freeCodeCamp/main/LICENSE.md).
  Note for the record: the current repository `README.md` licence section names BSD-3-Clause for
  the software and then leaves the curriculum bullet truncated at "copyright (c) 2014
  freeCodeCamp.org" without naming a licence, so the README alone is **UNVERIFIED**; the package
  metadata is the verified source.
- Explicit KidyCode implication: keep the edit, run, auto-check loop, which KidyCode already
  has in `Lesson.tests` and the three-step lesson. Add explanatory feedback, which the source
  does not provide, and keep the age scaffolding, which it also does not provide.

### 4. Scratch / Scratch Foundation

- Pages checked: https://www.scratchfoundation.org/ (200) and the Terms of Service at
  https://mitscratch.freshdesk.com/en/support/solutions/articles/4000219182-scratch-terms-of-service
  (read live; Last Updated 22 January 2026). The legacy https://scratch.mit.edu/terms_of_use
  path returns 404 and now redirects readers to the hosted Terms.
- Instructional technique observed: creative learning through projects with personal meaning,
  peers and shared work, and play and experimentation; learners remix existing projects.
- Strengths: the strongest articulation of intrinsic motivation of the five.
- Caveats: block-based, and the Terms explicitly restrict the Service and the Scratch Materials
  to personal, educational, non-commercial use, forbid reproducing or creating derivative works
  of the Service, and reserve the Scratch Team Marks including the Scratch Cat and the logo.
  Support materials are licensed per material (AGPLv3, CC BY-SA, or other) as indicated by
  Scratch, so no single blanket licence applies.
- Explicit KidyCode implication: take the motivation principles (learner's own subject, peers,
  experimentation) and the brief's instruction not to swap typed code for blocks. Take no
  artwork, no name, no logo, no copied project content.

### 5. The Odin Project

- Pages checked: https://www.theodinproject.com/paths/foundations/courses/foundations (200) and
  https://www.theodinproject.com/terms_of_use.
- Instructional technique observed: for older teens and adults. Foundations moves from how the
  web works, installations, command line and Git, through HTML and CSS foundations, Flexbox, and
  JavaScript basics (including problem solving, understanding errors, clean code, loops and
  arrays, DOM manipulation and events), each strand ending in a project of increasing size
  (Recipes, Landing Page, Rock Paper Scissors, Etch-a-Sketch, Calculator).
- Strengths: developer workflow is taught as a first-class skill, projects are open-ended and
  portfolio-worthy, and error reading is taught explicitly.
- Caveats: no age scaffolding, node/npm and Git assumed early, and completion depends on
  external resources rather than a built-in check.
- Licence: the curriculum repository states CC BY-NC-SA 4.0 with attribution to Erik Trautman
  (read at https://raw.githubusercontent.com/TheOdinProject/curriculum/main/license.md). The
  Terms of Use also reference CC BY-NC-SA 4.0 and grant a personal, non-commercial licence only.
- Explicit KidyCode implication: use it as the model for the 16-18 and adult register - workflow,
  independent projects and error reading - with no text reuse, since NC excludes a commercial
  product and SA would otherwise force our derivative under the same licence.

## Reuse decision for KidyCode V3

1. No material from any of the five sources is copied into KidyCode. Two are non-commercial
   only (Code.org, The Odin Project), one is all rights reserved for its own materials
   (Scratch), and two are share-alike (Raspberry Pi Foundation, freeCodeCamp). Writing original
   text, illustrations, questions, examples and code avoids every obligation and is what the
   phase-plan already requires.
2. From Code Club, adopt: real made output, one skill per project, the Explore/Design/Invent
   escalation, an end-of-project check.
3. From Code.org, adopt: write learning objectives, differentiation and extension separately
   from the learner-facing step.
4. From freeCodeCamp, adopt: the tight edit, run, auto-check loop, with explanatory feedback
   added.
5. From Scratch, adopt: learner-chosen subject matter and experimentation, at the level of
   principle only.
6. From The Odin Project, adopt: workflow and independent project framing for the older
   registers.
7. If a future decision ever does reuse text from a share-alike source, it must carry attribution,
   a link to the original, a statement of changes, and the same licence on the derivative, and it
   must be recorded here first. The non-commercial and all-rights-reserved sources stay out of
   the product entirely.

## What was not verified

- No source's content was downloaded in bulk and no source was scraped. Only the public entry
  pages, licence pages and one package-metadata endpoint were read.
- Scratch's project-sharing licence for user-created projects was not read, because no Scratch
  material is being reused.
- Code.org's per-lesson asset licences beyond the site-wide statement were not read, because no
  Code.org material is being reused.
