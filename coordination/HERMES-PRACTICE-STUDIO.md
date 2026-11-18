# KIDYCODE — COMPLETE PRACTICE STUDIO DEVELOPMENT PROMPT

## YOUR ROLE

Act as a senior full-stack engineer, product designer, UI/UX specialist, learning experience designer, educational technology expert, accessibility specialist and QA engineer.

Your task is to **design, build, integrate and thoroughly test a fully functional KidyCode Practice Studio** inside our existing KidyCode platform.

Do not stop at planning, research, mockups or recommendations. Implement the actual features, write the code, integrate them into the existing learning system, run tests, correct problems and provide verifiable results.

**Repository:** `A-Bimu/kidycode`

**Existing development task:** GitHub Issue #25 — Unified Practice Studio.

## 1. UNDERSTAND THE EXISTING PLATFORM

Before making changes:

1. Inspect the complete KidyCode repository and its existing architecture.
2. Review the four coding pathways: ages 10–12, 13–15, 16–18 and adults.
3. Review the standalone UI/UX course and its six modules.
4. Examine the existing code editor, live preview, assignments, assessments, learner progress, project saving and authentication.
5. Identify functionality that can be reused, improved or extended.
6. Review the existing Practice Lab and determine how it should connect to the new studio.
7. Inspect open pull requests, active release branches and GitHub Issue #21 to prevent conflicts.

Do not unnecessarily rebuild functionality that already works.

Preserve the existing curriculum, learning progress, security boundaries and assessment behaviour.

## 2. BUILD ONE UNIFIED PRACTICE STUDIO

Create a central Practice Studio where every KidyCode learner can complete practical assignments without leaving the platform.

The studio must have three integrated workspaces.

### A. Code Lab

Reuse and improve KidyCode's existing HTML, CSS and JavaScript editor.

Learners must be able to:

- Write and edit code.
- See a live website preview.
- Complete lesson-specific coding challenges.
- Request hints when needed.
- Run automated checks and receive understandable feedback.
- Save their work and resume later.
- Review earlier attempts.
- Build complete projects.

Do not create a second unnecessary code editor.

### B. Design Studio — Our Own Mini Figma

Build a functional, simplified visual design editor within KidyCode.

Learners must be able to create real interfaces without writing code.

Provide:

**Canvas and layout**
- Mobile, tablet and desktop canvases.
- Customizable frames.
- Zoom and canvas movement.
- Drag-and-drop elements.
- Resize, move, duplicate and delete.
- Basic alignment and snapping.
- Undo and redo.

**Design tools**
- Text and editable typography.
- Basic geometric shapes.
- Images and illustrations.
- Icons and logos.
- Buttons and form elements.
- Cards and navigation elements.
- Background colours and gradients.
- Borders, corner radius and spacing.
- Element ordering and layers where appropriate.

**Prototyping**
- Multiple screens.
- Connect buttons to other screens.
- Preview clickable interactions.
- Create welcome, login, loading and onboarding flows.
- Return to the editor to make changes.

**Saving and export**
- Save drafts safely.
- Reopen and edit designs.
- Preserve project versions where practical.
- Export designs as images or suitable editable data.
- Prevent one learner from accessing another learner's work.

Use suitable open-source technologies where licensing permits. Avoid rebuilding complex canvas functionality unnecessarily.

The result must be a real working design editor, not a static mockup.

### C. Research and Project Workspace

Give learners a space to record the thinking behind their projects.

Include:

- Project briefs.
- User problems and goals.
- Research notes.
- User-flow planning.
- Design decisions.
- Usability testing observations.
- Project reflections.
- Revisions and improvements.
- Final project presentation.

Connect this workspace to the practical assignments in the UI/UX course.

## 3. SIMPLIFY THE STUDIO FOR AGES 10–12

This requirement is critical.

A beginner aged 10 must not encounter an overwhelming professional design application.

Use a simplified interface with:

- Clear everyday language.
- Large, recognizable controls.
- Minimal menus.
- A small selection of suitable tools.
- Ready-made starting templates.
- Guided instructions.
- Visible progress indicators.
- One clear task at a time.
- A simple undo option.
- Help and hints on request.
- No unnecessary technical terminology.

Initially hide advanced functionality such as complex layers, constraints, component variants, precise pixel positioning and sophisticated prototype settings.

Gradually introduce more tools as learners demonstrate understanding.

### First beginner projects

**Project 1: My First Logo**

Choose a shape or icon, add an app name and select colours.

**Project 2: My Welcome Screen**

Add the logo, a welcome message and a button.

**Project 3: My Loading Screen**

Create a simple loading indicator using the learner's logo.

**Project 4: My First Login Screen**

Create a login-screen mockup using pretend information. Do not ask children to enter or store real passwords.

For each project, provide instructions, a working editor, a preview, hints, a simple review checklist and saving.

## 4. ADAPT PRACTICE TO ALL FOUR AGE GROUPS

Use one underlying studio system, but tailor the interface, guidance and project difficulty.

### Ages 10–12 — Guided Beginner Mode

Focus on basic colours, shapes, alignment, typography, images, buttons and simple layouts.

The first complete project is a small branded mobile-app experience.

### Ages 13–15 — Intermediate Mode

Learners design a mobile application with a splash screen, login page and home screen.

Introduce wireframes, multiple screens, visual hierarchy, editable components and basic clickable prototyping.

### Ages 16–18 — Advanced Student Mode

Learners design a more complete product experience with onboarding, login, password recovery, dashboard and error states.

Introduce responsive layouts, design systems, user flows, usability testing and accessibility.

### Adults — Professional Beginner Mode

Offer a practical personal-portfolio project.

Include:

- Homepage.
- About section.
- Project gallery.
- Contact section.
- Responsive layouts.
- Typography and visual identity.
- Basic interactions.
- Final presentation.

Adults should have access to more capable tools, but still receive beginner-friendly explanations when needed.

Allow learners to progress to more advanced capabilities based on demonstrated skills, rather than age alone.

## 5. PROVIDE A COMPLETE BUILT-IN ASSET LIBRARY

Learners should not need another website to obtain the materials required for their exercises.

Create a curated asset library with:

- Images.
- Illustrations.
- Icons.
- Basic logo symbols.
- Shapes.
- Fonts.
- Colour palettes.
- Backgrounds.
- Mobile-app templates.
- Website templates.
- Buttons and form components.
- Ready-made layout examples.

Assets must be properly licensed for their intended use and suitable for children.

Make assets searchable or organized into simple categories.

For ages 10–12, show a small curated selection rather than an overwhelming library.

Avoid requiring third-party accounts.

Do not allow unrestricted uploads or sharing of children's personal photographs without appropriate privacy and guardian safeguards.

## 6. CONNECT EVERYTHING TO THE CURRICULUM

The Practice Studio must not function as a disconnected feature.

Integrate it directly into KidyCode's learning experience.

Every relevant lesson should follow this progression:

**Learn → See an example → Practise → Preview → Receive feedback → Improve → Save → Continue.**

For example:

A UI/UX lesson about typography should open a design activity where the learner can change heading size, font and spacing.

A lesson about buttons should allow the learner to add and design a button.

A wireframing lesson should open a suitable blank or partially completed canvas.

A CSS lesson should open the existing code workspace with the appropriate starter files.

Ensure the studio understands which lesson the learner came from and offers the correct activity.

Keep Notes separate from Practice.

Hints must be optional and should not automatically reveal answers.

## 7. BUILD A FUNCTIONAL PROJECT SYSTEM

Every learner should have a project workspace.

Include:

- My Projects.
- Start New Project.
- Continue Project.
- Rename Project.
- Edit Project.
- Duplicate Project.
- Save Draft.
- Preview Project.
- Export Project.
- Delete Project with confirmation.

Where secure account infrastructure is available, associate projects with the authenticated learner.

If server-side saving is not ready, implement clearly labelled device-local saving for prototypes and do not claim that cross-device synchronization is available.

Protect student privacy and project ownership.

## 8. DESIGN AND BRAND REQUIREMENTS

Use KidyCode's existing visual identity:

- Warm off-white backgrounds.
- Navy.
- Dark purple.
- Carefully selected lavender accents.
- Clear, readable typography.
- Consistent spacing.
- Subtle, purposeful animations.
- Responsive layouts.

**Do not use green.**

The platform should feel modern, polished and welcoming, not overly childish or generic.

Make age-specific adjustments without fragmenting KidyCode into unrelated visual products.

Use accessible contrast, properly labelled controls, visible keyboard focus and understandable error messages.

## 9. LEARNING FEEDBACK

Avoid grading visual designs through rigid pattern matching.

A learner's design should not fail simply because they selected a different acceptable colour, layout or arrangement.

Instead, assess reasonable learning criteria such as:

- Does the screen contain the required elements?
- Is the main action understandable?
- Is the text readable?
- Are important controls accessible?
- Is the layout logically organized?
- Can users navigate through the required screens?
- Can the learner explain their design choices?

Different valid solutions must be accepted.

Provide constructive, age-appropriate feedback, and let learners improve and resubmit their work.

## 10. TESTING AND QUALITY ASSURANCE

Do not consider the feature complete merely because it compiles.

Test the real user experience.

Verify:

- Creating a new design.
- Adding and editing elements.
- Dragging and resizing.
- Changing colours and typography.
- Undo and redo.
- Switching frames.
- Building multiple screens.
- Previewing interactions.
- Saving, reopening and editing.
- Exporting designs.
- Navigating from lessons into Practice Studio.
- Preserving progress.
- Preventing unauthorized access.
- Using the interface on laptop, tablet and mobile.
- Keyboard navigation and accessibility.
- Preventing unsafe code or content from escaping sandbox boundaries.

Test the simplified beginner workflow independently of advanced workflows.

Fix visible layout problems, overlapping text, unusable buttons and broken navigation before presenting the studio as complete.

Use synthetic data during development.

Do not initiate tests involving real children before hosting, privacy, authentication and guardian-consent requirements are satisfied.

## 11. DEVELOPMENT AND RELEASE RULES

Use the existing KidyCode GitHub repository and available automation.

Work on a dedicated Practice Studio development branch and draft pull request.

Do not mix unfinished studio features into the current authentication or production release branches.

Use small, verifiable implementation milestones, but continue executing approved work rather than stopping after each step to request permission.

After meaningful changes:

1. Commit the implementation.
2. Run relevant automated checks.
3. Investigate failures.
4. Correct the problems.
5. Record test evidence.
6. Update GitHub Issue #25.
7. Continue to the next implementation milestone.

Do not modify unrelated repositories such as ALIA or The Impossible Studio.

Do not merge to main, launch publicly, incur expenses, configure paid infrastructure or expose real learner information without explicit approval.

Use our existing GitHub Actions, ChatGPT automation and Hermes Agent when available.

Do not assume the local Windows Hermes agent is running when the laptop is off.

## 12. EXECUTION PRIORITIES

Build in this order:

**Phase 1 — Functional foundation**
- Shared Practice Studio entry point.
- Reuse existing Code Lab.
- Functional beginner Design Studio.
- Mobile canvas.
- Text, shapes, icons, images and buttons.
- Basic editing, preview and local saving.

**Phase 2 — Guided beginner projects**
- Logo.
- Welcome screen.
- Loading screen.
- Login-screen mockup.
- Lesson-specific instructions and hints.
- Beginner feedback.

**Phase 3 — Advanced functionality**
- Multiple screens.
- Clickable prototypes.
- Richer components.
- Tablet and desktop layouts.
- Intermediate and advanced UI/UX challenges.
- Adult portfolio project.

**Phase 4 — Full learning integration**
- Connect all relevant UI/UX lessons to practice.
- Connect existing coding exercises to Code Lab.
- Connect project work to learner progress.
- Implement secure saving and ownership once authentication infrastructure is ready.

**Phase 5 — Final QA and release preparation**
- Run all automated and browser tests.
- Correct design and usability problems.
- Review accessibility.
- Verify security.
- Prepare a working staging preview when approved hosting is available.
- Prepare the supervised learner pilot.

Parallelize independent tasks where safe, but do not skip necessary testing or security gates.

## 13. DEFINITION OF DONE

The Practice Studio is complete only when:

1. A beginner can open KidyCode and understand how to begin.
2. A 10-year-old can create a logo, welcome screen and simple login-screen mockup without external software.
3. Learners can genuinely edit elements on a canvas.
4. Designs can be saved, reopened and modified.
5. Older learners can create and preview multiple connected screens.
6. Adults can create a practical portfolio.
7. Coding learners can use the existing working editor.
8. Lessons launch the correct practice experience.
9. Learners receive understandable feedback.
10. Projects are protected by suitable authentication and ownership boundaries.
11. The available features pass automated and user-journey testing.
12. The studio works on supported device sizes.
13. The existing KidyCode learning system remains functional.
14. Changes are committed and documented with verifiable GitHub links.

## FINAL INSTRUCTION

**Execute the implementation. Do not merely describe what should be built.**

Prioritize a working, polished, beginner-friendly product over unnecessary complexity.

Do not create static designs pretending to be functional software.

Build real interactions, genuine editing, reliable saving, suitable learning feedback and coherent integration with the existing KidyCode platform.

Work continuously through the approved engineering tasks using the available tools and report verified achievements, outstanding blockers and the exact next steps.

Our goal is simple:

**Every KidyCode learner should be able to learn a skill, practise it, create something real, improve their work and proudly show what they have built—all within KidyCode.**