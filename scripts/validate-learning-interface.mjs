import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const routes = [
  ["app/learn/page.tsx", "course10to12"],
  ["app/learn/13-15/page.tsx", "course13to15"],
  ["app/learn/16-18/page.tsx", "course16to18"],
  ["app/learn/adults/page.tsx", "adultCourse"],
];

for (const [relativePath, bundleName] of routes) {
  const path = resolve(root, relativePath);
  assert(existsSync(path), `Missing learner route: ${relativePath}`);
  const source = readFileSync(path, "utf8");
  assert(source.includes(`course={${bundleName}}`), `${relativePath} must render ${bundleName}.`);
  assert(source.includes("export const metadata"), `${relativePath} needs useful browser metadata.`);
}

const learningApp = readFileSync(resolve(root, "components/LearningApp.tsx"), "utf8");
const examPanel = readFileSync(resolve(root, "components/ExamPanel.tsx"), "utf8");
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const interfaceSource = `${learningApp}\n${examPanel}`;

for (const requiredText of [
  'type LessonStep = "notes" | "practice" | "check"',
  ">Notes<",
  ">Practice<",
  "Quick check",
  "WORKED EXAMPLE",
  "WORDS TO KNOW",
  "Show hint",
  "Saving draft...",
  "code-shortcuts",
  "preview-runtime",
  "questionAnswer",
  "quizAnswers",
  "courseId: courseFacts.id",
  "CourseMismatch",
  /* The project area is the learner's portfolio now, in its own component. */
  "<PortfolioPage",
]) {
  assert(interfaceSource.includes(requiredText), `The learner interface is missing: ${requiredText}`);
}

assert(interfaceSource.includes('sandbox="allow-scripts"'), "Learner previews must use a restricted iframe sandbox.");
assert(read("components/PortfolioPage.tsx").includes('sandbox="allow-scripts"'), "The portfolio preview must use the same restricted sandbox.");
assert(!interfaceSource.includes("allow-same-origin"), "Learner previews must not receive same-origin access.");
assert(!interfaceSource.includes("—"), "The learner interface contains an em dash.");
assert(!/\bgreen\b/i.test(interfaceSource), "The learner interface contains the banned colour name.");

const lessonRegion = learningApp.slice(learningApp.indexOf("function CodingActivity"), learningApp.indexOf("function QuickCheck"));
assert(!lessonRegion.includes('<main className="lesson-screen'), "Lesson steps must not create nested main regions.");
/* The route map has one definition, shared by the learner app and the transfer
 * claim, so a learner who moves device lands back on their own course. */
const routeMap = read("lib/course-routes.ts");
assert.equal((routeMap.match(/"ages-10-12": "\/learn"/g) || []).length, 1, "The saved-course route map is incomplete.");
assert(routeMap.includes('"ages-13-15": "/learn/13-15"'), "The ages 13 to 15 saved-course route is missing.");
assert(routeMap.includes('"ages-16-18": "/learn/16-18"'), "The ages 16 to 18 saved-course route is missing.");
assert(routeMap.includes('adults: "/learn/adults"'), "The adult saved-course route is missing.");
assert(learningApp.includes("courseRoutes["), "The learner app must use the shared route map.");
assert(read("app/api/transfer/claim/route.ts").includes("courseRoute("), "The transfer claim must return the learner to their own course.");

console.log("Validated four learner routes, the three-step lesson interface, safe previews and the course-aware final check.");
