import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const errors = [];

function fail(message) {
  errors.push(message);
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function cleanReference(value) {
  return value.split('#')[0].split('?')[0];
}

const htmlFiles = walk(dist).filter((file) => file.endsWith('.html'));
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file);
  if (!/^<!doctype html>/i.test(html.trim())) fail(`${relative} is missing a doctype.`);
  if (!/<title>[^<]+<\/title>/i.test(html)) fail(`${relative} is missing a title.`);
  if (!/<meta\s+name="viewport"/i.test(html)) fail(`${relative} is missing the viewport meta tag.`);

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) fail(`${relative} has duplicate IDs: ${[...new Set(duplicates)].join(', ')}.`);

  for (const match of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const reference = cleanReference(match[1]);
    if (!reference || reference.startsWith('#') || reference.startsWith('http') || reference.startsWith('mailto:') || reference.startsWith('data:')) continue;
    let target = path.resolve(path.dirname(file), reference);
    if (reference.endsWith('/')) target = path.join(target, 'index.html');
    if (!fs.existsSync(target)) fail(`${relative} points to missing local file ${reference}.`);
  }
}

for (const shared of ['index.html', 'styles.css', 'app.js', 'young/index.html', 'adult/index.html', 'learn/index.html', 'learn/learn.css', 'learn/learn.js', 'learn/curriculum.js']) {
  const source = path.join(root, shared);
  const output = path.join(dist, shared);
  if (!fs.existsSync(source) || !fs.existsSync(output)) fail(`${shared} is missing from source or dist.`);
  else if (!fs.readFileSync(source).equals(fs.readFileSync(output))) fail(`${shared} is not synchronised with dist.`);
}

const learnHtml = fs.readFileSync(path.join(dist, 'learn', 'index.html'), 'utf8');
for (const requiredId of ['stage-map', 'code-editor', 'code-preview', 'hint-text', 'portfolio-grid', 'badge-grid', 'grownup-progress', 'profile-dialog']) {
  if (!learnHtml.includes(`id="${requiredId}"`)) fail(`Learning app is missing #${requiredId}.`);
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log(`Validated ${htmlFiles.length} pages, local references, unique IDs and source-to-dist parity.`);
