// Kestrel ledger model: static reference tables, formatting, and the
// column-oriented storage shape shared by the worker and the main thread.

export const CATEGORIES = [
  { id: "software", label: "Software" },
  { id: "cloud", label: "Cloud" },
  { id: "travel", label: "Travel" },
  { id: "lodging", label: "Lodging" },
  { id: "meals", label: "Meals" },
  { id: "office", label: "Office" },
  { id: "advertising", label: "Advertising" },
  { id: "hardware", label: "Hardware" },
  { id: "contractors", label: "Contractors" },
  { id: "events", label: "Events" },
] as const;

export const DEPARTMENTS = [
  { id: "eng", label: "Engineering" },
  { id: "design", label: "Design" },
  { id: "sales", label: "Sales" },
  { id: "marketing", label: "Marketing" },
  { id: "ops", label: "Operations" },
  { id: "finance", label: "Finance" },
  { id: "people", label: "People" },
] as const;

export const RECEIPT_STATES = [
  { id: "none", label: "Not required" },
  { id: "matched", label: "Matched" },
  { id: "missing", label: "Missing" },
] as const;

export const RECEIPT_NONE = 0;
export const RECEIPT_MATCHED = 1;
export const RECEIPT_MISSING = 2;

export const LEDGER_SIZE = 50_000;
export const LEDGER_SEED = 0x6b657374;
/** Epoch day (UTC) of Nov 1, 2025: day 0 of the fiscal year. */
export const DAY0 = Date.UTC(2025, 10, 1) / 86_400_000;
export const DAYS = 365;
export const MONTHS = 12;
export const MONTH_LABELS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];

export interface Merchant {
  name: string;
  category: number;
  /** Typical charge in dollars. */
  median: number;
  /** Log-normal spread. */
  sigma: number;
  /** Relative frequency inside its category. */
  weight: number;
}

export interface Holder {
  name: string;
  dept: number;
  last4: string;
}

/** Struct-of-arrays storage: 50k rows cost about 700 KB and filter in a few ms. */
export interface LedgerColumns {
  n: number;
  day: Uint16Array;
  merchant: Uint16Array;
  amount: Int32Array;
  category: Uint8Array;
  dept: Uint8Array;
  holder: Uint16Array;
  receipt: Uint8Array;
  flagged: Uint8Array;
  memo: Map<number, string>;
}

export type EditField = "category" | "dept" | "receipt" | "flagged" | "memo";

export interface EditOp {
  ids: number[];
  field: EditField;
  value: number | string;
}

const dayFormat = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});
const shortDayFormat = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const money = new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" });
const compactMoney = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 1,
  notation: "compact",
  style: "currency",
});
const count = new Intl.NumberFormat("en-US");

export function dayToDate(day: number): Date {
  return new Date((DAY0 + day) * 86_400_000);
}

export function formatDay(day: number, short = false): string {
  return (short ? shortDayFormat : dayFormat).format(dayToDate(day));
}

export function isoDay(day: number): string {
  return dayToDate(day).toISOString().slice(0, 10);
}

export function monthOfDay(day: number): number {
  const d = dayToDate(day);
  return (d.getUTCFullYear() - 2025) * 12 + d.getUTCMonth() - 10;
}

export function formatMoney(cents: number, compact = false): string {
  return (compact ? compactMoney : money).format(cents / 100);
}

export function formatCount(n: number): string {
  return count.format(n);
}

/** "2026-03" -> first (or last) day of March; "2026-03-14" -> that day. */
export function dayFromIso(value: string, end: boolean): number | null {
  const m = /^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/.exec(value);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  if (mo < 0 || mo > 11) return null;
  let ms: number;
  if (m[3]) {
    ms = Date.UTC(y, mo, Number(m[3]));
  } else {
    ms = end ? Date.UTC(y, mo + 1, 0) : Date.UTC(y, mo, 1);
  }
  return Math.round(ms / 86_400_000) - DAY0;
}

export function categoryIndex(token: string): number {
  const t = token.toLowerCase();
  return CATEGORIES.findIndex((c) => c.id.startsWith(t) || c.label.toLowerCase().startsWith(t));
}

export function deptIndex(token: string): number {
  const t = token.toLowerCase();
  return DEPARTMENTS.findIndex((d) => d.id.startsWith(t) || d.label.toLowerCase().startsWith(t));
}
