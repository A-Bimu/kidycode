#!/usr/bin/env node
/* One-off diagnostic for the curriculum explorer lesson list paint. */
const origin = (process.argv[2] || "http://127.0.0.1:3003").replace(/\/$/, "");
const key = process.argv[3] || "";
const debugging = "http://127.0.0.1:9226";
const delay = ms => new Promise(r => setTimeout(r, ms));

const page = await (await fetch(`${debugging}/json/new?${encodeURIComponent(`${origin}/admin?review=${encodeURIComponent(key)}`)}`, { method: "PUT" })).json();
const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
let serial = 0;
await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
socket.addEventListener("message", event => {
  const message = JSON.parse(String(event.data));
  if (!message.id || !pending.has(message.id)) return;
  const entry = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) {
    entry.reject(new Error(JSON.stringify(message.error)));
  } else {
    entry.resolve(message.result);
  }
});
const command = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++serial;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
  setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error(`timeout ${method}`)); } }, 20000);
});
const evaluate = async expression => {
  const data = await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (data.exceptionDetails) throw new Error(JSON.stringify(data.exceptionDetails).slice(0, 600));
  return data.result?.value;
};
async function waitFor(expression, label) {
  for (let i = 0; i < 60; i++) {
    let ready = false;
    try {
      ready = Boolean(await evaluate(expression));
    } catch {
      ready = false;
    }
    if (ready) return;
    await delay(300);
  }
  throw new Error(`timeout ${label}`);
}

await command("Page.enable");
await command("Runtime.enable");
await command("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await waitFor('document.body.innerText.toLowerCase().includes("synthetic review mode")', "console");
await evaluate('[...document.querySelectorAll(".adm-nav button")].find(b => b.textContent.trim() === "Curriculum Explorer").click()');
await waitFor('document.body.innerText.toLowerCase().includes("248 of 248")', "explorer");
await evaluate(`[...document.querySelectorAll(".adm-lesson-row")].find(e => e.textContent.includes("Repair broken HTML")).click()`);
await waitFor('document.body.innerText.toLowerCase().includes("teaching notes")', "lesson detail");
await delay(1200);

const diagnostic = await evaluate(`(() => {
  const rows = [...document.querySelectorAll(".adm-lesson-row")];
  const ul = document.querySelector(".adm-lesson-list");
  const card = ul.closest(".adm-card");
  const grid = ul.closest(".adm-grid-2");
  const first = rows[0];
  const rect = first.getBoundingClientRect();
  const cx = Math.round(rect.left + rect.width / 2);
  const cy = Math.round(rect.top + Math.min(20, rect.height / 2));
  const atPoint = document.elementFromPoint(cx, cy);
  const describe = (element) => {
    if (!element) return null;
    const s = getComputedStyle(element);
    const b = element.getBoundingClientRect();
    return {
      tag: element.tagName,
      cls: element.className,
      text: (element.textContent || "").trim().slice(0, 30),
      rect: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)],
      color: s.color, background: s.backgroundColor, opacity: s.opacity, visibility: s.visibility,
      display: s.display, position: s.position, zIndex: s.zIndex, overflow: s.overflow,
    };
  };
  return {
    scroll: { y: window.scrollY, innerHeight: window.innerHeight },
    rowCount: rows.length,
    first: describe(first),
    list: describe(ul),
    card: describe(card),
    grid: describe(grid),
    gridColumns: grid ? getComputedStyle(grid).gridTemplateColumns : null,
    atPoint: describe(atPoint),
    firstText: (first.textContent || "").trim().slice(0, 60),
  };
})()`);
console.log(JSON.stringify(diagnostic, null, 2));
const shot = await command("Page.captureScreenshot", { format: "png" });
const { writeFile } = await import("node:fs/promises");
await writeFile("work/diag-explorer.png", Buffer.from(shot.data, "base64"));
console.log("screenshot: work/diag-explorer.png");
socket.close();
