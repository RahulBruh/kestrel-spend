import { describe, expect, test } from "bun:test";

import { fuzzyScore } from "../src/features/console/fuzzy";
import { applyOps, effectiveOps, inverseOf } from "../src/lib/ledger/edits";
import { generateLedger, MERCHANTS } from "../src/lib/ledger/generate";
import { LEDGER_SEED, RECEIPT_MISSING } from "../src/lib/ledger/model";
import type { LedgerColumns } from "../src/lib/ledger/model";
import { EMPTY_FILTER, runQuery } from "../src/lib/ledger/query";
import { parseQuery } from "../src/lib/ledger/query-language";

const N = 50_000;
const base = () => generateLedger(LEDGER_SEED, N);

function snapshot(c: LedgerColumns) {
  return {
    category: Array.from(c.category),
    dept: Array.from(c.dept),
    flagged: Array.from(c.flagged),
    memo: [...c.memo.entries()].sort((a, b) => a[0] - b[0]),
    receipt: Array.from(c.receipt),
  };
}

describe("generateLedger", () => {
  test("is deterministic for a seed", () => {
    const a = base();
    const b = base();
    expect(Array.from(a.amount.subarray(0, 500))).toEqual(Array.from(b.amount.subarray(0, 500)));
    expect(a.n).toBe(N);
  });
  test("rows are sorted by day", () => {
    const c = base();
    for (let i = 1; i < c.n; i++) expect(c.day[i] >= c.day[i - 1]).toBe(true);
  });
});

describe("query language", () => {
  test("parses fields, amounts and dates", () => {
    const { filter, tokens } = parseQuery('cat:travel,meals dept:eng >500 <2k is:missing in:2026-03 "blue bottle"');
    expect(filter.categories).toEqual([2, 4]);
    expect(filter.depts).toEqual([0]);
    expect(filter.min).toBe(50001);
    expect(filter.max).toBe(199999);
    expect(filter.receipt).toBe(RECEIPT_MISSING);
    expect(filter.from).not.toBeNull();
    expect(filter.terms).toEqual(["blue bottle"]);
    expect(tokens.every((t) => t.kind !== "error")).toBe(true);
  });
  test("flags unknown values as errors with spans", () => {
    const { tokens } = parseQuery("cat:spaceships");
    expect(tokens[0]).toMatchObject({ end: 14, kind: "error", start: 0 });
  });
});

describe("runQuery", () => {
  test("matches a naive filter exactly", () => {
    const c = base();
    const { filter } = parseQuery("cat:cloud >1000");
    const { indices, agg } = runQuery(c, { dir: "desc", filter, sort: "amount" });
    const naive: number[] = [];
    for (let i = 0; i < c.n; i++) if (c.category[i] === 1 && c.amount[i] > 100000) naive.push(i);
    expect(agg.count).toBe(naive.length);
    expect([...indices].sort((a, b) => a - b)).toEqual(naive);
    for (let k = 1; k < indices.length; k++) expect(c.amount[indices[k - 1]] >= c.amount[indices[k]]).toBe(true);
  });
  test("text terms match merchant names", () => {
    const c = base();
    const { indices } = runQuery(c, { dir: "asc", filter: { ...EMPTY_FILTER, terms: ["blue bottle"] }, sort: "day" });
    expect(indices.length).toBeGreaterThan(0);
    for (const i of indices) expect(MERCHANTS[c.merchant[i]].name).toBe("Blue Bottle");
  });
});

describe("edits", () => {
  test("inverse restores the exact prior state, including overlapping ops", () => {
    const c = base();
    const before = snapshot(c);
    const ops = [
      { field: "category" as const, ids: [1, 2, 3, 4, 5], value: 9 },
      { field: "category" as const, ids: [3, 4, 5, 6], value: 2 },
      { field: "memo" as const, ids: [7, 8], value: "Offsite" },
      { field: "flagged" as const, ids: [1, 9], value: 1 },
    ];
    const eff = effectiveOps(c, ops);
    const inverse = inverseOf(c, eff);
    applyOps(c, eff);
    expect(c.category[4]).toBe(2);
    applyOps(c, inverse);
    expect(snapshot(c)).toEqual(before);
  });
  test("no-op edits are dropped before they reach the log", () => {
    const c = base();
    const same = c.category[10];
    expect(effectiveOps(c, [{ field: "category", ids: [10], value: same }])).toEqual([]);
  });
});

describe("fuzzyScore", () => {
  test("prefers word starts and rejects non-subsequences", () => {
    expect(fuzzyScore("sct", "Set category: Travel")).not.toBeNull();
    expect(fuzzyScore("zzz", "Set category: Travel")).toBeNull();
    const hit = fuzzyScore("trav", "Set category: Travel")!;
    expect(hit.hits).toEqual([14, 15, 16, 17]);
    const exact = fuzzyScore("undo", "Undo")!.score;
    const scattered = fuzzyScore("undo", "Mark receipt matched under duo")!.score;
    expect(exact).toBeGreaterThan(scattered);
  });
});
