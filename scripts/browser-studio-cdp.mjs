/**
 * Real Chrome DevTools Protocol smoke for KidyCode Practice Studio.
 * No external browser framework or paid browser service is required.
 * Start a local dev server plus Chrome headless --remote-debugging-port=9226.
 */
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";

const origin = (process.env.KIDYCODE_E2E_URL || "http://127.0.0.1:3003").replace(/\/$/, "");
const debugging = "http://127.0.0.1:9226";
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function retry(task, expected, message, count = 45) {
  for (let step = 0; step < count; step++) {
    try {
      const value = await task();
      if (expected(value)) return value;
    } catch { /* browser/page may be initializing */ }
    await delay(250);
  }
  throw new Error(message);
}
const target = await retry(async () => {
  const r = await fetch(debugging + "/json/new?" + encodeURIComponent(origin + "/studio"), { method: "PUT" });
  if (!r.ok) throw new Error("Chrome unavailable");
  return r.json();
}, page => Boolean(page.webSocketDebuggerUrl), "Chrome remote debugging target did not start", 25);

const ws = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
let serial = 0;
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", reject, { once: true });
});
ws.addEventListener("message", event => {
  const msg = JSON.parse(String(event.data));
  if (!msg.id || !pending.has(msg.id)) return;
  const {resolve, reject} = pending.get(msg.id);
  pending.delete(msg.id);
  if (msg.error) reject(new Error(JSON.stringify(msg.error)));
  else resolve(msg.result);
});
function command(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++serial;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => {
      if (!pending.has(id)) return;
      pending.delete(id);
      reject(new Error("CDP timeout: " + method));
    }, 20000);
  });
}
async function evaluate(expression) {
  const data = await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (data.exceptionDetails) throw new Error("Page JavaScript exception: " + JSON.stringify(data.exceptionDetails).slice(0, 1200));
  return data.result?.value;
}
async function ready() {
  await retry(() => evaluate('Boolean(document.querySelector("[data-testid=studio-canvas]"))'),
    Boolean, "Studio canvas failed to hydrate");
}
async function clickText(value) {
  const ok = await evaluate('(()=>{const b=[...document.querySelectorAll("button")].find(el=>el.textContent.trim()===' + JSON.stringify(value) + ');if(!b)return false;b.click();return true;})()');
  assert(ok, "Button not found: " + value);
  await delay(180);
}
async function selectValue(id, value) {
  const script = '(()=>{const n=document.getElementById(' + JSON.stringify(id) + ');if(!n)return false;' +
    'Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value").set.call(n,' + JSON.stringify(value) + ');' +
    'n.dispatchEvent(new Event("change",{bubbles:true}));return true;})()';
  assert(await evaluate(script), "Select not found: " + id);
  await delay(180);
}
async function screenshot(width) {
  const result = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile("/tmp/kidycode-studio-" + width + ".png", Buffer.from(result.data, "base64"));
}
async function viewport(width, height = 900) {
  await command("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width <= 480 });
  await delay(220);
  const metrics = await evaluate('(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,canvas:document.querySelector("[data-testid=studio-canvas]")?.getBoundingClientRect().width}))()');
  assert(metrics.canvas > 100, "Editor canvas must render at width " + width);
  assert(metrics.scroll <= metrics.width + 3, "Horizontal page overflow at " + width + "px: " + JSON.stringify(metrics));
  console.log("Studio viewport " + width + ": responsive canvas visible, no page overflow");
  await screenshot(width);
}
async function coordinates(query) {
  const expression = '(()=>{const n=document.querySelector(' + JSON.stringify(query) + ');if(!n)return null;' +
    'n.scrollIntoView({block:"center",inline:"nearest"});const r=n.getBoundingClientRect();' +
    'return {x:r.x+r.width/2,y:r.y+r.height/2};})()';
  return evaluate(expression);
}
async function drag(x, y, dx, dy) {
  await command("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await command("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  for (let n = 1; n <= 4; n++)
    await command("Input.dispatchMouseEvent", { type: "mouseMoved", x: x + dx * n/4, y: y + dy*n/4, button: "left", buttons: 1 });
  await command("Input.dispatchMouseEvent", { type: "mouseReleased", x: x + dx, y: y + dy, button: "left", clickCount: 1 });
  await delay(250);
}

await command("Page.enable");
await command("Runtime.enable");
await ready();
await viewport(1440);
const first = await evaluate('document.querySelectorAll("[data-testid=studio-canvas] .fake").length');
assert.equal(first, 0);
await clickText("Save my design");
assert(await evaluate('document.body.innerText.includes("Saved on this device")'), "Explicit Save confirmation must show");

const nodeSelector = '[data-testid="studio-canvas"] button[aria-label^="text:"]';
const node = await coordinates(nodeSelector);
assert(node, "Starter template must have movable text");
const before = await evaluate('(()=>{const e=document.querySelector(' + JSON.stringify(nodeSelector) + ');return e.style.left})()');
await drag(node.x, node.y, 22, 22);
const after = await evaluate('(()=>{const e=document.querySelector(' + JSON.stringify(nodeSelector) + ');return e.style.left})()');
assert.notEqual(after, before, "Dragging the title must change its position");
console.log("Studio drag: moved real canvas element");

const handle = await coordinates('button[aria-label^="Resize selected element"]');
assert(handle, "Selected element must expose an accessible resize grip");
const sizeBefore = await evaluate('document.querySelector(' + JSON.stringify(nodeSelector) + ').style.width');
await drag(handle.x, handle.y, 18, 24);
const sizeAfter = await evaluate('document.querySelector(' + JSON.stringify(nodeSelector) + ').style.width');
assert.notEqual(sizeAfter, sizeBefore, "Resize grip must change the element width");
console.log("Studio resize: changed width via pointer grip");

// Review label is dynamic by project; activate using DOM instead.
const reviewOpen = await evaluate('(()=>{const b=[...document.querySelectorAll("button")].find(n=>n.textContent.includes("Review my design"));if(!b)return false;if(!b.getAttribute("aria-expanded") || b.getAttribute("aria-expanded")==="false")b.click();return true;})()');
assert(reviewOpen, "Review control should exist");
assert(await evaluate('Boolean(document.querySelector("[aria-label=\\"Guided design review\\"]"))'), "Review list should open");

await selectValue("age-group", "ages-13-15");
await clickText("Add screen");
const screens = await evaluate('document.querySelectorAll("[aria-label=Screens] button").length');
assert(screens >= 4, "Older learner should be able to add a second screen");
console.log("Studio advanced: screen management is available");
await clickText("Save my design");
await delay(330);
const store = await evaluate('localStorage.getItem("kidycode.practice-studio.v1")');
assert(store && JSON.parse(store)[0].screens.length === 2, "Device draft must store two screens");
await command("Page.reload", { ignoreCache: true });
// Page.reload returns before React has restored the localStorage draft.
// Wait for the actual multi-screen UI, not merely the first HTML frame.
await retry(() => evaluate('document.querySelectorAll("[aria-label=Screens] button").length'),
  count => count >= 4, "Reload must restore multi-screen work", 70);
console.log("Studio device-only draft: survives reload");

await viewport(768);
await viewport(320, 820);
ws.close();
console.log("Studio browser QA: drag, resize, review, multi-screen, save/reload, 1440/768/320 layout passed.");
