/*
 * A structural JavaScript scanner.
 *
 * Learner code is never executed: no eval, no new Function, no VM, no sandbox that
 * could reach the network. Instead the source is tokenised and read structurally, and
 * a requirement asks about a construct rather than about one exact line. That is why
 * "uses a condition and shows the result" can be satisfied by an if/else, a ternary
 * or a guard clause written in the learner's own style.
 *
 * The scanner is deliberately conservative. Where it cannot be sure, a check reports
 * that the requirement needs verification instead of guessing.
 */

export type JsTokenType = "word" | "number" | "string" | "template" | "punct" | "regex";

export type JsToken = {
  type: JsTokenType;
  value: string;
  start: number;
  end: number;
};

export type JsFunction = {
  name: string | null;
  params: string[];
  isAsync: boolean;
  expressionBody: boolean;
  body: number[];
};

export type JsCall = {
  path: string;
  method: string;
  literals: string[];
  args: number[][];
  tokenIndex: number;
};

export type JsFacts = {
  tokens: JsToken[];
  problems: number;
  functions: JsFunction[];
  arrows: JsFunction[];
  calls: JsCall[];
  assignments: Array<{ path: string; operator: string; tokenIndex: number; right: number[] }>;
  keywords: Record<string, number>;
  comparisons: { strict: number; loose: number };
  ternary: number;
  arrayLiterals: number;
  objectLiterals: number;
  spread: number;
  innerHtml: number;
  eval: number;
  documentWrite: number;
  newFunction: number;
  eventListeners: string[];
  preventDefault: number;
  createElement: string[];
  append: number;
  storage: Array<{ method: string; key: string | null }>;
  literals: string[];
  stringLiterals: number;
  numberLiterals: number;
  propertyAssignments: string[];
  updateExpressions: number;
};

const KEYWORDS = [
  "if", "else", "return", "function", "const", "let", "var", "try", "catch", "finally",
  "await", "async", "new", "typeof", "switch", "case", "for", "while", "do", "break",
  "continue", "throw", "class", "delete", "in", "of", "instanceof", "yield", "void",
];

/* Characters that can end an expression. A slash after one of these is division, not
 * the start of a regular expression. */
const EXPRESSION_END = new Set([")", "]", "}"]);

export function tokenizeJs(source: string): { tokens: JsToken[]; problems: number } {
  const tokens: JsToken[] = [];
  let problems = 0;
  let index = 0;

  const previousMeaningful = () => tokens[tokens.length - 1];

  while (index < source.length) {
    const character = source[index];

    if (/\s/.test(character)) {
      index += 1;
      continue;
    }
    if (character === "/" && source[index + 1] === "/") {
      const end = source.indexOf("\n", index);
      index = end < 0 ? source.length : end + 1;
      continue;
    }
    if (character === "/" && source[index + 1] === "*") {
      const end = source.indexOf("*/", index + 2);
      index = end < 0 ? source.length : end + 2;
      continue;
    }
    if (character === "/") {
      const previous = previousMeaningful();
      const isDivision = previous
        && (previous.type === "word" && !KEYWORDS.includes(previous.value)
          || previous.type === "number"
          || previous.type === "string"
          || previous.type === "template"
          || (previous.type === "punct" && EXPRESSION_END.has(previous.value)));
      if (!isDivision) {
        let cursor = index + 1;
        let inClass = false;
        while (cursor < source.length) {
          const current = source[cursor];
          if (current === "\\") {
            cursor += 2;
            continue;
          }
          if (current === "[") inClass = true;
          else if (current === "]") inClass = false;
          else if (current === "/" && !inClass) break;
          else if (current === "\n") break;
          cursor += 1;
        }
        tokens.push({ type: "regex", value: source.slice(index, cursor + 1), start: index, end: cursor + 1 });
        index = cursor + 1;
        continue;
      }
    }
    if (character === '"' || character === "'") {
      let cursor = index + 1;
      let closed = false;
      while (cursor < source.length) {
        if (source[cursor] === "\\") {
          cursor += 2;
          continue;
        }
        if (source[cursor] === character) {
          closed = true;
          break;
        }
        if (source[cursor] === "\n") break;
        cursor += 1;
      }
      if (!closed) problems += 1;
      tokens.push({ type: "string", value: source.slice(index + 1, cursor), start: index, end: cursor + 1 });
      index = cursor + 1;
      continue;
    }
    if (character === "`") {
      let cursor = index + 1;
      let depth = 0;
      let closed = false;
      while (cursor < source.length) {
        const current = source[cursor];
        if (current === "\\") {
          cursor += 2;
          continue;
        }
        if (current === "$" && source[cursor + 1] === "{") {
          depth += 1;
          cursor += 2;
          continue;
        }
        if (current === "}" && depth > 0) {
          depth -= 1;
          cursor += 1;
          continue;
        }
        if (current === "`" && depth === 0) {
          closed = true;
          break;
        }
        cursor += 1;
      }
      if (!closed) problems += 1;
      const raw = source.slice(index, cursor + 1);
      tokens.push({ type: "template", value: raw, start: index, end: cursor + 1 });
      index = cursor + 1;
      /* A template with substitutions is read as its inner expressions too, so a
       * requirement about a comparison or a call inside one is still seen. */
      continue;
    }
    if (/[0-9]/.test(character)) {
      let cursor = index;
      while (cursor < source.length && /[0-9._a-zA-Z]/.test(source[cursor])) cursor += 1;
      tokens.push({ type: "number", value: source.slice(index, cursor), start: index, end: cursor });
      index = cursor;
      continue;
    }
    if (/[A-Za-z_$]/.test(character)) {
      let cursor = index;
      while (cursor < source.length && /[A-Za-z0-9_$]/.test(source[cursor])) cursor += 1;
      tokens.push({ type: "word", value: source.slice(index, cursor), start: index, end: cursor });
      index = cursor;
      continue;
    }
    const three = source.slice(index, index + 3);
    const two = source.slice(index, index + 2);
    if (["===", "!==", "**=", ">>>", "&&=", "||=", "??=", "..."].includes(three)) {
      tokens.push({ type: "punct", value: three, start: index, end: index + 3 });
      index += 3;
      continue;
    }
    if (["==", "!=", "<=", ">=", "=>", "&&", "||", "??", "++", "--", "+=", "-=", "*=", "/=", "?.", "**"].includes(two)) {
      tokens.push({ type: "punct", value: two, start: index, end: index + 2 });
      index += 2;
      continue;
    }
    tokens.push({ type: "punct", value: character, start: index, end: index + 1 });
    index += 1;
  }

  return { tokens, problems };
}

function bracketMap(tokens: JsToken[]): Map<number, number> {
  const pairs = new Map<number, number>();
  const stack: Array<{ index: number; open: string }> = [];
  const closing: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  tokens.forEach((token, index) => {
    if (token.type !== "punct") return;
    if (token.value === "(" || token.value === "[" || token.value === "{") stack.push({ index, open: token.value });
    else if (closing[token.value]) {
      const last = stack[stack.length - 1];
      if (last && last.open === closing[token.value]) {
        stack.pop();
        pairs.set(last.index, index);
        pairs.set(index, last.index);
      }
    }
  });
  return pairs;
}

/* The dotted path of a callee or assignment target, read backwards from its position. */
function pathBefore(tokens: JsToken[], index: number): string {
  const parts: string[] = [];
  let cursor = index - 1;
  if (cursor < 0) return "";
  if (tokens[cursor].value === ")" || tokens[cursor].value === "]") {
    /* A computed or called callee cannot be named reliably. */
    return "";
  }
  while (cursor >= 0) {
    const token = tokens[cursor];
    if (token.type === "word") {
      parts.unshift(token.value);
      cursor -= 1;
      if (tokens[cursor]?.value === ".") {
        cursor -= 1;
        continue;
      }
      if (tokens[cursor]?.value === "?.") {
        cursor -= 1;
        continue;
      }
      break;
    }
    break;
  }
  return parts.join(".");
}

function splitArguments(tokens: JsToken[], map: Map<number, number>, open: number, close: number): number[][] {
  const groups: number[][] = [];
  let current: number[] = [];
  let depth = 0;
  for (let index = open + 1; index < close; index += 1) {
    const token = tokens[index];
    if (token.type === "punct" && "([{".includes(token.value)) {
      depth += 1;
      current.push(index);
      continue;
    }
    if (token.type === "punct" && ")]}".includes(token.value)) {
      depth -= 1;
      current.push(index);
      continue;
    }
    if (token.type === "punct" && token.value === "," && depth === 0) {
      groups.push(current);
      current = [];
      continue;
    }
    current.push(index);
  }
  if (current.length > 0) groups.push(current);
  void map;
  return groups;
}

function literalsIn(tokens: JsToken[], range: number[]): string[] {
  return range
    .map((index) => tokens[index])
    .filter((token) => token && (token.type === "string" || token.type === "number"))
    .map((token) => token.value);
}

export function scanJs(source: string): JsFacts {
  const { tokens, problems } = tokenizeJs(source);
  const map = bracketMap(tokens);
  const facts: JsFacts = {
    tokens,
    problems: map.size === 0 && tokens.length > 0 ? problems + 1 : problems,
    functions: [],
    arrows: [],
    calls: [],
    assignments: [],
    keywords: {},
    comparisons: { strict: 0, loose: 0 },
    ternary: 0,
    arrayLiterals: 0,
    objectLiterals: 0,
    spread: 0,
    innerHtml: 0,
    eval: 0,
    documentWrite: 0,
    newFunction: 0,
    eventListeners: [],
    preventDefault: 0,
    createElement: [],
    append: 0,
    storage: [],
    literals: [],
    stringLiterals: 0,
    numberLiterals: 0,
    propertyAssignments: [],
    updateExpressions: 0,
  };

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (token.type === "word" && KEYWORDS.includes(token.value)) {
      facts.keywords[token.value] = (facts.keywords[token.value] || 0) + 1;
    }

    if (token.type === "string" || token.type === "number") facts.literals.push(token.value);
    if (token.type === "string") facts.stringLiterals += 1;
    if (token.type === "number") facts.numberLiterals += 1;

    if (token.type === "punct" && token.value === "?") facts.ternary += 1;

    if (token.type === "punct" && token.value === "...") facts.spread += 1;

    if (token.type === "punct" && (token.value === "++" || token.value === "--")) facts.updateExpressions += 1;

    if (token.type === "punct" && (token.value === "{" || token.value === "[")) {
      const close = map.get(index);
      const previous = tokens[index - 1];
      const isBlock = token.value === "{"
        && (!previous || [")", "else", "try", "finally", "do", "=>", ";", "{"].includes(previous.value)
          || (previous.type === "word" && ["else", "try", "finally", "do"].includes(previous.value)));
      if (token.value === "[") facts.arrayLiterals += 1;
      else if (!isBlock) facts.objectLiterals += 1;
      void close;
    }

    if (token.type === "word" && token.value === "function") {
      let cursor = index + 1;
      let name: string | null = null;
      if (tokens[cursor]?.type === "word" && !KEYWORDS.includes(tokens[cursor].value)) {
        name = tokens[cursor].value;
        cursor += 1;
      }
      if (tokens[cursor]?.value === "(") {
        const close = map.get(cursor);
        if (close !== undefined) {
          const params = splitArguments(tokens, map, cursor, close).map((range) => range.map((at) => tokens[at].value).join(""));
          const bodyOpen = close + 1;
          const bodyClose = tokens[bodyOpen]?.value === "{" ? map.get(bodyOpen) : undefined;
          const body: number[] = [];
          if (bodyClose !== undefined) {
            for (let at = bodyOpen + 1; at < bodyClose; at += 1) body.push(at);
          }
          facts.functions.push({
            name,
            params,
            isAsync: tokens[index - 1]?.value === "async",
            expressionBody: false,
            body,
          });
        }
      }
    }

    if (token.type === "punct" && token.value === "=>") {
      const previous = tokens[index - 1];
      let params: string[] = [];
      if (previous?.value === ")") {
        const open = map.get(index - 1);
        if (open !== undefined) {
          params = splitArguments(tokens, map, open, index - 1).map((range) => range.map((at) => tokens[at].value).join(""));
        }
      } else if (previous?.type === "word") {
        params = [previous.value];
      }
      const body: number[] = [];
      const bodyOpen = index + 1;
      const braces = tokens[bodyOpen]?.value === "{";
      if (braces) {
        const close = map.get(bodyOpen);
        if (close !== undefined) {
          for (let at = bodyOpen + 1; at < close; at += 1) body.push(at);
        }
      } else {
        for (let at = bodyOpen; at < tokens.length && tokens[at].value !== ";" && tokens[at].value !== ","; at += 1) body.push(at);
      }
      facts.arrows.push({ name: null, params, isAsync: false, expressionBody: !braces, body });
    }

    if (token.type === "punct" && token.value === "(") {
      const close = map.get(index);
      if (close === undefined) continue;
      const path = pathBefore(tokens, index);
      if (path.length === 0) continue;
      const groups = splitArguments(tokens, map, index, close);
      const call: JsCall = {
        path,
        method: path.split(".").pop() || path,
        literals: groups.flatMap((range) => literalsIn(tokens, range)),
        args: groups,
        tokenIndex: index,
      };
      facts.calls.push(call);

      if (call.method === "addEventListener") facts.eventListeners.push(call.literals[0] || "");
      if (call.method === "preventDefault") facts.preventDefault += 1;
      if (call.method === "createElement") facts.createElement.push(call.literals[0] || "");
      if (call.method === "append" || call.method === "appendChild") facts.append += 1;
      if (call.method === "setItem" || call.method === "getItem" || call.method === "removeItem") {
        if (/^(localStorage|sessionStorage)/.test(path)) facts.storage.push({ method: call.method, key: call.literals[0] ?? null });
      }
      if (call.method === "eval") facts.eval += 1;
      if (call.method === "write" && /^document\./.test(path)) facts.documentWrite += 1;
      if (call.method === "Function" && tokens[index - 1]?.value === "new") facts.newFunction += 1;
      continue;
    }

    if (token.type === "punct" && (token.value === "=" || token.value === "+=" || token.value === "-=" || token.value === "||=" || token.value === "??=")) {
      const path = pathBefore(tokens, index);
      if (path.length === 0) continue;
      const right: number[] = [];
      for (let at = index + 1; at < tokens.length && tokens[at].value !== ";"; at += 1) right.push(at);
      facts.assignments.push({ path, operator: token.value, tokenIndex: index, right });
      const property = path.split(".").pop() || path;
      if (path.includes(".")) facts.propertyAssignments.push(property);
      if (property === "innerHTML" || path.endsWith(".innerHTML")) facts.innerHtml += 1;
      if (property === "outerHTML") facts.innerHtml += 1;
      if (property === "write" && path === "document") facts.documentWrite += 1;
      continue;
    }

    if (token.type === "punct" && (token.value === "==" || token.value === "!=")) facts.comparisons.loose += 1;
    if (token.type === "punct" && (token.value === "===" || token.value === "!==")) facts.comparisons.strict += 1;
  }

  return facts;
}

export function callCount(facts: JsFacts, method: string): number {
  return facts.calls.filter((call) => call.method === method).length;
}

export function functionsWithParams(facts: JsFacts, minimum: number): number {
  const all = [...facts.functions, ...facts.arrows];
  return all.filter((entry) => entry.params.filter((param) => param.length > 0).length >= minimum).length;
}

export function functionCount(facts: JsFacts): number {
  return facts.functions.length + facts.arrows.length;
}

/*
 * A callback that does real work: it either returns a comparison, or returns a value
 * derived from the item it was given. The check never demands a particular property
 * name, so any consistent data model passes.
 */
export function callbacksOf(facts: JsFacts, method: string): Array<{ body: number[]; comparison: boolean; hasReturn: boolean }> {
  const results: Array<{ body: number[]; comparison: boolean; hasReturn: boolean }> = [];
  for (const call of facts.calls) {
    if (call.method !== method) continue;
    const group = call.args[call.args.length - 1];
    if (!group || group.length === 0) continue;
    const candidates = [...facts.functions, ...facts.arrows].filter(
      (entry) => entry.body.length > 0 && group.includes(entry.body[0]),
    );
    const bodies: Array<{ body: number[]; expressionBody: boolean }> = candidates.length > 0
      ? candidates.map((entry) => ({ body: entry.body, expressionBody: entry.expressionBody }))
      : [{ body: group, expressionBody: false }];
    for (const entry of bodies) {
      const tokens = entry.body.map((at) => facts.tokens[at]).filter(Boolean);
      results.push({
        body: entry.body,
        comparison: tokens.some((token) => ["===", "!==", "==", "!=", ">", "<", ">=", "<="].includes(token.value)),
        hasReturn: entry.expressionBody || tokens.some((token) => token.type === "word" && token.value === "return"),
      });
    }
  }
  return results;
}

/* The taught pattern for ignoring a stale asynchronous result: a counter is advanced
 * before the request, captured, compared after the await, and the comparison guards a
 * return. Names are never required. */
export function hasStaleResultGuard(facts: JsFacts): boolean {
  const advanced = facts.tokens.some((token, index) => token.value === "++" && facts.tokens[index + 1]?.type === "word")
    || facts.updateExpressions > 0
    || facts.assignments.some((entry) => entry.operator === "+=" && /1/.test(entry.right.map((at) => facts.tokens[at]?.value).join("")));
  if (!advanced) return false;
  const captured = facts.assignments.some((entry) => {
    const right = entry.right.map((at) => facts.tokens[at]?.value).join("");
    return /(^|\W)(\+\+|\+\s*1)/.test(right) || /\+=\s*1/.test(right);
  });
  const compared = facts.tokens.some((token) => token.value === "!==" || token.value === "!=");
  const guard = facts.tokens.some((token, index) => token.value === "return" && facts.tokens[index - 1]?.value !== "(");
  const insideConditional = facts.keywords.if !== undefined && facts.keywords.if > 0;
  return captured && compared && guard && insideConditional && facts.keywords.await !== undefined;
}

export function usesElementSafely(facts: JsFacts): boolean {
  return facts.createElement.length > 0 && facts.append > 0;
}