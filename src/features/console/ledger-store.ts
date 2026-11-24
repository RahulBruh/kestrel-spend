// LedgerStore: the console's state machine, kept outside React so that event
// handlers never read stale closures. React subscribes through
// useSyncExternalStore and re-renders on a single version counter.

import { appendEvents, loadWorkspace, resetWorkspace } from "@/lib/api/ledger.functions";
import type { LedgerEvent } from "@/lib/api/ledger.functions";
import { applyOps, effectiveOps, inverseOf } from "@/lib/ledger/edits";
import { HOLDERS, MERCHANTS } from "@/lib/ledger/generate";
import { CATEGORIES, DEPARTMENTS, LEDGER_SEED, LEDGER_SIZE, RECEIPT_STATES, isoDay } from "@/lib/ledger/model";
import type { EditOp, LedgerColumns } from "@/lib/ledger/model";
import type { Aggregates, QueryRequest } from "@/lib/ledger/query";

import type { WorkerRequest, WorkerResponse } from "./worker-protocol";

export type SaveState = "connecting" | "idle" | "saving" | "saved" | "retrying" | "local" | "full";

interface HistoryEntry {
  label: string;
  ops: EditOp[];
  inverse: EditOp[];
}

type PendingEvent = LedgerEvent;

const WORKSPACE_KEY = "kestrel.workspace";
const BUDGET_FACTORS = [1.08, 1.3, 0.93, 1.12, 1.25, 1.5, 0.96];

function newId(): string {
  return crypto.randomUUID().toLowerCase();
}

export class LedgerStore {
  status: "booting" | "ready" | "error" = "booting";
  cols: LedgerColumns | null = null;
  indices: Uint32Array = new Uint32Array(0);
  agg: Aggregates | null = null;
  queryMs = 0;
  genMs = 0;
  bootMs = 0;
  selection: Uint8Array = new Uint8Array(LEDGER_SIZE);
  selectedCount = 0;
  selectedTotal = 0;
  anchor: number | null = null;
  undoStack: HistoryEntry[] = [];
  redoStack: HistoryEntry[] = [];
  budgets: number[] | null = null;
  save: SaveState = "connecting";
  saveError = "";
  workspace = "";

  private version = 0;
  private listeners = new Set<() => void>();
  private worker: Worker | null = null;
  private reqId = 0;
  private lastQuery: QueryRequest | null = null;
  private pending: PendingEvent[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private retryDelay = 1000;
  private persisted = false;
  private budgetOverrides = new Map<number, number>();
  private bootStart = 0;
  private loadedEvents: LedgerEvent[] | null = null;
  private columnsReady = false;
  private readonly persist: boolean;

  constructor(options: { persist?: boolean } = {}) {
    this.persist = options.persist ?? true;
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  getVersion = () => this.version;

  private emit() {
    this.version++;
    for (const fn of this.listeners) fn();
  }

  start() {
    if (this.worker) return;
    this.bootStart = performance.now();
    this.workspace = this.readWorkspaceId();
    const worker = new Worker(new URL("./ledger.worker.ts", import.meta.url), { type: "module" });
    this.worker = worker;
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => this.onWorkerMessage(event.data);
    worker.onerror = () => {
      this.status = "error";
      this.emit();
    };
    this.post({ seed: LEDGER_SEED, size: LEDGER_SIZE, type: "init" });

    if (!this.persist) {
      this.save = "local";
      this.loadedEvents = [];
      return;
    }
    loadWorkspace({ data: { workspace: this.workspace } })
      .then((res) => {
        this.persisted = res.persisted;
        this.save = res.persisted ? "idle" : "local";
        this.loadedEvents = res.events;
        this.maybeReplay();
      })
      .catch(() => {
        this.persisted = false;
        this.save = "local";
        this.loadedEvents = [];
        this.maybeReplay();
      });
  }

  destroy() {
    this.worker?.terminate();
    this.worker = null;
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = null;
    this.columnsReady = false;
    this.loadedEvents = null;
    this.status = "booting";
  }

  private readWorkspaceId(): string {
    try {
      const existing = window.localStorage.getItem(WORKSPACE_KEY);
      if (existing && /^[a-z0-9-]{8,64}$/.test(existing)) return existing;
      const id = newId();
      window.localStorage.setItem(WORKSPACE_KEY, id);
      return id;
    } catch {
      return newId();
    }
  }

  private post(msg: WorkerRequest) {
    this.worker?.postMessage(msg);
  }

  private onWorkerMessage(msg: WorkerResponse) {
    if (msg.type === "ready") {
      this.cols = msg.columns;
      this.genMs = msg.genMs;
      this.columnsReady = true;
      this.maybeReplay();
      return;
    }
    if (msg.reqId !== this.reqId) return; // a newer query is in flight
    this.indices = msg.indices;
    this.agg = msg.agg;
    this.queryMs = msg.ms;
    if (!this.budgets) this.budgets = this.defaultBudgets(msg.agg);
    if (this.status !== "ready") {
      this.status = "ready";
      this.bootMs = performance.now() - this.bootStart;
    }
    this.emit();
  }

  /** Fold the saved event log over the freshly generated ledger, once both exist. */
  private maybeReplay() {
    if (!this.columnsReady || !this.loadedEvents || !this.cols) return;
    const ops: EditOp[] = [];
    for (const event of this.loadedEvents) {
      if (event.kind === "edit") ops.push(...event.ops);
      else this.budgetOverrides.set(event.dept, event.cents);
    }
    if (ops.length) {
      applyOps(this.cols, ops);
      this.post({ ops, type: "patch" });
    }
    this.loadedEvents = [];
    this.requery();
  }

  private defaultBudgets(agg: Aggregates): number[] {
    return DEPARTMENTS.map((_, d) => {
      const override = this.budgetOverrides.get(d);
      if (override !== undefined) return override;
      const annual = agg.deptMonths[d].reduce((a, b) => a + b, 0);
      const step = 5_000 * 100;
      return Math.max(step, Math.round((annual * BUDGET_FACTORS[d]) / step) * step);
    });
  }

  query(req: QueryRequest) {
    this.lastQuery = req;
    if (this.columnsReady && this.loadedEvents && this.loadedEvents.length === 0) this.requery();
  }

  private requery() {
    if (!this.lastQuery) return;
    this.reqId++;
    this.post({ query: this.lastQuery, reqId: this.reqId, type: "query" });
  }

  // Editing --------------------------------------------------------------

  /** Apply ops optimistically, record undo, persist. Returns rows changed. */
  edit(label: string, ops: EditOp[]): number {
    if (!this.cols) return 0;
    const eff = effectiveOps(this.cols, ops);
    if (!eff.length) return 0;
    const inverse = inverseOf(this.cols, eff);
    this.commit(eff);
    this.undoStack.push({ inverse, label, ops: eff });
    if (this.undoStack.length > 200) this.undoStack.shift();
    this.redoStack = [];
    this.emit();
    return eff.reduce((n, op) => n + op.ids.length, 0);
  }

  undo(): string | null {
    const entry = this.undoStack.pop();
    if (!entry) return null;
    this.commit(entry.inverse);
    this.redoStack.push(entry);
    this.emit();
    return entry.label;
  }

  redo(): string | null {
    const entry = this.redoStack.pop();
    if (!entry) return null;
    this.commit(entry.ops);
    this.undoStack.push(entry);
    this.emit();
    return entry.label;
  }

  private commit(ops: EditOp[]) {
    if (!this.cols) return;
    applyOps(this.cols, ops);
    this.post({ ops, type: "patch" });
    this.requery();
    this.recountSelection();
    this.enqueue({ clientId: newId(), kind: "edit", ops });
  }

  setBudget(dept: number, cents: number) {
    if (!this.budgets) return;
    this.budgets = this.budgets.map((v, i) => (i === dept ? cents : v));
    this.budgetOverrides.set(dept, cents);
    this.enqueue({ cents, clientId: newId(), dept, kind: "budget" });
    this.emit();
  }

  // Persistence ----------------------------------------------------------

  private enqueue(event: PendingEvent) {
    if (!this.persisted) return;
    this.pending.push(event);
    this.save = "saving";
    this.scheduleFlush(350);
  }

  private scheduleFlush(delay: number) {
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => void this.flush(), delay);
  }

  private async flush() {
    this.flushTimer = null;
    if (!this.pending.length) return;
    const batch = this.pending.slice(0, 32);
    try {
      await appendEvents({ data: { events: batch, workspace: this.workspace } });
      this.pending.splice(0, batch.length);
      this.retryDelay = 1000;
      this.save = this.pending.length ? "saving" : "saved";
      if (this.pending.length) this.scheduleFlush(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("full")) {
        this.save = "full";
        this.saveError = message;
        this.pending = [];
      } else {
        this.save = "retrying";
        this.scheduleFlush(this.retryDelay);
        this.retryDelay = Math.min(30_000, this.retryDelay * 2);
      }
    }
    this.emit();
  }

  async reset() {
    try {
      await resetWorkspace({ data: { workspace: this.workspace } });
    } catch {
      // Even if the server is unreachable, a local reset is still useful.
    }
    this.pending = [];
    this.undoStack = [];
    this.redoStack = [];
    this.budgetOverrides.clear();
    this.budgets = null;
    this.clearSelection();
    this.destroy();
    this.status = "booting";
    this.emit();
    this.start();
  }

  // Selection ------------------------------------------------------------

  isSelected(id: number): boolean {
    return this.selection[id] === 1;
  }

  setSelected(ids: Iterable<number>, on: boolean) {
    for (const id of ids) this.selection[id] = on ? 1 : 0;
    this.recountSelection();
    this.emit();
  }

  toggle(id: number, position: number) {
    this.selection[id] = this.selection[id] ? 0 : 1;
    this.anchor = position;
    this.recountSelection();
    this.emit();
  }

  /** Shift-click: select every row between the anchor and this position. */
  selectRange(position: number) {
    const from = this.anchor ?? position;
    const [a, b] = from < position ? [from, position] : [position, from];
    for (let p = a; p <= b && p < this.indices.length; p++) this.selection[this.indices[p]] = 1;
    this.recountSelection();
    this.emit();
  }

  selectAllInView() {
    for (let p = 0; p < this.indices.length; p++) this.selection[this.indices[p]] = 1;
    this.recountSelection();
    this.emit();
  }

  clearSelection() {
    this.selection.fill(0);
    this.anchor = null;
    this.selectedCount = 0;
    this.selectedTotal = 0;
    this.emit();
  }

  selectedIds(): number[] {
    const ids: number[] = [];
    for (let i = 0; i < this.selection.length; i++) if (this.selection[i]) ids.push(i);
    return ids;
  }

  private recountSelection() {
    if (!this.cols) return;
    let count = 0;
    let total = 0;
    for (let i = 0; i < this.cols.n; i++) {
      if (this.selection[i]) {
        count++;
        total += this.cols.amount[i];
      }
    }
    this.selectedCount = count;
    this.selectedTotal = total;
  }

  // Export ---------------------------------------------------------------

  toCsv(): string {
    const cols = this.cols;
    if (!cols) return "";
    const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
    const lines = ["id,date,merchant,category,department,cardholder,receipt,flagged,amount_usd,memo"];
    for (const i of this.indices) {
      lines.push(
        [
          String(i),
          isoDay(cols.day[i]),
          esc(MERCHANTS[cols.merchant[i]].name),
          CATEGORIES[cols.category[i]].label,
          DEPARTMENTS[cols.dept[i]].label,
          esc(HOLDERS[cols.holder[i]].name),
          RECEIPT_STATES[cols.receipt[i]].label,
          cols.flagged[i] ? "yes" : "no",
          (cols.amount[i] / 100).toFixed(2),
          esc(cols.memo.get(i) ?? ""),
        ].join(","),
      );
    }
    return lines.join("\n");
  }
}
