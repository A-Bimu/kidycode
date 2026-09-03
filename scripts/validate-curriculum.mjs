import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const curriculumPath = path.join(root, 'learn', 'curriculum.js');
const source = fs.readFileSync(curriculumPath, 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(source, context);

const course = context.window.KIDYCODE_COURSE;
const errors = [];
const ids = new Set();

function check(condition, message) {
  if (!condition) errors.push(message);
}

check(course && course.id === 'code-explorers-10-12', 'Course ID is missing or incorrect.');
check(course.stages.length === 13, `Expected 13 stages, found ${course.stages.length}.`);

course.stages.forEach((stage, stageIndex) => {
  check(stage.number === stageIndex + 1, `Stage ${stage.id} is out of order.`);
  check(stage.lessons.length >= 8, `Stage ${stage.number} needs at least eight activities.`);
  check(Boolean(stage.outcome && stage.make && stage.badge), `Stage ${stage.number} is missing outcome, build or badge content.`);
  if (stage.number <= 12) check(stage.lessons.some((lesson) => lesson.kind === 'Boss project'), `Stage ${stage.number} needs a boss project.`);

  stage.lessons.forEach((lesson) => {
    check(!ids.has(lesson.id), `Duplicate lesson ID ${lesson.id}.`);
    ids.add(lesson.id);
    check(lesson.stageId === stage.id, `${lesson.id} has the wrong stage ID.`);
    check(lesson.time >= 5 && lesson.time <= 12, `${lesson.id} must take 5 to 12 minutes.`);
    check(Boolean(lesson.title && lesson.goal && lesson.task && lesson.concept && lesson.predict), `${lesson.id} is missing real lesson content.`);
    check(Array.isArray(lesson.hints) && lesson.hints.length === 3, `${lesson.id} must have exactly three hints.`);
    check(lesson.hints?.every((hint) => hint.length > 20), `${lesson.id} has an incomplete hint.`);
    check(Boolean(lesson.starter), `${lesson.id} needs a starter artifact.`);
  });
});

check(ids.size === 114, `Expected 114 activities, found ${ids.size}.`);
check(course.badges.length === 18, `Expected 18 badges, found ${course.badges.length}.`);

const textFiles = [];
function collect(directory) {
  for (const name of fs.readdirSync(directory)) {
    if (name === '.git') continue;
    const full = path.join(directory, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) collect(full);
    else if (/\.(html|css|js|md)$/.test(name)) textFiles.push(full);
  }
}
collect(root);

for (const file of textFiles) {
  const text = fs.readFileSync(file, 'utf8');
  check(!text.includes('—') && !text.includes('–'), `${path.relative(root, file)} contains an em or en dash.`);
  if (file.includes(`${path.sep}learn${path.sep}`)) check(!/\bgreen\b/i.test(text), `${path.relative(root, file)} contains a green colour instruction.`);
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log(`Validated ${course.stages.length} stages, ${ids.size} activities, 12 boss projects and ${course.badges.length} badges.`);
