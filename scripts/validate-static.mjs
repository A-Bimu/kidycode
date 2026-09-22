import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const pagePairs = [
  ["public/landing.html", "index.html"],
  ["public/young/index.html", "young/index.html"],
  ["public/adult/index.html", "adult/index.html"],
];

for (const [publicPath, rootPath] of pagePairs) {
  const file = join(root, publicPath);
  const html = readFileSync(file, "utf8");
  assert.equal(html, readFileSync(join(root, rootPath), "utf8"), `${publicPath} and ${rootPath} must remain identical.`);
  assert.match(html, /^<!doctype html>/i, `${publicPath} needs a doctype.`);
  assert.match(html, /<title>[^<]+<\/title>/i, `${publicPath} needs a title.`);
  assert.match(html, /<meta\s+name="viewport"/i, `${publicPath} needs a viewport tag.`);
  assert(!html.includes("—"), `${publicPath} contains an em dash.`);
  assert(!/\bgreen\b/i.test(html), `${publicPath} contains the banned colour name.`);
  assert(!/curious minds?|learn through games?|game-led/i.test(html), `${publicPath} contains rejected generic or game-led messaging.`);

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${publicPath} contains duplicate IDs.`);
  for (const match of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const reference = match[1].split("#")[0].split("?")[0];
    if (!reference || reference.startsWith("http") || reference.startsWith("mailto:") || reference.startsWith("#") || reference.endsWith("/")) continue;
    const target = reference.startsWith("/") ? join(root, "public", reference) : resolve(dirname(file), reference);
    /* A link may point at a static file or at a route the application serves, such
     * as /privacy or /guardian. A route counts when its page exists. */
    const route = reference.replace(/^\//, "").replace(/\/$/, "");
    const appRoute = route === "" || existsSync(join(root, "app", route, "page.tsx"));
    assert(existsSync(target) || appRoute, `${publicPath} points to missing file ${reference}.`);
  }
}

for (const [publicPath, rootPath] of [["public/styles.css", "styles.css"], ["public/app.js", "app.js"]]) {
  assert.equal(readFileSync(join(root, publicPath), "utf8"), readFileSync(join(root, rootPath), "utf8"), `${publicPath} and ${rootPath} must remain identical.`);
}

const landing = readFileSync(join(root, "public/landing.html"), "utf8");
const youth = readFileSync(join(root, "public/young/index.html"), "utf8");
const adult = readFileSync(join(root, "public/adult/index.html"), "utf8");
const styles = readFileSync(join(root, "public/styles.css"), "utf8");
const script = readFileSync(join(root, "public/app.js"), "utf8");

for (const duration of ["18 TO 22 HOURS", "24 TO 30 HOURS", "30 TO 38 HOURS", "26 TO 34 HOURS"]) {
  assert(landing.includes(duration), `The landing page is missing the correct duration: ${duration}`);
}
for (const route of ['href="learn/"', 'href="learn/13-15/"', 'href="learn/16-18/"', 'href="learn/adults/"']) {
  assert(landing.includes(route), `The landing page is missing course link ${route}.`);
}
for (const image of ["family-kidycode.webp", "kids-kidycode.webp"]) {
  assert(landing.includes(image), `The landing page is missing human photography: ${image}`);
}

const landingOrigami = [...landing.matchAll(/<figure[^>]*>[\s\S]*?<img[^>]+src="assets\/(origami-[^"]+)"[\s\S]*?<\/figure>/g)].map((match) => match[1]);
assert(landingOrigami.length >= 6, "The landing page needs separately presented origami animals.");
assert(new Set(landingOrigami).size >= 5, "The landing page needs several distinct origami animals.");

for (const projectName of ["Interest Guide", "Club Website", "Mini Magazine", "Personal Portfolio", "Community Event Hub", "Small Business Website", "Revision Planner", "Opportunity Directory", "Service Dashboard"]) {
  assert(youth.includes(projectName), `The youth page is missing the real project option: ${projectName}`);
}
for (const adultProject of ["Professional portfolio", "Organisation website", "Service business site"]) {
  assert(adult.includes(adultProject), `The adult page is missing the real project option: ${adultProject}`);
}
assert(adult.includes("No seven-day career promise."), "The adult page must avoid an inflated job-readiness promise.");
assert(!/job-ready overnight[^<]*guarantee/i.test(adult), "The adult page contains an inflated outcome claim.");

for (const colourVariable of ["--navy:", "--purple:", "--cream:", "--warm:"]) {
  assert(styles.includes(colourVariable), `The marketing palette is missing ${colourVariable}`);
}
assert(!/\bgreen\b/i.test(styles), "Marketing styles contain the banned colour name.");
assert(styles.includes("@keyframes quietFloat") && styles.includes("@keyframes guideFloat"), "Origami motion is missing.");
assert(styles.includes("prefers-reduced-motion"), "Marketing motion needs a reduced-motion alternative.");
assert(styles.includes("overflow-x: hidden"), "Marketing pages need horizontal overflow protection.");
assert(script.includes("IntersectionObserver"), "Marketing reveal motion is not initialised.");

console.log("Validated truthful marketing, four course links, exact durations, real people, separate origami art and mirrored static files.");
