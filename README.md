# KidyCode

KidyCode is a self-paced coding platform for young learners and adults. The first complete pathway is for ages 10 to 12.

## Ages 10 to 12 course

Learners choose one of three mission-game themes, then build the same project from its first route to a tested two-level game. The pathway begins with visual command blocks and moves into JavaScript after the learner already understands the ideas.

The course contains:

- 10 stages in prerequisite order
- 40 complete lessons
- notes, worked examples and one prediction question in every lesson
- a practical project change and three graduated hints in every lesson
- 10 saved project checkpoints
- 10 final knowledge questions and one practical JavaScript repair
- a guided lesson sequence that reveals one step at a time
- a working map game with controls, collection, hazards, score, lives, time, levels and retry states

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
node /root/.codex/plugins/cache/openai-curated-remote/sites/0.1.51/scripts/build-site.mjs
```

## Privacy choices

The learner profile asks for a nickname, age and project choice. It does not ask for a full name, school or location. The browser receives an HttpOnly session cookie, while the learning record is stored in D1.
