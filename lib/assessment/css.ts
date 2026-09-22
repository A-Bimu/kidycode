/*
 * A tolerant CSS reader.
 *
 * Rules are read into a flat list carrying their media context, so a requirement can
 * ask about a declaration inside a breakpoint without caring about formatting,
 * ordering or the learner's choice of selector name. Nothing here executes or
 * resolves a value; value classes are decided from the declaration text.
 */

import type { CssValueClass } from "@/lib/assessment/types";

export type CssDeclaration = { property: string; value: string; important: boolean };
export type CssRule = {
  selector: string;
  declarations: CssDeclaration[];
  media: string | null;
  supports: string | null;
};
export type StyleSheet = { rules: CssRule[]; problems: number; customProperties: string[] };

function splitDeclarations(body: string): CssDeclaration[] {
  const declarations: CssDeclaration[] = [];
  for (const part of body.split(";")) {
    const text = part.trim();
    if (text.length === 0) continue;
    const colon = text.indexOf(":");
    if (colon <= 0) continue;
    const property = text.slice(0, colon).trim().toLowerCase();
    let value = text.slice(colon + 1).trim();
    const important = /!important$/i.test(value);
    if (important) value = value.replace(/!important$/i, "").trim();
    if (property.length === 0 || value.length === 0) continue;
    declarations.push({ property, value, important });
  }
  return declarations;
}

/* Leading comments are removed once, so a commented out rule can never satisfy a
 * requirement and never breaks the reader. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, " ");
}

export function parseCss(source: string): StyleSheet {
  const text = stripComments(source);
  const rules: CssRule[] = [];
  const customProperties: string[] = [];
  let problems = 0;
  let index = 0;

  /* Reads forward from the current position to the brace that closes the block the
   * cursor is inside, and returns the body text. Nested braces are counted, so a media
   * query's inner rules are read as rules rather than being swallowed by the first
   * closing brace the reader happens to meet. */
  const readBody = (): string => {
    const start = index;
    let depth = 0;
    while (index < text.length) {
      const character = text[index];
      if (character === "{") depth += 1;
      else if (character === "}") {
        if (depth === 0) {
          const body = text.slice(start, index);
          index += 1;
          return body;
        }
        depth -= 1;
      }
      index += 1;
    }
    return text.slice(start);
  };

  const readBlock = (media: string | null, supports: string | null): void => {
    let selectorBuffer = "";
    while (index < text.length) {
      const character = text[index];
      if (character === "}") {
        index += 1;
        return;
      }
      if (character === "{") {
        const selector = selectorBuffer.trim();
        selectorBuffer = "";
        index += 1;
        if (selector.startsWith("@")) {
          const name = selector.slice(1).split(/[\s(]/)[0].toLowerCase();
          const open = selector.indexOf("(");
          const close = selector.lastIndexOf(")");
          const condition = open >= 0 && close > open ? selector.slice(open + 1, close).trim() : "";
          if (name === "media") readBlock(condition, supports);
          else if (name === "supports") readBlock(media, condition);
          else if (name === "keyframes" || name === "font-face") readBody();
          else readBlock(media, supports);
          continue;
        }
        const body = readBody();
        const declarations = splitDeclarations(body);
        rules.push({ selector, declarations, media, supports });
        for (const declaration of declarations) {
          if (declaration.property.startsWith("--")) customProperties.push(declaration.property);
        }
        continue;
      }
      if (character === ";") {
        if (selectorBuffer.trim().length > 0) problems += 1;
        selectorBuffer = "";
        index += 1;
        continue;
      }
      selectorBuffer += character;
      index += 1;
    }
  };

  while (index < text.length) {
    const before = index;
    readBlock(null, null);
    if (text.slice(before, index).trim().length === 0) break;
  }

  return { rules, problems, customProperties: [...new Set(customProperties)] };
}

function matchesSelector(rule: CssRule, selector?: string): boolean {
  if (!selector) return true;
  const wanted = selector.replace(/\s+/g, "");
  return rule.selector
    .split(",")
    .map((part) => part.replace(/\s+/g, ""))
    .some((part) => part === wanted || part.endsWith(wanted) || part.includes(wanted));
}

export function declarationsOf(
  sheet: StyleSheet,
  options: { selector?: string; property?: string; media?: boolean },
): CssDeclaration[] {
  return sheet.rules
    .filter((rule) => matchesSelector(rule, options.selector))
    .filter((rule) => (options.media === undefined ? true : options.media ? rule.media !== null : rule.media === null))
    .flatMap((rule) => rule.declarations)
    .filter((declaration) => (options.property ? declaration.property === options.property : true));
}

export function declarationValues(
  sheet: StyleSheet,
  options: { selector?: string; property?: string; media?: boolean },
): string[] {
  return declarationsOf(sheet, options).map((declaration) => declaration.value.toLowerCase());
}

/*
 * Value classes are decided from the channel values and the unit, never from a
 * pattern that happens to resemble a colour, so a token like #090f26 can never be
 * mistaken for a banned colour and a valid outcome is never rejected for its wording.
 */
export function matchesValueClass(values: string[], valueClass: CssValueClass): boolean {
  return values.some((value) => valueMatchesClass(value, valueClass));
}

export function valueMatchesClass(value: string, valueClass: CssValueClass): boolean {
  const compact = value.replace(/\s+/g, "");
  switch (valueClass) {
    case "grid":
      return value.trim() === "grid" || value.trim() === "inline-grid";
    case "flex":
      return /(^|\s)flex(-inline)?$/.test(value.trim());
    case "flex-wrap":
      return value.trim() === "flex-wrap" || value.trim() === "wrap" || value.trim() === "wrap-reverse";
    case "wrap":
      return /wrap/.test(value);
    case "fr":
      return /\d*\.?\d+fr\b/.test(compact);
    case "minmax":
      return /minmax\(/.test(compact);
    case "auto-fit":
      return /(auto-fit|auto-fill)/.test(compact);
    case "relative-length":
      return /(rem|em|ch|ex|vw|vh|vmin|vmax|%)/.test(compact);
    case "percentage":
      return /%/.test(compact);
    case "border-box":
      return compact === "border-box";
    case "line-height":
      return /\d/.test(compact) && !/^(0)$/.test(compact);
    case "font-size":
      return /\d/.test(compact);
    case "gap":
      return /\d/.test(compact);
    case "outline":
      return /(solid|dashed|dotted|double|auto|\d+px)/.test(compact);
    case "padding":
      return /\d/.test(compact);
    case "margin":
      return /\d/.test(compact);
    case "border":
      return /\d/.test(compact) || /(solid|dashed|dotted|double)/.test(compact);
    case "custom-property":
      return /var\(\s*--/.test(compact);
    default:
      return false;
  }
}

export function minWidthOf(sheet: StyleSheet): number[] {
  const widths: number[] = [];
  for (const rule of sheet.rules) {
    if (!rule.media) continue;
    const match = /min-width\s*:\s*(\d+(?:\.\d+)?)(px|em|rem)?/.exec(rule.media);
    if (match) widths.push(Number(match[1]));
  }
  return widths;
}

export function varUsageCount(sheet: StyleSheet): number {
  return sheet.rules.reduce(
    (total, rule) => total + rule.declarations.filter((declaration) => /var\(\s*--/.test(declaration.value)).length,
    0,
  );
}

export function gridTrackCount(sheet: StyleSheet): number {
  let best = 0;
  for (const rule of sheet.rules) {
    for (const declaration of rule.declarations) {
      if (declaration.property !== "grid-template-columns") continue;
      const repeat = /repeat\(\s*(\d+)/.exec(declaration.value);
      if (repeat) best = Math.max(best, Number(repeat[1]));
      else best = Math.max(best, declaration.value.split(/\s+/).filter((part) => part.length > 0).length);
      if (/auto-fit|auto-fill/.test(declaration.value)) best = Math.max(best, 2);
    }
  }
  return best;
}

/* Long lines are a real phone-screen problem: an unwrapped code block widens the whole
 * document. A fluid width, a percentage or a min() keeps it inside the viewport. */
export function isFluidWidth(value: string): boolean {
  const compact = value.replace(/\s+/g, "");
  return /(min\(|max\(|clamp\(|%)/.test(compact) || /calc\(/.test(compact);
}
