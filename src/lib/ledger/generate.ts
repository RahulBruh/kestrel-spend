// Deterministic synthetic ledger. The same seed always yields the same 50,000
// rows, so the server never ships the dataset: each browser rebuilds it in a
// Web Worker and only the visitor's edits travel over the network.

import type { Holder, LedgerColumns, Merchant } from "./model";
import { DAYS, RECEIPT_MATCHED, RECEIPT_MISSING, RECEIPT_NONE } from "./model";

// [name, category index, median $, sigma, weight]
const MERCHANT_TABLE: [string, number, number, number, number][] = [
  ["Figma", 0, 45, 0.15, 3],
  ["Notion", 0, 18, 0.1, 3],
  ["Linear", 0, 16, 0.1, 2],
  ["Slack", 0, 13, 0.1, 3],
  ["GitHub", 0, 21, 0.2, 3],
  ["Atlassian", 0, 70, 0.3, 2],
  ["1Password", 0, 8, 0.1, 1],
  ["Loom", 0, 15, 0.1, 1],
  ["Zoom", 0, 16, 0.15, 2],
  ["Retool", 0, 400, 0.3, 1],
  ["AWS", 1, 4200, 0.45, 4],
  ["Google Cloud", 1, 2600, 0.45, 2],
  ["Vercel", 1, 320, 0.4, 2],
  ["Cloudflare", 1, 250, 0.4, 2],
  ["Snowflake", 1, 3800, 0.5, 1],
  ["Datadog", 1, 1800, 0.35, 2],
  ["Sentry", 1, 260, 0.3, 1],
  ["Delta", 2, 480, 0.45, 3],
  ["United", 2, 430, 0.45, 3],
  ["Alaska Airlines", 2, 320, 0.45, 1],
  ["Uber", 2, 32, 0.55, 8],
  ["Lyft", 2, 28, 0.55, 4],
  ["Amtrak", 2, 140, 0.4, 1],
  ["Hertz", 2, 260, 0.4, 1],
  ["Marriott", 3, 310, 0.4, 3],
  ["Hilton", 3, 290, 0.4, 3],
  ["Hyatt", 3, 340, 0.4, 2],
  ["Airbnb", 3, 520, 0.5, 2],
  ["Sweetgreen", 4, 16, 0.3, 6],
  ["Blue Bottle", 4, 7, 0.3, 5],
  ["DoorDash", 4, 48, 0.6, 5],
  ["Chipotle", 4, 14, 0.3, 4],
  ["Joe's Pizza", 4, 42, 0.5, 2],
  ["Shake Shack", 4, 22, 0.4, 3],
  ["The Smith", 4, 180, 0.5, 2],
  ["Amazon Business", 5, 85, 0.8, 6],
  ["Staples", 5, 60, 0.6, 2],
  ["WeWork", 5, 1200, 0.3, 1],
  ["Uline", 5, 140, 0.6, 1],
  ["Google Ads", 6, 2200, 0.6, 3],
  ["LinkedIn Ads", 6, 1500, 0.55, 2],
  ["Meta Ads", 6, 1800, 0.6, 2],
  ["Reddit Ads", 6, 600, 0.5, 1],
  ["Apple", 7, 1900, 0.5, 3],
  ["Dell", 7, 1400, 0.4, 1],
  ["B&H Photo", 7, 450, 0.6, 1],
  ["Best Buy", 7, 280, 0.6, 1],
  ["Upwork", 8, 900, 0.6, 2],
  ["Toptal", 8, 4200, 0.4, 1],
  ["Deel", 8, 3100, 0.4, 2],
  ["Eventbrite", 9, 240, 0.6, 2],
  ["Luma", 9, 120, 0.5, 1],
  ["Meetup", 9, 90, 0.4, 1],
];

export const MERCHANTS: Merchant[] = MERCHANT_TABLE.map(([name, category, median, sigma, weight]) => ({
  category,
  median,
  name,
  sigma,
  weight,
}));

const FIRST = ["Maya", "Theo", "Priya", "Jonah", "Lena", "Omar", "Sofia", "Wes", "Hana", "Diego", "Ines", "Marcus", "Yuki", "Ada", "Ravi", "Noor", "Felix", "Camila", "Kofi", "Elena", "Sam", "Iris", "Mateo", "Zara", "Tomas", "Leila", "Owen", "Mira", "Arjun", "Bea", "Nico", "Tess", "Kai", "Rosa", "Eli", "Ama", "Hugo", "Lucia", "Dev", "Signe", "Paulo", "Wren"];
const LAST = ["Okafor", "Lindqvist", "Raman", "Brooks", "Tanaka", "Moreau", "Haddad", "Ortiz", "Novak", "Chen", "Abara", "Kowalski", "Silva", "Park", "Mensah", "Ferreira", "Iyer", "Varga", "Duarte", "Holm"];
// Department of each cardholder, engineering-heavy like a real startup.
const HOLDER_DEPTS = [0, 2, 0, 1, 3, 0, 2, 4, 0, 5, 2, 0, 1, 3, 0, 6, 2, 0, 4, 3, 0, 2, 1, 0, 5, 2, 0, 3, 0, 4, 2, 0, 1, 6, 0, 2, 3, 0, 4, 5, 0, 2];

export const HOLDERS: Holder[] = FIRST.map((first, i) => ({
  dept: HOLDER_DEPTS[i % HOLDER_DEPTS.length],
  last4: String(1000 + ((i * 7919) % 9000)),
  name: `${first} ${LAST[(i * 7) % LAST.length]}`,
}));

// How often each category shows up, and which departments tend to own it.
const CATEGORY_WEIGHT = [14, 7, 16, 6, 22, 10, 6, 5, 4, 5];
const CATEGORY_DEPTS: number[][] = [
  [45, 20, 10, 10, 8, 4, 3],
  [90, 0, 0, 2, 8, 0, 0],
  [12, 4, 48, 16, 10, 4, 6],
  [10, 4, 50, 18, 10, 3, 5],
  [30, 10, 25, 12, 10, 5, 8],
  [20, 10, 10, 10, 35, 5, 10],
  [0, 0, 5, 95, 0, 0, 0],
  [60, 25, 5, 5, 5, 0, 0],
  [55, 25, 0, 15, 5, 0, 0],
  [10, 5, 25, 45, 5, 0, 10],
];

const MEMOS: Record<number, string[]> = {
  2: ["Customer visit", "Conference travel", "Team offsite"],
  3: ["Offsite hotel", "Customer visit"],
  4: ["Team lunch", "Client dinner", "Interview lunch", "Launch dinner"],
  5: ["Desk setup", "Office snacks"],
  7: ["New hire laptop", "Replacement monitor"],
  9: ["Booth fee", "Meetup sponsorship"],
};

/** mulberry32: tiny, fast, good enough for synthetic data. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cumulative(weights: number[]): Float64Array {
  const out = new Float64Array(weights.length);
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    out[i] = sum;
  }
  for (let i = 0; i < out.length; i++) out[i] /= sum;
  return out;
}

function pick(cdf: Float64Array, r: number): number {
  let lo = 0;
  let hi = cdf.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cdf[mid] < r) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function generateLedger(seed: number, n: number): LedgerColumns {
  const rand = rng(seed);
  const gauss = () => {
    const u = 1 - rand();
    const v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  // Days: weekdays busier, spend grows ~30% across the year.
  const dayWeights: number[] = [];
  for (let d = 0; d < DAYS; d++) {
    const weekday = new Date(Date.UTC(2025, 10, 1 + d)).getUTCDay();
    const weekend = weekday === 0 || weekday === 6;
    dayWeights.push((weekend ? 0.35 : 1) * (1 + (0.3 * d) / DAYS));
  }
  const dayCdf = cumulative(dayWeights);
  const catCdf = cumulative(CATEGORY_WEIGHT);
  const deptCdfs = CATEGORY_DEPTS.map((w) => cumulative(w));
  const merchantsByCat = CATEGORY_WEIGHT.map((_, c) =>
    MERCHANTS.map((m, i) => ({ i, m })).filter(({ m }) => m.category === c),
  );
  const merchantCdfs = merchantsByCat.map((list) => cumulative(list.map(({ m }) => m.weight)));
  const holdersByDept = [0, 1, 2, 3, 4, 5, 6].map((d) =>
    HOLDERS.map((h, i) => ({ h, i })).filter(({ h }) => h.dept === d).map(({ i }) => i),
  );

  const rows: { day: number; merchant: number; amount: number; category: number; dept: number; holder: number }[] = [];
  for (let k = 0; k < n; k++) {
    const category = pick(catCdf, rand());
    const mi = merchantsByCat[category][pick(merchantCdfs[category], rand())].i;
    const m = MERCHANTS[mi];
    const dept = pick(deptCdfs[category], rand());
    const pool = holdersByDept[dept];
    const holder = pool[Math.floor(rand() * pool.length)];
    const dollars = Math.max(1.5, m.median * Math.exp(m.sigma * gauss()));
    rows.push({
      amount: Math.round(dollars * 100),
      category,
      day: pick(dayCdf, rand()),
      dept,
      holder,
      merchant: mi,
    });
  }
  rows.sort((a, b) => a.day - b.day);

  const cols: LedgerColumns = {
    amount: new Int32Array(n),
    category: new Uint8Array(n),
    day: new Uint16Array(n),
    dept: new Uint8Array(n),
    flagged: new Uint8Array(n),
    holder: new Uint16Array(n),
    memo: new Map(),
    merchant: new Uint16Array(n),
    n,
    receipt: new Uint8Array(n),
  };
  for (let i = 0; i < n; i++) {
    const r = rows[i];
    cols.day[i] = r.day;
    cols.merchant[i] = r.merchant;
    cols.amount[i] = r.amount;
    cols.category[i] = r.category;
    cols.dept[i] = r.dept;
    cols.holder[i] = r.holder;
    // Receipts are required above $75; about one in seven goes missing.
    cols.receipt[i] = r.amount < 7500 ? RECEIPT_NONE : rand() < 0.86 ? RECEIPT_MATCHED : RECEIPT_MISSING;
    // Policy: meals above $150 per charge get flagged, plus a little noise.
    cols.flagged[i] = (r.category === 4 && r.amount > 15000) || rand() < 0.006 ? 1 : 0;
    const memos = MEMOS[r.category];
    if (memos && rand() < 0.08) cols.memo.set(i, memos[Math.floor(rand() * memos.length)]);
  }
  return cols;
}
