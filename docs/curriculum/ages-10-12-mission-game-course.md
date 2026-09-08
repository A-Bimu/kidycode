# KidyCode ages 10 to 12: complete course map

## Course promise

The learner builds one mission game from beginning to end. The theme may be wildlife, a museum or a space station, but the coding knowledge and assessment stay the same. By the final lesson, the learner can explain the project, show ten saved checkpoints and repair a small JavaScript bug independently.

The course is self-paced. A typical activity takes 8 to 30 minutes. The complete pathway takes about 20 to 24 focused hours. A child may stop after any completed activity or saved stage checkpoint and continue later.

## The stage route

Every stage uses seven focused activities.

1. Learn the stage ideas through four short teaching sections, worked examples and three understanding questions.
2. Complete Guided Build 1 and add the first stage feature.
3. Complete Guided Build 2 and extend the feature.
4. Complete Guided Build 3 and test the complete feature.
5. Meet four requirements in an independent project checkpoint.
6. Use one review page to revise every idea from the stage.
7. Pass a five-question quiz with at least four correct answers.

Theory, guided building, independent practice, review and assessment have separate interfaces. The learner sees local progress such as "Stage 1, activity 2 of 7" instead of a large course-wide activity count.

## Complete stage sequence

| Stage | Knowledge | Practical game feature | Evidence |
|---|---|---|---|
| 1. Plan the route | Algorithms, sequence, prediction and testing | A route from start to the first signal | Ordered commands and a short explanation |
| 2. Give the player control | Events, input and edge cases | Four-direction keyboard and button controls | A silent control playtest |
| 3. Use repetition well | Counted and continuous loops | Shorter route code and animated signals | Two loops with different jobs |
| 4. Collect and avoid | Coordinates, collision detection and feedback | Collectable items and fair hazards | Separate collision tests |
| 5. Remember the game state | Variables, starting values and updates | Score, lives, time and Reset | A consistent scoreboard test |
| 6. Make the game decide | Conditions, comparisons and states | Win, retry and clean restart | Boundary-value test record |
| 7. Build a second level | Decomposition, functions and reuse | A second map with one fair difficulty change | Full two-level test |
| 8. Read the JavaScript | Syntax, variables and functions | First text-code changes | A working JavaScript checkpoint |
| 9. Finish the experience | DOM events, feedback and accessibility | Visible status, retry button and comfort settings | First-time player test |
| 10. Test, improve and present | Debugging, evaluation, privacy and credit | Showcase-ready final game | Two playtests, one repaired bug and a safe project note |

## Assessment model

Each stage checks three kinds of evidence.

- Knowledge: the theory questions and stage quiz are correct.
- Skill: the guided builds and independent checkpoint pass their practical checks.
- Understanding: the learner explains one decision at the independent checkpoint.

An activity is not completed by opening the page or spending time on it. The required evidence for that activity must be present.

Each stage ends after both the project checkpoint and quiz are complete. KidyCode then records the current project version and the learner's explanation. This gives the learner and parent a visible history from the first route to the final build.

## Final check

The final check is deliberately short and calm. It contains ten multiple-choice questions covering algorithms, loops, variables, conditions, functions, debugging, playtesting, accessibility and privacy. The learner then repairs a reset function so score returns to 0 and lives return to 3.

A pass requires at least 7 correct knowledge answers and a working practical repair. If the learner does not pass, the result shows which concepts to review and allows another attempt.

## Complete content source

The exact notes, examples, questions, answers, explanations, workshop steps, block choices, solutions, JavaScript starters, checkpoint requirements, reviews, quizzes, hints and reflections for all 70 activities are stored as structured content in `lib/course.ts`. The interface reads directly from this source so the written curriculum and the learner experience cannot quietly drift apart.

## Safety and privacy

The profile uses a nickname. The interface tells the learner not to enter a full name, school or location. The project is private by default. Public sharing requires grown-up approval. No open chat or unrestricted code execution is included in this first pathway.
