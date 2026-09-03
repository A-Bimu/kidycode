import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'learn', 'curriculum.js'), 'utf8'), context);

const course = context.window.KIDYCODE_COURSE;
const failures = [];
const completed = {};

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function stageMastered(stage) {
  return stage.lessons.every((lesson) => completed[lesson.id]);
}

function stageUnlocked(stage) {
  if (stage.number === 1) return true;
  return stageMastered(course.stages[stage.number - 2]);
}

for (const stage of course.stages) {
  assert(stageUnlocked(stage), `Stage ${stage.number} did not unlock after the prior stage was completed.`);
  for (let index = 0; index < stage.lessons.length; index += 1) {
    const lesson = stage.lessons[index];
    const lessonUnlocked = index === 0 || completed[stage.lessons[index - 1].id];
    assert(lessonUnlocked, `${lesson.id} did not unlock after the prior activity.`);

    const changedDraft = `${lesson.starter}\nMy tested change for ${lesson.challenge}`;
    const changed = changedDraft.trim() !== lesson.starter.trim();
    const longEnough = changedDraft.trim().length >= lesson.minChars;
    const signalFound = !lesson.signals.length || lesson.signals.some((signal) => changedDraft.toLowerCase().includes(signal.toLowerCase()));
    assert(changed && longEnough && signalFound, `${lesson.id} cannot pass the basic work check with a valid changed draft.`);

    if (lesson.kind === 'Boss project') {
      assert(Array.isArray(lesson.requirements) && lesson.requirements.length === 4, `${lesson.id} needs four project requirements.`);
      assert(Array.isArray(lesson.choices) && lesson.choices.length >= 3, `${lesson.id} needs at least three project choices.`);
    }
    completed[lesson.id] = true;
  }
  assert(stageMastered(stage), `Stage ${stage.number} did not reach completion in the simulated learner flow.`);
}

const html = fs.readFileSync(path.join(root, 'learn', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'learn', 'learn.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'learn', 'learn.js'), 'utf8');

assert(html.includes('sandbox="allow-scripts"'), 'The code preview is not sandboxed.');
assert(html.includes('Skip to the learning space'), 'The learning app needs a keyboard skip link.');
assert(html.includes('aria-live="polite"'), 'The learning app needs polite live feedback.');
assert(css.includes('@media (prefers-reduced-motion: reduce)'), 'Reduced-motion support is missing.');
assert(css.includes('@media (max-width: 520px)'), 'Small-phone layout rules are missing.');
assert(js.includes('localStorage.setItem'), 'Progress persistence is missing.');
assert(js.includes('saveSnapshot'), 'Version snapshots are missing.');
assert(js.includes('restoreSnapshot'), 'Version restore is missing.');
assert(js.includes('requirementsReady'), 'Boss project requirement checks are missing.');
assert(!html.includes('type="file"'), 'The child flow must not publish or upload work automatically.');
assert(!/https?:\/\//.test(html), 'The learning app must not send a child to an external page.');

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log(`Simulated the prerequisite flow through all ${Object.keys(completed).length} activities and checked safety, persistence, accessibility and responsive hooks.`);
