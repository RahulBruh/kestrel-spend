// A tiny query language for the search box, parsed on every keystroke:
//   cat:travel,meals  dept:eng  >500  amount<20  is:flagged  receipt:missing
//   after:2026-03  before:2026-06-15  in:2026-04  "blue bottle"  free text
// Tokens carry their source span so the input can highlight each one.

import { CATEGORIES, DEPARTMENTS, RECEIPT_MATCHED, RECEIPT_MISSING, RECEIPT_NONE, categoryIndex, dayFromIso, deptIndex } from "./model";
import { EMPTY_FILTER } from "./query";
import type { Filter } from "./query";

export type TokenKind = "category" | "dept" | "amount" | "date" | "state" | "text" | "error";

export interface Token {
  start: number;
  end: number;
  raw: string;
  kind: TokenKind;
  /** Human-readable meaning, used for chips and errors. */
  label: string;
}

export interface ParsedQuery {
  filter: Filter;
  tokens: Token[];
}

const SPLIT = /"[^"]*"?|\S+/g;

export function parseQuery(source: string): ParsedQuery {
  const filter: Filter = { ...EMPTY_FILTER, categories: [], depts: [], terms: [] };
  const tokens: Token[] = [];
  for (const match of source.matchAll(SPLIT)) {
    const raw = match[0];
    const start = match.index ?? 0;
    const token = classify(raw, filter);
    tokens.push({ ...token, end: start + raw.length, raw, start });
  }
  return { filter, tokens };
}

function classify(raw: string, filter: Filter): { kind: TokenKind; label: string } {
  const lower = raw.toLowerCase();

  if (lower.startsWith('"')) {
    const phrase = lower.replace(/"/g, "").trim();
    if (!phrase) return { kind: "text", label: "empty phrase" };
    filter.terms.push(phrase);
    return { kind: "text", label: `contains "${phrase}"` };
  }

  const field = /^([a-z]+):(.*)$/.exec(lower);
  if (field) {
    const [, key, value] = field;
    if (!value) return { kind: "error", label: `${key}: needs a value` };
    if (key === "cat" || key === "category") {
      const ids = value.split(",").filter(Boolean).map(categoryIndex);
      if (ids.some((i) => i < 0)) return { kind: "error", label: `unknown category "${value}"` };
      filter.categories.push(...ids);
      return { kind: "category", label: ids.map((i) => CATEGORIES[i].label).join(" or ") };
    }
    if (key === "dept" || key === "team") {
      const ids = value.split(",").filter(Boolean).map(deptIndex);
      if (ids.some((i) => i < 0)) return { kind: "error", label: `unknown department "${value}"` };
      filter.depts.push(...ids);
      return { kind: "dept", label: ids.map((i) => DEPARTMENTS[i].label).join(" or ") };
    }
    if (key === "receipt" || key === "is") {
      if (value === "flagged") {
        filter.flagged = true;
        return { kind: "state", label: "flagged" };
      }
      if (value === "clean" || value === "unflagged") {
        filter.flagged = false;
        return { kind: "state", label: "not flagged" };
      }
      if (value.startsWith("miss")) {
        filter.receipt = RECEIPT_MISSING;
        return { kind: "state", label: "receipt missing" };
      }
      if (value.startsWith("match")) {
        filter.receipt = RECEIPT_MATCHED;
        return { kind: "state", label: "receipt matched" };
      }
      if (value === "none" || value.startsWith("not")) {
        filter.receipt = RECEIPT_NONE;
        return { kind: "state", label: "no receipt needed" };
      }
      return { kind: "error", label: `unknown state "${value}"` };
    }
    if (key === "after" || key === "since" || key === "before" || key === "until" || key === "in") {
      const isEnd = key === "before" || key === "until";
      if (key === "in") {
        const from = dayFromIso(value, false);
        const to = dayFromIso(value, true);
        if (from === null || to === null) return { kind: "error", label: "dates look like 2026-03" };
        filter.from = from;
        filter.to = to;
        return { kind: "date", label: `during ${value}` };
      }
      const day = dayFromIso(value, isEnd);
      if (day === null) return { kind: "error", label: "dates look like 2026-03 or 2026-03-14" };
      if (isEnd) filter.to = day;
      else filter.from = day;
      return { kind: "date", label: `${isEnd ? "on or before" : "on or after"} ${value}` };
    }
    return { kind: "error", label: `unknown field "${key}"` };
  }

  const amount = /^(?:amount|amt)?(>=|<=|>|<)\$?([\d,]*\.?\d+)(k)?$/.exec(lower);
  if (amount) {
    const [, op, digits, k] = amount;
    const cents = Math.round(Number(digits.replace(/,/g, "")) * (k ? 1000 : 1) * 100);
    if (op.startsWith(">")) filter.min = op === ">" ? cents + 1 : cents;
    else filter.max = op === "<" ? cents - 1 : cents;
    return { kind: "amount", label: `amount ${op} $${(cents / 100).toLocaleString("en-US")}` };
  }

  filter.terms.push(lower);
  return { kind: "text", label: `contains "${lower}"` };
}

export interface Suggestion {
  insert: string;
  label: string;
  hint: string;
}

/** Completions for the token under the caret. */
export function suggest(source: string, caret: number): { from: number; to: number; items: Suggestion[] } {
  let from = caret;
  while (from > 0 && !/\s/.test(source[from - 1])) from--;
  let to = caret;
  while (to < source.length && !/\s/.test(source[to])) to++;
  const word = source.slice(from, caret).toLowerCase();

  const fields: Suggestion[] = [
    { hint: "category", insert: "cat:", label: "cat:" },
    { hint: "department", insert: "dept:", label: "dept:" },
    { hint: "flagged, missing, matched", insert: "is:", label: "is:" },
    { hint: "minimum amount", insert: ">", label: ">500" },
    { hint: "month", insert: "in:", label: "in:2026-04" },
    { hint: "start date", insert: "after:", label: "after:2026-03" },
  ];

  let items: Suggestion[] = [];
  const field = /^([a-z]+):([^,]*,)*([^,]*)$/.exec(word);
  if (field) {
    const key = field[1];
    const partial = field[3] ?? "";
    const prefix = word.slice(0, word.length - partial.length);
    if (key === "cat" || key === "category") {
      items = CATEGORIES.filter((c) => c.id.startsWith(partial)).map((c) => ({
        hint: "category",
        insert: `${prefix}${c.id} `,
        label: `${prefix}${c.id}`,
      }));
    } else if (key === "dept" || key === "team") {
      items = DEPARTMENTS.filter((d) => d.id.startsWith(partial) || d.label.toLowerCase().startsWith(partial)).map((d) => ({
        hint: d.label,
        insert: `${prefix}${d.id} `,
        label: `${prefix}${d.id}`,
      }));
    } else if (key === "is" || key === "receipt") {
      items = ["flagged", "missing", "matched", "clean"].filter((s) => s.startsWith(partial)).map((s) => ({
        hint: "state",
        insert: `${key}:${s} `,
        label: `${key}:${s}`,
      }));
    }
  } else if (word.length > 0) {
    items = fields.filter((f) => f.insert.startsWith(word) && f.insert !== word);
  }
  return { from, items: items.slice(0, 8), to };
}
