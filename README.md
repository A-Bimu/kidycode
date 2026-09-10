# KidyCode

KidyCode is a self-paced coding platform for young learners and adults. The first complete pathway is for ages 10 to 12.

## Ages 10 to 12 course

Learners choose one of three website ideas, then build it from the first HTML heading to a responsive, interactive final version. Coding begins in the first activity. Every lesson combines a concise explanation, a worked example, a real editor, a browser preview and automatic checks.

The course contains:

- 8 modules in prerequisite order
- 48 focused activities: 32 coding lessons, 8 project checkpoints and 8 quizzes
- HTML, CSS and JavaScript taught through typed code from lesson one
- an editor with separate HTML, CSS and JavaScript files plus a live browser preview
- automatic requirement checks, one quick practice question and three graduated hints in every coding lesson
- unfinished code saved automatically before the learner completes a lesson
- one growing website chosen from Interest Guide, Club Website or Mini Magazine
- 8 saved project checkpoints
- 10 final knowledge questions and one practical HTML and JavaScript repair
- progress saved in Cloudflare D1

Python is planned as a separate next course for ages 10 to 12. It is not mixed into Web Coding Foundations, so learners can first become confident building for the web.

All learning material lives in `lib/course.ts`. The main learning interface lives in `components/LearningApp.tsx`.

## Technology

- Next.js App Router compiled for Cloudflare Workers with Vinext
- TypeScript and React
- Cloudflare D1 for learner profiles, progress, project checkpoints and exam attempts
- Drizzle schema and versioned SQL migrations
- HttpOnly learner session cookie

The public landing page remains available at `/`. The complete course is at `/learn`.

## Local checks

```bash
bash scripts/sites-env.sh -- ./node_modules/.bin/tsc --noEmit
node scripts/validate-full-course.mjs
node /root/.codex/plugins/cache/openai-curated-remote/sites/0.1.56/scripts/build-site.mjs
```

## Privacy choices

The learner profile asks for a nickname, age and project choice. It does not ask for a full name, school or location. The browser receives an HttpOnly session cookie, while the learning record is stored in D1.
