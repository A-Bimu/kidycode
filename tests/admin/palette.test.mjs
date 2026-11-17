#!/usr/bin/env node
/* Admin palette regression: never let the approved blue / white / gold scheme inherit
 * the nude KidyCode marketing palette again. This checks source structure and a few
 * known readable text-colour pairs; visual screenshot review is still needed. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(import.meta.dirname, "../../app/admin/admin.css"), "utf8");
const globals = readFileSync(resolve(import.meta.dirname, "../../app/globals.css"), "utf8");

const swatches = new Map([
  ["--adm-canvas", "#f7f9fc"],
  ["--adm-white", "#ffffff"],
  ["--adm-blue-surface", "#edf3fa"],
  ["--adm-navy", "#0f2d52"],
  ["--adm-blue", "#1e5aa8"],
  ["--adm-blue-deep", "#143d73"],
  ["--adm-blue-pale", "#e8f1fc"],
  ["--adm-gold", "#d4a63a"],
  ["--adm-gold-ink", "#805a0c"],
  ["--adm-border", "#d8e2ee"],
  ["--adm-ink-soft", "#394d66"],
  ["--adm-danger", "#a52b36"],
]);
assert.match(css, /\.adm-shell\s*\{/);
for (const [token, hex] of swatches) {
  assert.ok(css.includes(`${token}: ${hex};`), `Admin swatch ${token} must be approved ${hex}`);
}
for (const token of ["--paper", "--paper-deep", "--navy", "--white", "--purple", "--purple-dark", "--purple-pale", "--amber", "--amber-pale", "--coral", "--line", "--ink-soft"]) {
  assert.ok(!css.includes(`var(${token})`), `Admin must not inherit ${token} from learner pages`);
}
assert.ok(!/\b(?:nude|beige|cream|purple|lavender|amber|green)\b/i.test(css), "Rejected palette references are present");
assert.ok(!css.includes("#f8d9a4"), "Old beige-ish code foreground is present");
assert.ok(css.includes("border-bottom: 4px solid var(--adm-gold)"), "Gold must be a purposeful accent");
assert.ok(css.includes("outline: 3px solid var(--adm-gold-ink)"), "Keyboard focus must be visible");
assert.ok(globals.includes("--paper: #f7f3ea;"), "Marketing/learner colour tokens must not be changed by admin redesign");

const luminance = (hex) => {
  const parts = hex.slice(1).match(/../g).map(part => parseInt(part, 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return parts[0] * 0.2126 + parts[1] * 0.7152 + parts[2] * 0.0722;
};
const contrast = (a, b) => {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
};
for (const [foreground, background] of [
  ["--adm-white", "--adm-navy"],
  ["--adm-white", "--adm-blue"],
  ["--adm-navy", "--adm-canvas"],
  ["--adm-ink-soft", "--adm-white"],
  ["--adm-gold-ink", "--adm-white"],
  ["--adm-danger", "--adm-white"],
]) {
  assert.ok(contrast(swatches.get(foreground), swatches.get(background)) >= 4.5, `Insufficient normal-text contrast: ${foreground} on ${background}`);
}
console.log("Admin owner-approved palette: 12 scoped tokens, no rejected colours, marketing unchanged, 6 text contrasts passed.");
