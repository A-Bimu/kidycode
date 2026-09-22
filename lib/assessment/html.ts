/*
 * A tolerant HTML reader.
 *
 * Requirement checks must never depend on one exact code string, so the grader reads
 * the document into a small element tree and asks structural questions instead. This
 * is a reader, not a sanitiser and not a validator: it never executes anything, never
 * resolves URLs and never touches the network. A malformed document is read as far as
 * it can be and the problems are counted so a caller can decide what that means.
 */

export type HtmlAttribute = { name: string; value: string };

export type HtmlNode = {
  tag: string;
  attributes: HtmlAttribute[];
  children: HtmlNode[];
  text: string;
};

const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
  "param", "source", "track", "wbr",
]);

const RAW_TEXT_ELEMENTS = new Set(["script", "style", "textarea", "title"]);

export type HtmlDocument = {
  roots: HtmlNode[];
  problems: number;
};

function parseAttributes(source: string): HtmlAttribute[] {
  const attributes: HtmlAttribute[] = [];
  const pattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>`]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) {
    const name = match[1].toLowerCase();
    /* A bare attribute is present with an empty value, the way the browser treats it. */
    const value = match[3] ?? match[4] ?? match[5] ?? "";
    attributes.push({ name, value });
  }
  return attributes;
}

export function parseHtml(source: string): HtmlDocument {
  const roots: HtmlNode[] = [];
  const stack: HtmlNode[] = [];
  let problems = 0;
  let index = 0;

  const push = (node: HtmlNode) => {
    const parent = stack[stack.length - 1];
    if (parent) parent.children.push(node);
    else roots.push(node);
  };
  const appendText = (text: string) => {
    const parent = stack[stack.length - 1];
    if (parent) parent.text += text;
  };

  while (index < source.length) {
    const next = source.indexOf("<", index);
    if (next < 0) {
      appendText(source.slice(index));
      break;
    }
    if (next > index) appendText(source.slice(index, next));

    if (source.startsWith("<!--", next)) {
      const end = source.indexOf("-->", next + 4);
      index = end < 0 ? source.length : end + 3;
      continue;
    }
    if (source.startsWith("<!", next) || source.startsWith("<?", next)) {
      const end = source.indexOf(">", next);
      index = end < 0 ? source.length : end + 1;
      continue;
    }
    if (source.startsWith("</", next)) {
      const end = source.indexOf(">", next);
      if (end < 0) {
        problems += 1;
        index = source.length;
        continue;
      }
      const tag = source.slice(next + 2, end).trim().toLowerCase();
      let matched = -1;
      for (let depth = stack.length - 1; depth >= 0; depth -= 1) {
        if (stack[depth].tag === tag) {
          matched = depth;
          break;
        }
      }
      if (matched < 0) {
        problems += 1;
      } else {
        if (matched !== stack.length - 1) problems += 1;
        stack.length = matched;
      }
      index = end + 1;
      continue;
    }

    const end = source.indexOf(">", next);
    const raw = source.slice(next + 1, end < 0 ? source.length : end);
    const selfClosing = raw.trimEnd().endsWith("/");
    const cleaned = selfClosing ? raw.trimEnd().slice(0, -1) : raw;
    const space = cleaned.search(/[\s/]/);
    const tag = (space < 0 ? cleaned : cleaned.slice(0, space)).trim().toLowerCase();
    const attributeSource = space < 0 ? "" : cleaned.slice(space);
    if (!/^[a-z][a-z0-9-]*$/.test(tag)) {
      problems += 1;
      appendText(source.slice(next, end < 0 ? source.length : end + 1));
      index = end < 0 ? source.length : end + 1;
      continue;
    }

    const node: HtmlNode = { tag, attributes: parseAttributes(attributeSource), children: [], text: "" };
    push(node);
    index = end < 0 ? source.length : end + 1;

    if (VOID_ELEMENTS.has(tag) || selfClosing) continue;

    if (RAW_TEXT_ELEMENTS.has(tag)) {
      const close = source.toLowerCase().indexOf(`</${tag}`, index);
      if (close < 0) {
        node.text += source.slice(index);
        stack.pop();
        index = source.length;
        continue;
      }
      node.text += source.slice(index, close);
      const after = source.indexOf(">", close);
      stack.pop();
      index = after < 0 ? source.length : after + 1;
      continue;
    }

    stack.push(node);
  }

  if (stack.length > 0) problems += 1;
  return { roots, problems };
}

export function walk(document: HtmlDocument | HtmlNode[]): HtmlNode[] {
  const nodes = Array.isArray(document) ? document : document.roots;
  const found: HtmlNode[] = [];
  const visit = (node: HtmlNode) => {
    found.push(node);
    node.children.forEach(visit);
  };
  nodes.forEach(visit);
  return found;
}

export function findAll(document: HtmlDocument, tag: string): HtmlNode[] {
  return walk(document).filter((node) => node.tag === tag);
}

export function attribute(node: HtmlNode, name: string): string | null {
  const found = node.attributes.find((entry) => entry.name === name);
  return found ? found.value : null;
}

export function hasAttribute(node: HtmlNode, name: string): boolean {
  return node.attributes.some((entry) => entry.name === name);
}

/* Every piece of text in reading order, with whitespace collapsed, so a text question
 * can be asked without caring how the learner laid the source out. */
export function textContent(node: HtmlNode): string {
  const parts: string[] = [];
  const visit = (current: HtmlNode) => {
    if (current.text.trim().length > 0) parts.push(current.text);
    current.children.forEach(visit);
  };
  visit(node);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function documentText(document: HtmlDocument): string {
  return walk(document)
    .map((node) => node.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function ids(document: HtmlDocument): Set<string> {
  const found = new Set<string>();
  for (const node of walk(document)) {
    const value = attribute(node, "id");
    if (value) found.add(value);
  }
  return found;
}

/* A control is labelled when a label points at it with for, or when the control sits
 * inside a label element. */
export function labelledControls(document: HtmlDocument): { total: number; labelled: number } {
  const controls = walk(document).filter((node) => ["input", "select", "textarea"].includes(node.tag));
  const forValues = new Set(
    walk(document)
      .filter((node) => node.tag === "label")
      .map((node) => attribute(node, "for"))
      .filter((value): value is string => Boolean(value)),
  );
  const labelWrapped = new Set<HtmlNode>();
  for (const label of walk(document).filter((node) => node.tag === "label")) {
    for (const control of walk(label.children).filter((node) => ["input", "select", "textarea"].includes(node.tag))) {
      labelWrapped.add(control);
    }
  }
  const labelled = controls.filter((control) => {
    if (labelWrapped.has(control)) return true;
    const id = attribute(control, "id");
    return Boolean(id && forValues.has(id));
  });
  return { total: controls.length, labelled: labelled.length };
}

export function headingSequence(document: HtmlDocument): number[] {
  return walk(document)
    .map((node) => /^h([1-6])$/.exec(node.tag))
    .filter((match): match is RegExpExecArray => Boolean(match))
    .map((match) => Number(match[1]));
}

/* A link the learner can actually follow to a section of the same page. */
export function resolvingFragmentLinks(document: HtmlDocument): number {
  const known = ids(document);
  return walk(document)
    .filter((node) => node.tag === "a")
    .filter((node) => {
      const href = attribute(node, "href") || "";
      if (!href.startsWith("#") || href.length < 2) return false;
      return known.has(href.slice(1)) && textContent(node).length > 0;
    }).length;
}
