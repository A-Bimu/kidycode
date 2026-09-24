/*
 * The release-time leak and capability audit, against the source and against the built
 * production bundle.
 *
 * Four claims are proved here, none of them by reading a route by hand:
 *
 *   1. The production client bundle carries no answer material. Every explanation the
 *      server holds is checked against every file the browser downloads: a learner who
 *      opens devtools before submitting still has no answer.
 *   2. Nothing in the product can watch a learner. No camera, no microphone, no
 *      recording, no device enumeration, no clipboard contents, no biometric or face
 *      detection, no speech recognition, no AI-content detector.
 *   3. The client bundle carries no session value, no access hash, no digest and no SQL.
 *   4. Every screen that shows a corrected answer does so from a response, never from a
 *      bundled bank: the correction path is the only place an explanation can travel.
 *
 * The bundle rules need a production build. When `dist/client` is absent the script says
 * so plainly and skips those checks rather than reporting a pass it did not run.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { assessmentContent } from "../lib/assessment/manifest.ts";
import { templatesFor } from "../lib/assessment/defence/index.ts";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

const passed = [];
const failed = [];
const skipped = [];
function check(name) {
  if (typeof name !== "string") throw new TypeError("check() only records. Use step() to run a body.");
  passed.push(name);
  console.log(`  ok   ${name}`);
}
function step(name, body) {
  try {
    body();
    check(name);
  } catch (error) {
    failed.push(`${name}: ${error.message}`);
    console.log(`  FAIL ${name}: ${String(error.message).split("\n")[0]}`);
  }
}
function skip(name, reason) {
  skipped.push(name);
  console.log(`  ..   ${name} (${reason})`);
}

function filesUnder(relative) {
  const full = resolve(root, relative);
  if (!existsSync(full)) return [];
  const out = [];
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const child = resolve(directory, entry.name);
      if (entry.isDirectory()) walk(child);
      else if (entry.isFile()) out.push({ path: child, size: statSync(child).size });
    }
  };
  walk(full);
  return out;
}

/* --------------------------------------------------- what the server holds ------ */

/* Every string that would tell a learner the answer before they submit: the explanation
 * attached to a knowledge item, the misconception notes that describe the wrong answer, and
 * the explanation a defence task is graded against. */
function serverOnlyStrings() {
  const strings = new Set();
  const add = (value) => {
    if (typeof value === "string" && value.length >= 24) strings.add(value);
  };
  for (const content of Object.values(assessmentContent)) {
    for (const form of [...content.moduleForms, ...content.finalForms]) {
      for (const item of form.knowledge) {
        add(item.explanation);
        for (const misconception of item.misconceptions ?? []) add(misconception);
      }
      /* The task brief and the requirement labels are shown to the learner, so they are not
       * answers. Only the explanations and the misconception notes are server-only. */
    }
    for (const template of templatesFor(content.courseId) ?? []) {
      for (const task of [template.explain, template.predict, template.change, template.escalatedPredict]) {
        add(task?.explanation);
      }
    }
  }
  return [...strings];
}

const serverStrings = serverOnlyStrings();

/* -------------------------------------------------- the client bundle scan ------ */

const clientFiles = filesUnder("dist/client").filter((file) => /\.(js|mjs|cjs|html|css|json)$/.test(file.path));
const clientBundle = clientFiles.filter((file) => /\.(js|mjs|cjs)$/.test(file.path));

step("the audit knows what the server considers an answer", () => {
  assert.ok(serverStrings.length >= 100, `expected the banks to hold a substantial answer set, found ${serverStrings.length} strings.`);
  console.log(`  ..   ${serverStrings.length} server-only explanation and misconception strings collected from the four courses`);
});

if (clientFiles.length === 0 || clientBundle.length === 0) {
  skip(
    "every production client bundle leak check",
    "no production bundle yet, run npm run build first",
  );
} else {
  step("the production client bundle is present and large enough to be the real thing", () => {
    const bytes = clientBundle.reduce((total, file) => total + file.size, 0);
    assert.ok(bytes > 100_000, `the client bundle is only ${bytes} bytes, which is not a production build.`);
    console.log(`  ..   ${clientBundle.length} client scripts, ${Math.round(bytes / 1024)} KiB, downloaded by the browser`);
  });

  step("no answer, explanation or misconception reaches the browser before submission", () => {
    const leaks = [];
    for (const file of clientFiles) {
      const text = readFileSync(file.path, "utf8");
      for (const needle of serverStrings) {
        if (text.includes(needle)) leaks.push(`${file.path.slice(root.length + 1)} carries an answer: "${needle.slice(0, 60)}"`);
      }
    }
    assert.deepEqual(leaks.slice(0, 5), [], `${leaks.length} answer strings are in the client bundle.`);
  });

  step("no camera, microphone, biometric, detector or clipboard-content capability exists", () => {
    /* Banned everywhere: anything that could observe a learner. `clipboardData` is handled
     * separately below, because React's own event system references it and the product's one
     * permitted read measures a paste length. */
    const banned = [
      "getUserMedia",
      "mediaDevices",
      "MediaRecorder",
      "enumerateDevices",
      "navigator.clipboard.read",
      "clipboard.readText",
      "readText(",
      "faceDetector",
      "SpeechRecognition",
      "webkitSpeechRecognition",
      "keystrokeLogger",
      "keylogger",
      "aiDetector",
      "ai-detector",
      "turnitin",
      "gptzero",
    ];
    const found = [];
    for (const file of clientFiles) {
      const text = readFileSync(file.path, "utf8");
      for (const needle of banned) if (text.includes(needle)) found.push(`${file.path.slice(root.length + 1)} contains ${needle}`);
    }
    assert.deepEqual(found.slice(0, 5), [], found.join("; "));
    /* The application chunk is the one that carries the product's own paste handler: it must
     * read a paste only to measure it, and must never keep what was pasted. */
    const applicationChunks = clientBundle.filter((file) => /LearningApp|AssessmentFlow/.test(file.path));
    assert.ok(applicationChunks.length > 0, "the assessment screen's own script must be in the client bundle.");
    for (const file of applicationChunks) {
      const text = readFileSync(file.path, "utf8");
      assert(!/clipboardData[\s\S]{0,80}(push|setItem|localStorage|sessionStorage|fetch\()/.test(text), `${file.path.slice(root.length + 1)} appears to keep or send pasted content.`);
    }
  });

  step("the client bundle carries no session value, access hash, digest or SQL", () => {
    const banned = ["access_hash", "accessHash", "code_digest", "codeDigest", "kidycode_session", "FROM learner_profiles", "INSERT INTO", "DELETE FROM"];
    const found = [];
    for (const file of clientFiles) {
      const text = readFileSync(file.path, "utf8");
      for (const needle of banned) if (text.includes(needle)) found.push(`${file.path.slice(root.length + 1)} contains ${needle}`);
    }
    assert.deepEqual(found.slice(0, 5), [], found.join("; "));
  });
} 

/* ------------------------------------------------------ the capability scan ---- */

step("the source of the running product cannot watch a learner", () => {
  const trees = ["app", "components", "lib", "worker", "db"];
  const banned = ["getUserMedia", "mediaDevices", "MediaRecorder", "enumerateDevices", "navigator.clipboard.read", "clipboard.readText", "readText(", "faceDetector", "SpeechRecognition", "webkitSpeechRecognition", "keylogger", "aiDetector", "turnitin", "gptzero"];
  const found = [];
  for (const tree of trees) {
    for (const file of filesUnder(tree)) {
      if (!/\.(ts|tsx|js|mjs)$/.test(file.path)) continue;
      const text = readFileSync(file.path, "utf8");
      for (const needle of banned) if (text.includes(needle)) found.push(`${file.path.slice(root.length + 1)} contains ${needle}`);
    }
  }
  assert.deepEqual(found, [], found.join("; "));
});

function sourceFiles() {
  const out = [];
  for (const tree of ["app", "components", "lib"]) {
    for (const file of filesUnder(tree)) {
      if (!/\.(ts|tsx)$/.test(file.path)) continue;
      out.push({ path: file.path.slice(root.length + 1), text: readFileSync(file.path, "utf8") });
    }
  }
  return out;
}

step("the clipboard is written only on request and never read", () => {
  /* A learner copying the transfer code they can already see is a convenience, not
   * observation. The rule is the direction of travel: the product may write on a click, and
   * must never read the clipboard. */
  const writers = sourceFiles().filter((file) => file.text.includes("navigator.clipboard.writeText"));
  assert.ok(writers.length >= 1, "a copy control must exist where a code has to be carried to another device.");
  for (const file of writers) {
    const index = file.text.indexOf("navigator.clipboard.writeText");
    const functions = [...file.text.slice(0, index).matchAll(/(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{/g)];
    const name = functions.length > 0 ? functions[functions.length - 1][1] : null;
    assert.ok(name, `${file.path} writes to the clipboard outside a named function.`);
    assert(new RegExp(`onClick=\\{[^}]*\\b${name}\\b`).test(file.text), `${file.path} writes to the clipboard without a click from the learner.`);
    assert(!/clipboard\.read|readText\(/.test(file.text), `${file.path} must never read the clipboard.`);
  }
  console.log(`  ..   ${writers.length} clipboard write, always behind a click, and no clipboard read anywhere`);
});

step("the one clipboard read in the product measures a paste length and keeps nothing", () => {
  /* Reading a paste is the only way to report the disclosed "largest paste characters"
   * signal. The rule is therefore not "no clipboardData anywhere" but "exactly one read, in
   * the paste handler, whose result is measured and immediately discarded": the text is never
   * stored in state, never sent and never rendered. */
  const readers = sourceFiles().filter((file) => file.text.includes("clipboardData"));
  assert.equal(readers.length, 1, `exactly one file may read the clipboard, found ${readers.map((file) => file.path).join(", ")}.`);
  const { path, text } = readers[0];
  const handler = /const onPaste = \(event: ClipboardEvent\) => \{([\s\S]*?)\n    \};/.exec(text);
  assert.ok(handler, `${path} must read a paste inside its own handler.`);
  const body = handler[1];
  const read = /const (\w+)\s*=\s*event\.clipboardData\?\.getData\("text"\)\s*\?\?\s*"";/.exec(body);
  assert.ok(read, `${path} must read the pasted text through the clipboard event and bind it to a local name.`);
  const name = read[1];
  /* The binding line is removed before the use count, because the MIME type it passes is the
   * word "text" and would otherwise be counted as a use of a variable called text. */
  const rest = body.replace(read[0], "");
  const uses = [...rest.matchAll(new RegExp(`\\b${name}\\b`, "g"))];
  assert.equal(uses.length, 1, `the pasted text may be measured once and used for nothing else, found ${uses.length} uses.`);
  assert(new RegExp(`\\b${name}\\.length\\b`).test(rest), "the paste length must be the only thing read from the pasted text.");
  assert(!/clipboardData/.test(rest), "no second clipboard read may exist.");
  assert(!/(localStorage|sessionStorage|indexedDB|fetch\()/.test(rest), "a paste may never be stored in the browser or sent from the paste handler.");
});

step("the paste and visibility signals are counts only, with no content", () => {
  const flow = read("components/AssessmentFlow.tsx");
  assert(flow.includes("signals.current.pasteEvents"), "the paste handler must count paste events.");
  assert(flow.includes("signals.current.visibilityChanges"), "the visibility handler must count hidden transitions.");
  const schema = read("app/api/assessment/signals/route.ts");
  assert(!/content|clipboard|text/.test(schema.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1 ")), "the signals route must accept no pasted content.");
  assert(/largestPasteChars/.test(schema), "the disclosed paste size is the only paste value the route accepts.");
});

/* --------------------------------------------- the correction path, not a bank - */

step("a correction can only come from a submitted response", () => {
  const api = read("lib/assessment/api.ts");
  assert(/correctionPayload/.test(api), "corrections must be built in one place.");
  const state = read("app/api/assessment/state/route.ts");
  assert(!/correctionPayload/.test(state), "an unfinished attempt must never receive corrections.");
  const flow = read("components/AssessmentFlow.tsx");
  assert(!/from "@\/lib\/assessment\/bank/.test(flow), "the learner screen must not import a bank.");
  for (const file of filesUnder("components")) {
    if (!file.path.endsWith(".tsx")) continue;
    const text = readFileSync(file.path, "utf8");
    assert(!/assessment\/bank/.test(text), `${file.path.slice(root.length + 1)} imports a bank into a browser component.`);
  }
});

step("the reference sheet is a syntax reference and holds no assessment answer", () => {
  const sheet = read("lib/assessment/reference-sheet.ts");
  assert(!/explanation/i.test(sheet), "the reference sheet must not carry item explanations.");
  assert(/html|css|javascript/i.test(sheet), "the reference sheet must be a real syntax reference.");
});

console.log(`\nrelease static audit: ${passed.length} checks passed, ${failed.length} failed, ${skipped.length} skipped`);
if (failed.length > 0) {
  for (const failure of failed) console.log(`  - ${failure}`);
  process.exitCode = 1;
}
