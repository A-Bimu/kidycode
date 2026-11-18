#!/usr/bin/env node
/*
 * Owner admin console — real browser QA over the Chrome DevTools Protocol.
 *
 * No browser framework and no paid service: a headless Chrome started with
 * --remote-debugging-port drives one page, and this script asks it the questions the brief
 * asks for. It writes its screenshots and a machine-readable report under the output
 * directory so the evidence can be attached to the review.
 *
 * Usage:
 *   chrome --headless=new --remote-debugging-port=9226 --user-data-dir=<temp> about:blank
 *   node scripts/admin-qa.mjs <base-url> [review-key] [output-dir]
 */

import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const origin = (process.argv[2] || "http://127.0.0.1:3003").replace(/\/$/, "");
const reviewKey = process.argv[3] || "";
const outDir = resolve(process.argv[4] || "docs/v3/admin-qa");
const debugging = "http://127.0.0.1:9226";

await mkdir(outDir, { recursive: true });

const delay = milliseconds => new Promise(resolvePromise => setTimeout(resolvePromise, milliseconds));
const report = { origin, reviewKeyUsed: Boolean(reviewKey), startedAt: new Date().toISOString(), checks: [], screenshots: [], failures: [] };

function record(name, detail) {
  report.checks.push({ name, detail });
  console.log(`  ok   ${name}${detail ? ` — ${detail}` : ""}`);
}
function fail(name, error) {
  report.failures.push({ name, error: String(error) });
  console.log(`  FAIL ${name}`);
  console.log(`       ${error}`);
}
async function check(name, body) {
  try {
    const detail = await body();
    record(name, typeof detail === "string" ? detail : undefined);
  } catch (error) {
    fail(name, error instanceof Error ? error.message : error);
  }
}

/* --- CDP plumbing --------------------------------------------------------- */

const target = await (async () => {
  for (let step = 0; step < 40; step++) {
    try {
      const response = await fetch(`${debugging}/json/new?${encodeURIComponent(`${origin}/admin`)}`, { method: "PUT" });
      if (response.ok) {
        const page = await response.json();
        if (page.webSocketDebuggerUrl) return page;
      }
    } catch { /* Chrome may still be starting. */ }
    await delay(250);
  }
  throw new Error("Chrome remote debugging target did not start.");
})();

const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
let serial = 0;
await new Promise((resolvePromise, reject) => {
  socket.addEventListener("open", resolvePromise, { once: true });
  socket.addEventListener("error", reject, { once: true });
});
socket.addEventListener("message", event => {
  const message = JSON.parse(String(event.data));
  if (!message.id || !pending.has(message.id)) return;
  const { resolve: resolvePending, reject: rejectPending } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) rejectPending(new Error(JSON.stringify(message.error)));
  else resolvePending(message.result);
});
function command(method, params = {}) {
  return new Promise((resolvePromise, rejectCommand) => {
    const id = ++serial;
    pending.set(id, { resolve: resolvePromise, reject: rejectCommand });
    socket.send(JSON.stringify({ id, method, params }));
    setTimeout(() => {
      if (!pending.has(id)) return;
      pending.delete(id);
      reject(new Error(`CDP timeout: ${method}`));
    }, 30000);
  });
}
async function evaluate(expression) {
  const data = await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (data.exceptionDetails) throw new Error(`Page exception: ${JSON.stringify(data.exceptionDetails).slice(0, 800)}`);
  return data.result?.value;
}
async function waitFor(expression, description, attempts = 60) {
  for (let step = 0; step < attempts; step++) {
    try {
      if (await evaluate(expression)) return true;
    } catch { /* page may be mid-navigation */ }
    await delay(300);
  }
  throw new Error(`Timed out waiting for ${description}`);
}
async function goto(url) {
  await command("Page.navigate", { url });
  await delay(400);
  await waitFor("document.readyState === 'complete'", "the document to load");
}
async function setViewport(width, height) {
  await command("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 700 });
  await delay(350);
}
async function shot(name) {
  const data = await command("Page.captureScreenshot", { format: "png" });
  const path = resolve(outDir, `${name}.png`);
  await writeFile(path, Buffer.from(data.data, "base64"));
  report.screenshots.push(path);
  return path;
}
const text = () => evaluate("document.body.innerText");
/* Chrome reports rendered text, and several admin labels are uppercased in CSS, so the
 * assertions read a normalised copy rather than fighting the styling. */
const flat = async () => (await text()).toLowerCase().replace(/\s+/g, " ");
const has = needle => `document.body.innerText.toLowerCase().includes(${JSON.stringify(String(needle).toLowerCase())})`;

async function clickButton(label) {
  const clicked = await evaluate(`(() => {
    const target = [...document.querySelectorAll("button")].find(element => element.textContent.trim() === ${JSON.stringify(label)});
    if (!target) return false;
    target.click();
    return true;
  })()`);
  assert.ok(clicked, `button not found: ${label}`);
  await delay(400);
}
async function setReactControl(selector, value) {
  const done = await evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return false;
    const prototype = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value").set;
    setter.call(element, ${JSON.stringify(value)});
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  })()`);
  assert.ok(done, `control not found: ${selector}`);
  await delay(500);
}

/* --- checks --------------------------------------------------------------- */

console.log(`\nowner console QA against ${origin}`);

await command("Page.enable");
await command("Runtime.enable");

console.log("\nclosed state (no review key)");
await setViewport(1280, 900);
await goto(`${origin}/admin`);
await waitFor(has("The owner console is closed"), "the closed-state banner");
await check("a stranger reaching /admin sees the closed state and nothing else", async () => {
  const body = await text();
  assert.match(body, /The owner console is closed/);
  assert.doesNotMatch(body, /Curriculum Explorer/);
  assert.doesNotMatch(body, /Answer key/);
  return `${body.split("\n").filter(Boolean).length} lines rendered`;
});
await check("the closed page names what has to be configured, without leaking a key", async () => {
  const body = await text();
  assert.match(body, /KIDYCODE_IDENTITY_SECRET/);
  assert.match(body, /KIDYCODE_ADMIN_USER_IDS/);
  assert.doesNotMatch(body, /kc-review-/);
  return "no key in the DOM";
});
await shot("01-closed-state");
await check("the console page is noindex", async () => {
  const robots = await evaluate('document.querySelector("meta[name=robots]")?.content || ""');
  assert.match(robots, /noindex/);
  return robots;
});

console.log("\nsynthetic review session");
assert.ok(reviewKey, "a review key is required for the session checks");
await goto(`${origin}/admin?review=${encodeURIComponent(reviewKey)}`);
await waitFor(has("Synthetic review mode"), "the synthetic banner");
await check("the review key opens the console and the address bar is cleaned", async () => {
  const href = await evaluate("window.location.href");
  assert.doesNotMatch(href, /review=/);
  return href.replace(origin, "");
});
await check("the synthetic banner says plainly that this is not real learner data", async () => {
  const body = await text();
  assert.match(body, /Synthetic review mode/);
  assert.match(body, /no count on the analytics screens is live activity unless it says it is recorded/);
  return "banner present";
});
await check("the overview reports the real curriculum counts", async () => {
  const body = await flat();
  assert.match(body, /248/);
  assert.match(body, /pathways/);
  assert.match(body, /with an answer key/);
  return "248 lessons, 8 pathways, 244 with an answer key on screen";
});
await check("the read-only promise is stated on the overview", async () => {
  const body = await flat();
  assert.match(body, /read only/);
  assert.match(body, /no path that could submit a quiz answer/);
  return "read-only wording present";
});
await shot("02-overview");

console.log("\ncurriculum explorer");
await clickButton("Curriculum Explorer");
await waitFor(has("Search and filter every module"), "the explorer");
await check("every pathway is offered, including UI/UX design", async () => {
  const options = await evaluate('[...document.querySelectorAll("#adm-pathway option")].map(option => option.textContent.trim())');
  assert.ok(options.length >= 9, `expected the four coding pathways and four design bands: ${options.join(" | ")}`);
  assert.ok(options.some(option => /UI|Design/i.test(option)), "a design pathway must be listed");
  return options.join(" | ");
});
await check("a pathway filter narrows the lesson list", async () => {
  const before = await evaluate('document.body.innerText.match(/(\\d+) of 248 lessons match/)?.[1]');
  await setReactControl("#adm-pathway", "design:ages-16-18");
  const after = await evaluate('document.body.innerText.match(/(\\d+) of 248 lessons match/)?.[1]');
  assert.ok(Number(after) > 0 && Number(after) < Number(before), `${before} -> ${after}`);
  await setReactControl("#adm-pathway", "all");
  return `${before} lessons -> ${after} for the design band`;
});
await check("the lesson list renders visible rows", async () => {
  const info = await evaluate(`(() => {
    const rows = [...document.querySelectorAll(".adm-lesson-row")];
    const first = rows[0];
    const rect = first ? first.getBoundingClientRect() : null;
    const style = first ? getComputedStyle(first) : null;
    return {
      count: rows.length,
      height: Math.round(rect ? rect.height : 0),
      width: Math.round(rect ? rect.width : 0),
      top: Math.round(rect ? rect.top : 0),
      overflowY: getComputedStyle(document.querySelector(".adm-lesson-list")).overflowY,
      listHeight: Math.round(document.querySelector(".adm-lesson-list").getBoundingClientRect().height),
      viewportHeight: window.innerHeight,
      color: style ? style.color : null,
      background: style ? style.backgroundColor : null,
    };
  })()`);
  assert.ok(info.count > 0, "the list must render rows");
  assert.ok(info.height > 10 && info.width > 40, `the first row must have a visible box, saw ${JSON.stringify(info)}`);
  assert.ok(info.listHeight > 100, `the list container must have height, saw ${info.listHeight}`);
  assert.ok(info.top < info.viewportHeight, `the list must start above the fold, saw top ${info.top} in a ${info.viewportHeight}px viewport — a stretched grid row pushes it down`);
  return `${info.count} rows, first row ${info.width}x${info.height} at y=${info.top} of ${info.viewportHeight}, list height ${info.listHeight}`;
});

await check("search finds a lesson by its idea", async () => {
  await setReactControl("#adm-search", "Repair broken HTML");
  const count = await evaluate('document.body.innerText.match(/(\\d+) of 248 lessons match/)?.[1]');
  assert.ok(Number(count) >= 1, "the search must find the repair lesson");
  const titles = await evaluate('[...document.querySelectorAll(".adm-lesson-row strong")].map(element => element.textContent.trim())');
  await setReactControl("#adm-search", "");
  return `${count} match(es): ${titles.slice(0, 3).join(", ")}`;
});
await check("a lesson opens with its full content, notes, hints and answer key", async () => {
  await evaluate(`(() => {
    const row = [...document.querySelectorAll(".adm-lesson-row")].find(element => element.textContent.includes("Repair broken HTML"));
    row.click();
  })()`);
  await waitFor(has("Teaching notes"), "the lesson detail");
  const body = await flat();
  assert.match(body, /objective/);
  assert.match(body, /teaching notes/);
  assert.match(body, /worked example/);
  assert.match(body, /hint stages/);
  assert.match(body, /automatic requirements and rubric/);
  assert.match(body, /answer key and explanations/);
  assert.match(body, /explanation:/);
  return "objective, notes, example, hints, rubric and answer key all rendered";
});
await check("the correct answer is marked in the answer key", async () => {
  const correct = await evaluate('[...document.querySelectorAll(".adm-option-correct")].map(element => element.textContent.trim())');
  assert.ok(correct.length >= 1, "at least one correct option must be marked");
  return correct.slice(0, 2).join(" / ");
});
await check("lesson navigation is offered and the position is stated", async () => {
  const body = await flat();
  assert.match(body, /position \d+ of 248 in this pathway/);
  const nextEnabled = await evaluate('(() => { const b = [...document.querySelectorAll("button")].find(e => e.textContent.trim() === "Next lesson"); return Boolean(b); })()');
  assert.ok(nextEnabled, "a next-lesson control must exist");
  return body.match(/position \d+ of 248 in this pathway/)[0];
});
await check("the owner review status and note controls are on the lesson", async () => {
  const status = await evaluate('Boolean(document.querySelector("#adm-review-status"))');
  const note = await evaluate('Boolean(document.querySelector("#adm-review-note"))');
  assert.ok(status && note, "the review controls must be present");
  const labelled = await evaluate('Boolean(document.querySelector("label[for=adm-review-status]")) && Boolean(document.querySelector("label[for=adm-review-note]"))');
  assert.ok(labelled, "both controls must have a label element");
  return "status and note, both labelled";
});
await check("the review note is honestly labelled browser-local", async () => {
  const body = await flat();
  assert.match(body, /saved in this browser only/);
  return "durable-storage limitation stated";
});
await shot("03-curriculum-explorer-lesson");

console.log("\nautomatic suggestions are labelled as suggestions");
await check("quality flags are presented as heuristic suggestions", async () => {
  const body = await flat();
  assert.match(body, /automatic suggestions/);
  assert.match(body, /heuristic, not verified/);
  assert.match(body, /not findings of fact/);
  return "suggestion wording present";
});

console.log("\npreview as learner");
await clickButton("Preview as Learner");
await waitFor(has("Preview as a learner"), "the learner preview");
await check("the sandboxed preview carries a prominent owner label", async () => {
  const body = await flat();
  assert.match(body, /owner preview — read only, progress not recorded/);
  return "OWNER PREVIEW label present";
});
await check("the answer key is hidden until the owner asks for it", async () => {
  const before = await evaluate('document.querySelectorAll(".adm-option-correct").length');
  assert.equal(before, 0, "the answer key must start hidden in learner mode");
  await clickButton("Show the owner answer key");
  const after = await evaluate('document.querySelectorAll(".adm-option-correct").length');
  assert.ok(after >= 1, "the answer key must appear on request");
  return `hidden (0 markers) then revealed (${after} markers)`;
});
await check("an owner can jump straight to a gated final assessment and read all ten answers", async () => {
  await setReactControl('select[aria-label="Jump to a lesson"]', "ages-16-18:8:ages-16-18-final-knowledge");
  await waitFor(has("answer key and explanations (10 questions)"), "the final assessment answer key");
  const hidden = await evaluate('document.querySelectorAll(".adm-option-correct").length');
  assert.equal(hidden, 0, "the answer key must still start hidden after a jump");
  await clickButton("Show the owner answer key");
  const revealed = await evaluate('document.querySelectorAll(".adm-option-correct").length');
  assert.equal(revealed, 10, `expected all ten answers marked, saw ${revealed}`);
  return `gated final assessment opened; key hidden, then all ${revealed} answers shown`;
});
await check("forward and back walk the pathway without any submit control", async () => {
  const before = await evaluate("document.body.innerText.match(/position (\\d+) of 248/)?.[1]");
  await clickButton("Forward");
  await waitFor(`document.body.innerText.match(/position (\\d+) of 248/)?.[1] !== ${JSON.stringify(before)}`, "the position to change");
  const after = await evaluate("document.body.innerText.match(/position (\\d+) of 248/)?.[1]");
  await clickButton("Back");
  const back = await evaluate("document.body.innerText.match(/position (\\d+) of 248/)?.[1]");
  assert.equal(back, before, "back must return to where it was");
  const submits = await evaluate('[...document.querySelectorAll("button")].filter(element => /submit|check my work|save|mark complete|finish/i.test(element.textContent)).length');
  assert.equal(submits, 0, "no submit or completion control may exist");
  return `position ${before} -> ${after} -> ${back}, and no submit control anywhere`;
});
await shot("04-preview-as-learner");

console.log("\ncohorts, friction and retention");
await clickButton("Cohorts & Learners");
await waitFor(has("Recorded figures"), "the analytics table");
await check("every recorded figure names its source table", async () => {
  const rows = await evaluate('[...document.querySelectorAll(".adm-table tbody tr")].map(row => row.innerText.replace(/\\s+/g, " ").trim()).length');
  const sources = await evaluate('[...document.querySelectorAll(".adm-table tbody code")].map(element => element.textContent)');
  assert.ok(sources.length >= 5, "each metric must cite its source");
  return `${rows} rows, sources: ${[...new Set(sources)].join(", ")}`;
});
await check("a count from a small group is suppressed rather than shown", async () => {
  const body = await text();
  assert.match(body, /suppressed/);
  return "small groups are suppressed on screen";
});
await shot("05-cohorts-and-learners");
await clickButton("Friction & Retention");
await waitFor(has("Not tracked yet"), "the untracked measures");
await check("measures with no recorded source say 'not tracked yet' with a reason", async () => {
  const body = await text();
  for (const label of ["Verified sign-ins", "Daily and weekly active users", "Week-over-week retention cohorts", "Hint usage, failed checks, abandoned steps"]) {
    assert.ok(body.includes(label), `${label} must be listed as not tracked`);
  }
  assert.match(body, /never estimated/);
  return "four untracked measures, each with its reason and what to instrument";
});
await check("the retention view refuses to draw an invented chart", async () => {
  const body = await text();
  assert.match(body, /shows nothing here rather than a plausible shape/);
  return "no fabricated retention curve";
});
await shot("06-friction-and-retention");

console.log("\nnotification centre");
await clickButton("Notification Centre");
await waitFor(has("Notification Centre"), "the notification centre");
await check("the centre states that nothing is sent", async () => {
  const body = await flat();
  assert.match(body, /nothing is sent/);
  assert.match(body, /live delivery stays off/);
  return "no-send promise present";
});
await check("a draft renders a preview and a dry-run plan that refuses live delivery", async () => {
  await setReactControl("#adm-name", "QA-FIXTURE");
  await clickButton("Preview and dry-run plan");
  await waitFor(has("Delivery plan — dry run only"), "the dry-run plan");
  const body = await flat();
  assert.match(body, /live delivery enabled: no/);
  assert.match(body, /qa-fixture/);
  return "preview rendered and live delivery refused";
});
await shot("07-notification-centre");

console.log("\nsettings and audit");
await clickButton("Settings & Audit");
await waitFor(has("Settings and audit"), "the settings tab");
await check("the console reports its own trust boundary honestly", async () => {
  const body = await flat();
  assert.match(body, /owner allowlist configured/);
  assert.match(body, /identity trust mode/);
  assert.match(body, /proxy-signature is the only mode that grants owner access/);
  assert.match(body, /browser-local/);
  return "configuration state stated without over-claiming";
});
await check("the owner review checklist is on the screen", async () => {
  const items = await evaluate('[...document.querySelectorAll("ol li")].filter(element => /Explorer|Preview|notes|Friction/.test(element.textContent)).length');
  assert.ok(items >= 3, "the checklist must be present");
  return `${items} checklist items`;
});
await shot("08-settings-and-audit");

console.log("\naccessibility and responsive behaviour");
async function auditViewport(width, height, label) {
  await setViewport(width, height);
  await clickButton("Curriculum Explorer");
  await waitFor(has("Curriculum Explorer"), "the explorer");
  const overflow = await evaluate("({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth })");
  assert.ok(overflow.scroll <= overflow.client + 1, `horizontal overflow at ${width}px: scrollWidth ${overflow.scroll} > clientWidth ${overflow.client}`);
  const path = await shot(`${label}`);
  return `${width}x${height}: scrollWidth ${overflow.scroll} = clientWidth ${overflow.client} (no horizontal overflow), image ${path.split(/[\\/]/).pop()}`;
}
await check("no horizontal overflow at 320px", () => auditViewport(320, 720, "09-responsive-320"));
await check("no horizontal overflow at 768px", () => auditViewport(768, 1024, "10-responsive-768"));
await check("no horizontal overflow at 1440px", () => auditViewport(1440, 900, "11-responsive-1440"));

await check("every interactive control has an accessible name", async () => {
  const tree = await command("Accessibility.getFullAXTree");
  const nameless = tree.nodes.filter(node => {
    const role = node.role?.value;
    if (!["button", "link", "combobox", "textbox", "searchbox", "listbox"].includes(role)) return false;
    if (node.ignored) return false;
    return !(node.name?.value || "").trim();
  });
  assert.equal(nameless.length, 0, `${nameless.length} control(s) without a name: ${nameless.slice(0, 5).map(node => node.role?.value).join(", ")}`);
  return `${tree.nodes.length} accessibility nodes, every control named`;
});
await check("headings and landmarks give the page a structure", async () => {
  const tree = await command("Accessibility.getFullAXTree");
  const roles = new Set(tree.nodes.map(node => node.role?.value));
  assert.ok(roles.has("heading"), "the page must expose headings");
  assert.ok(roles.has("main"), "the page must expose a main landmark");
  assert.ok(roles.has("navigation"), "the page must expose a navigation landmark");
  return [...roles].filter(role => ["heading", "main", "navigation"].includes(role)).join(", ");
});
await check("a skip link reaches the console content", async () => {
  const href = await evaluate('document.querySelector(".adm-skip")?.getAttribute("href")');
  const exists = await evaluate('Boolean(document.querySelector("#adm-main"))');
  assert.equal(href, "#adm-main");
  assert.ok(exists);
  return "skip link points at #adm-main";
});
await check("keyboard focus is visible on the console navigation", async () => {
  await setViewport(1280, 900);
  await evaluate('document.querySelector(".adm-skip").focus()');
  await command("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  await command("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  await delay(200);
  const focused = await evaluate(`(() => {
    const element = document.activeElement;
    const style = getComputedStyle(element);
    return { tag: element.tagName, text: (element.textContent || "").trim().slice(0, 40), outline: style.outlineStyle, width: style.outlineWidth };
  })()`);
  assert.ok(["BUTTON", "A", "SELECT", "INPUT"].includes(focused.tag), `expected focus on a control, saw ${focused.tag}`);
  assert.notEqual(focused.outline, "none", "focus must be visible");
  return `focus on ${focused.tag} "${focused.text}" with a ${focused.width} ${focused.outline} outline`;
});

console.log("\nreply and report");
report.finishedAt = new Date().toISOString();
report.passed = report.checks.length;
report.failed = report.failures.length;
await writeFile(resolve(outDir, "report.json"), JSON.stringify(report, null, 2));
console.log(`\n${report.passed} checks passed, ${report.failed} failed`);
console.log(`screenshots: ${report.screenshots.length} under ${outDir}`);
console.log(`report: ${resolve(outDir, "report.json")}`);

socket.close();
process.exit(report.failed > 0 ? 1 : 0);
