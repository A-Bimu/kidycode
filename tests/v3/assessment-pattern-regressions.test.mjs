import assert from "node:assert/strict";
import { courses } from "../../lib/course-catalog.ts";

// Regression coverage for false rejections reported in KidyCode V3 Phase 3.
// These are source-pattern checks, NOT proof of semantic runtime behaviour.
const lessonByTitle = (title) => {
  const lesson = courses["ages-13-15"].lessons.find((item) => item.title === title);
  assert(lesson, "Missing course lesson: " + title);
  return lesson;
};
const checkByLabel = (lesson, label) => {
  const check = lesson.tests.find((item) => item.label === label);
  assert(check, "Missing requirement: " + label);
  return (source) => new RegExp(check.pattern, "i").test(source);
};
const articles = checkByLabel(lessonByTitle("Project checkpoint: Structure"), "Has at least three articles");
const wrappedArticles = `
<main>
  <section><article><h2>First</h2></article></section>
  <p>Between cards</p>
  <article><h2>Second</h2></article>
  <div><article><h2>Third</h2></article></div>
</main>`;
assert(articles(wrappedArticles), "Three separated/nested articles must pass");
assert(articles("<article>First</article><article>Second</article><article>Third</article>"), "Three adjacent articles must pass");
assert(!articles("<article>First</article><article>Second</article>"), "Only two articles must fail");

const objectsLesson = lessonByTitle("Describe records with objects");
const title = checkByLabel(objectsLesson, "Uses title properties");
const category = checkByLabel(objectsLesson, "Uses category properties");
const validObjects = `
const resourceOne = {
  title: "HTML guide",
  category: "Web",
  minutes: 12,
};
const resourceTwo = {
  category: "Learning",
  minutes: 20,
  title: "CSS guide",
};`;
assert(title(validObjects), "Two separated title properties must pass");
assert(category(validObjects), "Two separated category properties must pass");
assert(!title("const one = { title: 'Only one' };"), "Only one title property must fail");
assert(!category("const one = { category: 'Only one' };"), "Only one category property must fail");

console.log("Assessment regression: 7 checks passed (3 articles, 4 objects).");
