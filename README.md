# KidyCode

KidyCode is a self-paced coding platform for learners aged 10 and above. It teaches real HTML, CSS and JavaScript through focused notes, worked examples, typed code, automatic checks, short assessments and one website that grows throughout each course.

## Complete learning paths

| Path | Course | Project outcome |
| --- | --- | --- |
| Ages 10 to 12 | Web Coding Foundations | Interest Guide, Club Website or Mini Magazine |
| Ages 13 to 15 | Practical Web Development | Personal Portfolio, Community Event Hub or Small Business Website |
| Ages 16 to 18 | Web Application Development | Revision Planner, Opportunity Directory or Service Dashboard |
| Adults | Web Skills for Work and Business | Professional Portfolio, Organisation Website or Service Business Website |

Every path contains eight modules and 48 activities in a consistent sequence:

1. Read clear notes and a worked example.
2. Type and run real code.
3. Use graduated hints only when needed.
4. Pass automatic code requirements.
5. Answer a quick knowledge check.
6. Save the next checkpoint of one continuous project.

Each course closes with a ten-question knowledge check and a practical code repair. Learners need both knowledge and working code to pass.

## Product routes

- Marketing site: `/`
- Ages 10 to 12: `/learn`
- Ages 13 to 15: `/learn/13-15`
- Ages 16 to 18: `/learn/16-18`
- Adults: `/learn/adults`

The interface is designed for phones, tablets and laptops. Draft work, completed activities, project checkpoints and final attempts are stored in Cloudflare D1. The learner session uses an HttpOnly cookie.

## Technology

- Next.js App Router compiled for Cloudflare Workers with Vinext
- React and TypeScript
- Cloudflare D1 with Drizzle schema and versioned SQL migrations
- Server-side course gating, grading and project checkpoint verification
- Static marketing pages served with the application

## Local setup and checks

```bash
npm run install:ci
npm run check
npm run build
```

Run the supported Sites build from a configured environment with:

```bash
node /root/.codex/plugins/cache/openai-curated-remote/sites/0.1.65/scripts/build-site.mjs
```

## Privacy

KidyCode asks for a nickname, age group and project choice. It does not require a child’s full name, school, phone number or location. Public projects remind younger learners to use a nickname and remove identifying information before sharing.
