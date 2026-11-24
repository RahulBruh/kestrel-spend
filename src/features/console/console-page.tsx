import { ArrowClockwise, ArrowCounterClockwise, BookOpen, ChartLineUp, Keyboard, Rows } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button, IconButton, KestrelMark, Money, Segmented, Select, ToastHost, cx, useToast } from "@/components/talon";
import { CATEGORIES, DEPARTMENTS, RECEIPT_MATCHED, RECEIPT_MISSING, formatCount } from "@/lib/ledger/model";
import type { EditField } from "@/lib/ledger/model";
import type { SortDir, SortKey } from "@/lib/ledger/query";
import { parseQuery } from "@/lib/ledger/query-language";

import { BudgetsView } from "./budgets-view";
import { CommandPalette } from "./command-palette";
import type { Command } from "./command-palette";
import { DetailPanel } from "./detail-panel";
import { LedgerTable } from "./ledger-table";
import type { Density } from "./ledger-table";
import type { LedgerStore, SaveState } from "./ledger-store";
import { Metrics } from "./metrics";
import { QueryBar } from "./query-bar";
import { ShortcutsDialog } from "./shortcuts-dialog";
import { useLedger } from "./use-ledger";

export type ConsoleView = "ledger" | "budgets";

export interface ConsoleSearch {
  q: string;
  sort: SortKey;
  dir: SortDir;
  view: ConsoleView;
}

interface ConsolePageProps extends ConsoleSearch {
  onSearchChange: (next: Partial<ConsoleSearch>) => void;
}

export function ConsolePage(props: ConsolePageProps) {
  return (
    <ToastHost>
      <ConsoleInner {...props} />
    </ToastHost>
  );
}

function ConsoleInner({ q, sort, dir, view, onSearchChange }: ConsolePageProps) {
  const store = useLedger();
  const toast = useToast();
  const [text, setText] = useState(q);
  const [focusPos, setFocusPos] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [palette, setPalette] = useState<{ open: boolean; query: string }>({ open: false, query: "" });
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [density, setDensity] = useState<Density>("comfortable");
  const searchRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => parseQuery(text), [text]);
  const filterKey = JSON.stringify(parsed.filter);

  // Every keystroke queries the worker immediately; the URL catches up after a pause.
  useEffect(() => {
    store.query({ dir, filter: parsed.filter, sort });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, filterKey, sort, dir]);

  useEffect(() => {
    setFocusPos(0);
  }, [filterKey, sort, dir]);

  useEffect(() => {
    if (text === q) return;
    const t = setTimeout(() => onSearchChange({ q: text }), 250);
    return () => clearTimeout(t);
  }, [text, q, onSearchChange]);

  const total = store.indices.length;
  useEffect(() => {
    if (focusPos > total - 1) setFocusPos(Math.max(0, total - 1));
  }, [total, focusPos]);

  const focusedId = total > 0 && focusPos < total ? store.indices[focusPos] : -1;

  const targetIds = useCallback((): number[] => {
    if (store.selectedCount > 0) return store.selectedIds();
    return focusedId >= 0 ? [focusedId] : [];
  }, [store, focusedId]);

  const notify = useCallback(
    (message: string) => {
      toast({
        action: {
          label: "Undo",
          run: () => {
            const undone = store.undo();
            if (undone) toast({ message: `Undid: ${undone}` });
          },
        },
        message,
      });
    },
    [store, toast],
  );

  const applyEdit = useCallback(
    (label: string, field: EditField, value: number | string) => {
      const ids = targetIds();
      if (!ids.length) return;
      const n = store.edit(label, [{ field, ids, value }]);
      notify(n ? `${label} · ${formatCount(n)} ${n === 1 ? "row" : "rows"}` : "Nothing to change");
    },
    [store, targetIds, notify],
  );

  const undo = useCallback(() => {
    const label = store.undo();
    toast({ message: label ? `Undid: ${label}` : "Nothing to undo" });
  }, [store, toast]);

  const redo = useCallback(() => {
    const label = store.redo();
    toast({ message: label ? `Redid: ${label}` : "Nothing to redo" });
  }, [store, toast]);

  const exportCsv = useCallback(() => {
    const blob = new Blob([store.toCsv()], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kestrel-ledger-${total}-rows.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast({ message: `Exported ${formatCount(total)} rows` });
  }, [store, total, toast]);

  const toggleField = useCallback(
    (field: "receipt" | "flagged") => {
      const ids = targetIds();
      const cols = store.cols;
      if (!ids.length || !cols) return;
      if (field === "receipt") {
        const allMatched = ids.every((id) => cols.receipt[id] === RECEIPT_MATCHED);
        applyEdit(allMatched ? "Receipt marked missing" : "Receipt matched", "receipt", allMatched ? RECEIPT_MISSING : RECEIPT_MATCHED);
      } else {
        const allFlagged = ids.every((id) => cols.flagged[id] === 1);
        applyEdit(allFlagged ? "Flag cleared" : "Flagged for review", "flagged", allFlagged ? 0 : 1);
      }
    },
    [store, targetIds, applyEdit],
  );

  const setQueryText = useCallback((next: string) => {
    setText(next);
  }, []);

  const addToken = useCallback(
    (token: string) => {
      setText((t) => (t.includes(token) ? t : `${t.trim()} ${token}`.trim()));
    },
    [],
  );

  // Keyboard model ------------------------------------------------------
  const live = useRef({ applyEdit, detailOpen, focusPos, toggleField, total, undo, redo, view });
  live.current = { applyEdit, detailOpen, focusPos, toggleField, total, undo, redo, view };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = live.current;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette({ open: true, query: "" });
        return;
      }
      if (document.querySelector("dialog[open]")) return;
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
      if (typing) return;

      const key = e.key;
      if (mod && key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
        return;
      }
      if (mod && key.toLowerCase() === "y") {
        e.preventDefault();
        s.redo();
        return;
      }
      if (mod && key.toLowerCase() === "a" && s.view === "ledger") {
        e.preventDefault();
        store.selectAllInView();
        return;
      }
      if (mod || e.altKey) return;

      const move = (delta: number) => {
        e.preventDefault();
        const next = Math.max(0, Math.min(s.total - 1, s.focusPos + delta));
        if (e.shiftKey && s.total > 0) {
          store.setSelected([store.indices[s.focusPos], store.indices[next]], true);
        }
        setFocusPos(next);
      };

      switch (key) {
        case "/":
          e.preventDefault();
          searchRef.current?.focus();
          break;
        case "j":
        case "J":
        case "ArrowDown":
          if (s.view === "ledger") move(1);
          break;
        case "k":
        case "K":
        case "ArrowUp":
          if (s.view === "ledger") move(-1);
          break;
        case "PageDown":
          if (s.view === "ledger") move(15);
          break;
        case "PageUp":
          if (s.view === "ledger") move(-15);
          break;
        case "x":
        case " ":
          if (s.total > 0 && s.view === "ledger") {
            e.preventDefault();
            store.toggle(store.indices[s.focusPos], s.focusPos);
          }
          break;
        case "Enter":
        case "o":
          if (s.total > 0 && s.view === "ledger") setDetailOpen(true);
          break;
        case "Escape":
          if (s.detailOpen) setDetailOpen(false);
          else store.clearSelection();
          break;
        case "c":
          e.preventDefault();
          setPalette({ open: true, query: "Set category " });
          break;
        case "r":
          s.toggleField("receipt");
          break;
        case "f":
          s.toggleField("flagged");
          break;
        case "b":
          onSearchChange({ view: s.view === "ledger" ? "budgets" : "ledger" });
          break;
        case "?":
          setShortcutsOpen(true);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [store, onSearchChange]);

  // Commands -------------------------------------------------------------
  const targetLabel = store.selectedCount > 0 ? `${formatCount(store.selectedCount)} selected` : focusedId >= 0 ? "focused row" : "";
  const commands: Command[] = [];
  if (targetLabel) {
    CATEGORIES.forEach((c, i) =>
      commands.push({ group: "Edit", hint: targetLabel, id: `cat-${c.id}`, run: () => applyEdit(`Moved to ${c.label}`, "category", i), title: `Set category: ${c.label}` }),
    );
    DEPARTMENTS.forEach((d, i) =>
      commands.push({ group: "Edit", hint: targetLabel, id: `dept-${d.id}`, run: () => applyEdit(`Assigned to ${d.label}`, "dept", i), title: `Set team: ${d.label}` }),
    );
    commands.push(
      { group: "Edit", hint: targetLabel, id: "receipt-matched", run: () => applyEdit("Receipt matched", "receipt", RECEIPT_MATCHED), shortcut: "R", title: "Mark receipt matched" },
      { group: "Edit", hint: targetLabel, id: "receipt-missing", run: () => applyEdit("Receipt marked missing", "receipt", RECEIPT_MISSING), title: "Mark receipt missing" },
      { group: "Edit", hint: targetLabel, id: "flag", run: () => applyEdit("Flagged for review", "flagged", 1), shortcut: "F", title: "Flag for review" },
      { group: "Edit", hint: targetLabel, id: "unflag", run: () => applyEdit("Flag cleared", "flagged", 0), title: "Clear flag" },
    );
  }
  commands.push(
    { group: "History", id: "undo", run: undo, shortcut: "⌘Z", title: "Undo" },
    { group: "History", id: "redo", run: redo, shortcut: "⇧⌘Z", title: "Redo" },
    { group: "Filter", id: "f-missing", run: () => addToken("is:missing"), title: "Show missing receipts" },
    { group: "Filter", id: "f-flagged", run: () => addToken("is:flagged"), title: "Show flagged" },
    { group: "Filter", id: "f-big", run: () => addToken(">1000"), title: "Show charges over $1,000" },
    ...CATEGORIES.map((c) => ({ group: "Filter", id: `f-${c.id}`, run: () => addToken(`cat:${c.id}`), title: `Filter to ${c.label}` })),
    { group: "Filter", id: "f-clear", run: () => setQueryText(""), title: "Clear filters" },
    { group: "Sort", id: "s-amount", run: () => onSearchChange({ dir: "desc", sort: "amount" }), title: "Sort by amount, largest first" },
    { group: "Sort", id: "s-date", run: () => onSearchChange({ dir: "desc", sort: "day" }), title: "Sort by date, newest first" },
    { group: "Sort", id: "s-merchant", run: () => onSearchChange({ dir: "asc", sort: "merchant" }), title: "Sort by merchant, A to Z" },
    { group: "Select", id: "sel-all", run: () => store.selectAllInView(), shortcut: "⌘A", title: `Select all ${formatCount(total)} in view` },
    { group: "Select", id: "sel-none", run: () => store.clearSelection(), title: "Clear selection" },
    { group: "View", id: "v-budgets", run: () => onSearchChange({ view: view === "ledger" ? "budgets" : "ledger" }), shortcut: "B", title: view === "ledger" ? "Open budgets" : "Open ledger" },
    { group: "View", id: "v-density", run: () => setDensity((d) => (d === "compact" ? "comfortable" : "compact")), title: "Toggle row density" },
    { group: "View", id: "v-keys", run: () => setShortcutsOpen(true), shortcut: "?", title: "Keyboard shortcuts" },
    { group: "Data", id: "export", run: exportCsv, title: `Export ${formatCount(total)} rows as CSV` },
    {
      group: "Data",
      id: "reset",
      run: () => {
        void store.reset();
        toast({ message: "Workspace reset to the original ledger" });
      },
      title: "Reset demo workspace",
    },
  );

  const hasFilters = text.trim().length > 0;

  return (
    <div className="grid h-dvh grid-cols-[56px_minmax(0,1fr)] bg-paper text-ink">
      <nav aria-label="Console" className="flex flex-col items-center gap-1 border-r border-line bg-raised py-3">
        <Link aria-label="Kestrel home" className="mb-3 grid size-9 place-items-center rounded-k hover:bg-paper-2" to="/">
          <KestrelMark className="size-6" />
        </Link>
        <IconButton active={view === "ledger"} label="Ledger" onClick={() => onSearchChange({ view: "ledger" })}>
          <Rows size={18} />
        </IconButton>
        <IconButton active={view === "budgets"} label="Budgets (B)" onClick={() => onSearchChange({ view: "budgets" })}>
          <ChartLineUp size={18} />
        </IconButton>
        <Link aria-label="Design system" className="grid size-9 place-items-center rounded-k text-ink-2 hover:bg-paper-2 hover:text-ink" title="Design system" to="/system">
          <BookOpen size={18} />
        </Link>
        <div className="mt-auto">
          <IconButton label="Keyboard shortcuts (?)" onClick={() => setShortcutsOpen(true)}>
            <Keyboard size={18} />
          </IconButton>
        </div>
      </nav>

      <div className="flex min-h-0 min-w-0 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-5">
          <h1 className="sr-only">Kestrel spend console</h1>
          <Segmented
            label="View"
            onChange={(v) => onSearchChange({ view: v })}
            options={[
              { label: "Ledger", value: "ledger" as ConsoleView },
              { label: "Budgets", value: "budgets" as ConsoleView },
            ]}
            value={view}
          />
          <div className="min-w-0 flex-1">
            <QueryBar onChange={setQueryText} ref={searchRef} tokens={parsed.tokens} value={text} />
          </div>
          <SaveStatus state={store.save} />
          <div className="hidden items-center md:flex">
            <IconButton disabled={!store.undoStack.length} label="Undo (⌘Z)" onClick={undo} size="sm">
              <ArrowCounterClockwise size={15} />
            </IconButton>
            <IconButton disabled={!store.redoStack.length} label="Redo (⇧⌘Z)" onClick={redo} size="sm">
              <ArrowClockwise size={15} />
            </IconButton>
          </div>
          <Button onClick={() => setPalette({ open: true, query: "" })} shortcut="⌘K" size="md" variant="secondary">
            Commands
          </Button>
        </header>

        <Metrics store={store} />

        {view === "budgets" ? (
          <BudgetsView store={store} />
        ) : (
          <div className="flex min-h-0 flex-1">
            <LedgerTable
              density={density}
              dir={dir}
              focusPos={focusPos}
              hasFilters={hasFilters}
              onClearFilters={() => setQueryText("")}
              onFocusPos={setFocusPos}
              onOpen={() => setDetailOpen(true)}
              onSort={(key) => onSearchChange({ dir: key === sort ? (dir === "asc" ? "desc" : "asc") : key === "day" || key === "amount" ? "desc" : "asc", sort: key })}
              sort={sort}
              store={store}
            />
            {detailOpen && focusedId >= 0 ? (
              <DetailPanel
                id={focusedId}
                onClose={() => setDetailOpen(false)}
                onEdited={notify}
                onFilterMerchant={(name) => setQueryText(`"${name.toLowerCase()}"`)}
                store={store}
              />
            ) : null}
          </div>
        )}

        <EngineFooter store={store} />
      </div>

      {store.selectedCount > 0 && view === "ledger" ? (
        <BulkBar
          onCategory={(i) => applyEdit(`Moved to ${CATEGORIES[i].label}`, "category", i)}
          onClear={() => store.clearSelection()}
          onFlag={() => toggleField("flagged")}
          onReceipt={() => toggleField("receipt")}
          store={store}
        />
      ) : null}

      <CommandPalette commands={commands} initialQuery={palette.query} onClose={() => setPalette({ open: false, query: "" })} open={palette.open} />
      <ShortcutsDialog onClose={() => setShortcutsOpen(false)} open={shortcutsOpen} />
    </div>
  );
}

const SAVE_COPY: Record<SaveState, string> = {
  connecting: "Connecting…",
  full: "Workspace full",
  idle: "All changes saved",
  local: "Not saving: offline",
  retrying: "Retrying save…",
  saved: "Saved",
  saving: "Saving…",
};

function SaveStatus({ state }: { state: SaveState }) {
  return (
    <p aria-live="polite" className={cx("hidden shrink-0 text-xs lg:block", state === "retrying" || state === "full" ? "text-breach" : "text-ink-3")}>
      {SAVE_COPY[state]}
    </p>
  );
}

function EngineFooter({ store }: { store: LedgerStore }) {
  return (
    <footer className="tabular flex h-8 shrink-0 items-center gap-4 border-t border-line bg-raised px-5 text-micro text-ink-3">
      {store.status === "ready" ? (
        <>
          <span>Generated {formatCount(store.cols?.n ?? 0)} rows in {store.genMs.toFixed(0)} ms</span>
          <span>Last query {store.queryMs.toFixed(1)} ms</span>
          <span className="hidden sm:inline">Undo depth {store.undoStack.length}</span>
          <span className="ml-auto hidden md:inline">Press ? for shortcuts</span>
        </>
      ) : store.status === "error" ? (
        <span className="text-breach">The ledger engine failed to start. Reload to try again.</span>
      ) : (
        <span>Building the ledger…</span>
      )}
    </footer>
  );
}

function BulkBar({
  store,
  onCategory,
  onReceipt,
  onFlag,
  onClear,
}: {
  store: LedgerStore;
  onCategory: (i: number) => void;
  onReceipt: () => void;
  onFlag: () => void;
  onClear: () => void;
}) {
  return (
    <div className="k-pop fixed bottom-14 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-k border border-line bg-raised py-2 pr-2 pl-4 shadow-float" role="toolbar" aria-label="Bulk actions">
      <span className="text-sm font-medium whitespace-nowrap">
        {formatCount(store.selectedCount)} selected · <Money cents={store.selectedTotal} />
      </span>
      <div className="w-44">
        <Select aria-label="Set category for selection" onChange={(e) => e.target.value && onCategory(Number(e.target.value))} value="">
          <option value="">Set category…</option>
          {CATEGORIES.map((c, i) => (
            <option key={c.id} value={i}>
              {c.label}
            </option>
          ))}
        </Select>
      </div>
      <Button onClick={onReceipt} shortcut="R" size="md">
        Receipt
      </Button>
      <Button onClick={onFlag} shortcut="F" size="md">
        Flag
      </Button>
      <Button onClick={onClear} size="md" variant="ghost">
        Clear
      </Button>
    </div>
  );
}
