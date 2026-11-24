// The query engine. Runs inside the Web Worker: one tight pass over the
// typed-array columns to filter and aggregate, then an index sort. The result
// is a Uint32Array of row ids, transferred to the main thread without a copy.

import { CATEGORIES, DEPARTMENTS, MONTHS, monthOfDay, RECEIPT_MISSING } from "./model";
import type { LedgerColumns } from "./model";
import { HOLDERS, MERCHANTS } from "./generate";

export interface Filter {
  terms: string[];
  categories: number[];
  depts: number[];
  receipt: number | null;
  flagged: boolean | null;
  min: number | null;
  max: number | null;
  from: number | null;
  to: number | null;
}

export const EMPTY_FILTER: Filter = {
  categories: [],
  depts: [],
  flagged: null,
  from: null,
  max: null,
  min: null,
  receipt: null,
  terms: [],
  to: null,
};

export const SORT_KEYS = ["day", "merchant", "category", "dept", "holder", "receipt", "amount"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type SortDir = "asc" | "desc";

export interface QueryRequest {
  filter: Filter;
  sort: SortKey;
  dir: SortDir;
}

export interface Aggregates {
  count: number;
  total: number;
  missing: number;
  flagged: number;
  /** Spend per fiscal month for rows in view. */
  months: number[];
  /** Spend per department per month for the whole ledger (budgets). */
  deptMonths: number[][];
}

const merchantRank = rankBy(MERCHANTS.map((m) => m.name));
const holderRank = rankBy(HOLDERS.map((h) => h.name));
const categoryRank = rankBy(CATEGORIES.map((c) => c.label));
const deptRank = rankBy(DEPARTMENTS.map((d) => d.label));
const merchantLower = MERCHANTS.map((m) => m.name.toLowerCase());
const holderLower = HOLDERS.map((h) => h.name.toLowerCase());
const categoryLower = CATEGORIES.map((c) => c.label.toLowerCase());
const deptLower = DEPARTMENTS.map((d) => d.label.toLowerCase());

function rankBy(names: string[]): Uint16Array {
  const order = names.map((name, i) => ({ i, name })).sort((a, b) => a.name.localeCompare(b.name));
  const rank = new Uint16Array(names.length);
  order.forEach(({ i }, r) => {
    rank[i] = r;
  });
  return rank;
}

/** Month index of every day, computed once. */
const dayMonth = (() => {
  const out = new Uint8Array(400);
  for (let d = 0; d < out.length; d++) out[d] = Math.min(MONTHS - 1, Math.max(0, monthOfDay(d)));
  return out;
})();

export function runQuery(cols: LedgerColumns, req: QueryRequest): { indices: Uint32Array; agg: Aggregates } {
  const { filter } = req;
  const n = cols.n;
  const catMask = filter.categories.length ? maskOf(filter.categories, 16) : null;
  const deptMask = filter.depts.length ? maskOf(filter.depts, 16) : null;
  const termHits = filter.terms.map((term) => ({
    category: Uint8Array.from(categoryLower, (s) => (s.includes(term) ? 1 : 0)),
    dept: Uint8Array.from(deptLower, (s) => (s.includes(term) ? 1 : 0)),
    holder: Uint8Array.from(holderLower, (s) => (s.includes(term) ? 1 : 0)),
    merchant: Uint8Array.from(merchantLower, (s) => (s.includes(term) ? 1 : 0)),
    term,
  }));
  const min = filter.min ?? -Infinity;
  const max = filter.max ?? Infinity;
  const from = filter.from ?? -Infinity;
  const to = filter.to ?? Infinity;
  const wantFlag = filter.flagged === null ? -1 : filter.flagged ? 1 : 0;

  const out = new Uint32Array(n);
  let k = 0;
  let total = 0;
  let missing = 0;
  let flagged = 0;
  const months = new Array<number>(MONTHS).fill(0);
  const deptMonths = DEPARTMENTS.map(() => new Array<number>(MONTHS).fill(0));

  for (let i = 0; i < n; i++) {
    const amount = cols.amount[i];
    const day = cols.day[i];
    const month = dayMonth[day];
    deptMonths[cols.dept[i]][month] += amount;

    if (amount < min || amount > max) continue;
    if (day < from || day > to) continue;
    if (catMask && !catMask[cols.category[i]]) continue;
    if (deptMask && !deptMask[cols.dept[i]]) continue;
    if (filter.receipt !== null && cols.receipt[i] !== filter.receipt) continue;
    if (wantFlag !== -1 && cols.flagged[i] !== wantFlag) continue;
    if (termHits.length) {
      let ok = true;
      for (const hit of termHits) {
        if (hit.merchant[cols.merchant[i]] || hit.holder[cols.holder[i]] || hit.category[cols.category[i]] || hit.dept[cols.dept[i]]) continue;
        const memo = cols.memo.get(i);
        if (memo && memo.toLowerCase().includes(hit.term)) continue;
        ok = false;
        break;
      }
      if (!ok) continue;
    }
    out[k++] = i;
    total += amount;
    months[month] += amount;
    if (cols.receipt[i] === RECEIPT_MISSING) missing++;
    if (cols.flagged[i]) flagged++;
  }

  const indices = out.slice(0, k);
  sortIndices(cols, indices, req.sort, req.dir);
  return { agg: { count: k, deptMonths, flagged, missing, months, total }, indices };
}

function maskOf(values: number[], size: number): Uint8Array {
  const mask = new Uint8Array(size);
  for (const v of values) mask[v] = 1;
  return mask;
}

function sortIndices(cols: LedgerColumns, indices: Uint32Array, sort: SortKey, dir: SortDir): void {
  const sign = dir === "asc" ? 1 : -1;
  let key: (i: number) => number;
  switch (sort) {
    case "amount":
      key = (i) => cols.amount[i];
      break;
    case "merchant":
      key = (i) => merchantRank[cols.merchant[i]];
      break;
    case "holder":
      key = (i) => holderRank[cols.holder[i]];
      break;
    case "category":
      key = (i) => categoryRank[cols.category[i]];
      break;
    case "dept":
      key = (i) => deptRank[cols.dept[i]];
      break;
    case "receipt":
      key = (i) => cols.receipt[i];
      break;
    default:
      key = (i) => cols.day[i];
  }
  // Precompute keys once: a typed-array lookup inside the comparator is far
  // cheaper than re-deriving the key on every comparison.
  const keys = new Float64Array(cols.n);
  for (let j = 0; j < indices.length; j++) keys[indices[j]] = key(indices[j]);
  indices.sort((a, b) => sign * (keys[a] - keys[b] || a - b));
}
