import { ArrowDown, ArrowUp, Flag, Paperclip, Warning } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";

import { Button, Checkbox, cx, MerchantTile, Money, Pill } from "@/components/talon";
import { HOLDERS, MERCHANTS } from "@/lib/ledger/generate";
import { CATEGORIES, DEPARTMENTS, RECEIPT_MATCHED, RECEIPT_MISSING, formatCount, formatDay } from "@/lib/ledger/model";
import type { SortDir, SortKey } from "@/lib/ledger/query";

import type { LedgerStore } from "./ledger-store";

export type Density = "comfortable" | "compact";

const HEADER_H = 36;
const OVERSCAN = 8;
const GRID = "grid grid-cols-[40px_96px_minmax(180px,2fr)_124px_118px_minmax(140px,1.2fr)_104px_120px] items-center";

const COLUMNS: { key: SortKey | null; label: string; align?: "right" }[] = [
  { key: null, label: "" },
  { key: "day", label: "Date" },
  { key: "merchant", label: "Merchant" },
  { key: "category", label: "Category" },
  { key: "dept", label: "Team" },
  { key: "holder", label: "Cardholder" },
  { key: "receipt", label: "Receipt" },
  { align: "right", key: "amount", label: "Amount" },
];

interface LedgerTableProps {
  store: LedgerStore;
  sort: SortKey;
  dir: SortDir;
  density: Density;
  focusPos: number;
  onFocusPos: (pos: number) => void;
  onSort: (key: SortKey) => void;
  onOpen: () => void;
  onClearFilters: () => void;
  hasFilters: boolean;
}

/**
 * A hand-rolled virtualized grid: only the ~30 rows inside the viewport (plus
 * overscan) exist in the DOM, positioned by one transform on a slice wrapper.
 * 50,000 rows scroll at the cost of 30.
 */
export function LedgerTable(props: LedgerTableProps) {
  const { store, sort, dir, density, focusPos, onFocusPos, onSort, onOpen } = props;
  const scroller = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewH, setViewH] = useState(720);
  const frame = useRef(0);
  const rowH = density === "compact" ? 32 : 40;
  const total = store.indices.length;
  const cols = store.cols;

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setViewH(el.clientHeight));
    ro.observe(el);
    setViewH(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // Keep the keyboard-focused row inside the viewport.
  useEffect(() => {
    const el = scroller.current;
    if (!el || focusPos < 0) return;
    const top = focusPos * rowH;
    const bottom = top + rowH;
    const visible = el.clientHeight - HEADER_H;
    if (top < el.scrollTop) el.scrollTop = top;
    else if (bottom > el.scrollTop + visible) el.scrollTop = bottom - visible;
  }, [focusPos, rowH]);

  // A new result set starts at the top.
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 0;
  }, [store.indices]);

  const onScroll = () => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      if (scroller.current) setScrollTop(scroller.current.scrollTop);
    });
  };

  const first = Math.max(0, Math.floor(scrollTop / rowH) - OVERSCAN);
  const last = Math.min(total, Math.ceil((scrollTop + viewH) / rowH) + OVERSCAN);

  const allSelected = total > 0 && store.selectedCount >= total;
  const focusedId = focusPos >= 0 && focusPos < total ? store.indices[focusPos] : -1;

  const onRowClick = (event: MouseEvent, pos: number, id: number) => {
    if (event.shiftKey) {
      store.selectRange(pos);
    } else if (event.metaKey || event.ctrlKey) {
      store.toggle(id, pos);
    } else {
      store.anchor = pos;
    }
    onFocusPos(pos);
  };

  return (
    <div
      aria-activedescendant={focusedId >= 0 ? `txn-${focusedId}` : undefined}
      aria-busy={store.status !== "ready"}
      aria-colcount={COLUMNS.length}
      aria-label="Transactions"
      aria-multiselectable="true"
      aria-rowcount={total + 1}
      className="relative min-h-0 min-w-0 flex-1 overflow-auto outline-none [scrollbar-gutter:stable]"
      onScroll={onScroll}
      ref={scroller}
      role="grid"
      tabIndex={0}
    >
      <div className="min-w-[960px]">
        <div
          className={cx(GRID, "sticky top-0 z-10 border-b border-line bg-paper/95 text-xs font-medium text-ink-3 backdrop-blur")}
          role="row"
          style={{ height: HEADER_H }}
        >
          <div className="flex justify-center" role="columnheader">
            <Checkbox
              checked={allSelected}
              indeterminate={!allSelected && store.selectedCount > 0}
              label={allSelected ? "Clear selection" : "Select all rows in view"}
              onChange={(next) => (next ? store.selectAllInView() : store.clearSelection())}
            />
          </div>
          {COLUMNS.slice(1).map((c) => {
            const active = c.key === sort;
            return (
              <div
                aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
                className={cx("px-3", c.align === "right" && "text-right")}
                key={c.label}
                role="columnheader"
              >
                <button
                  className={cx("inline-flex items-center gap-1 hover:text-ink", active && "text-ink", c.align === "right" && "flex-row-reverse")}
                  onClick={() => c.key && onSort(c.key)}
                  type="button"
                >
                  {c.label}
                  {active ? dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : null}
                </button>
              </div>
            );
          })}
        </div>

        {store.status !== "ready" || !cols ? (
          <SkeletonRows rowH={rowH} />
        ) : total === 0 ? (
          <EmptyState hasFilters={props.hasFilters} onClear={props.onClearFilters} />
        ) : (
          <div className="relative" style={{ height: total * rowH }}>
            <div style={{ transform: `translateY(${first * rowH}px)` }}>
              {Array.from({ length: last - first }, (_, k) => {
                const pos = first + k;
                const id = store.indices[pos];
                const selected = store.isSelected(id);
                const focused = pos === focusPos;
                const receipt = cols.receipt[id];
                const memo = cols.memo.get(id);
                return (
                  <div
                    aria-rowindex={pos + 2}
                    aria-selected={selected}
                    className={cx(
                      GRID,
                      "relative cursor-default border-b border-line-2 text-sm",
                      selected ? "bg-cobalt-wash/70" : "hover:bg-raised",
                      focused && "bg-raised shadow-[inset_3px_0_0_var(--color-cobalt)]",
                    )}
                    id={`txn-${id}`}
                    key={id}
                    onClick={(e) => onRowClick(e, pos, id)}
                    onDoubleClick={onOpen}
                    role="row"
                    style={{ height: rowH }}
                  >
                    <div className="flex justify-center" role="gridcell">
                      <Checkbox
                        checked={selected}
                        label={`Select ${MERCHANTS[cols.merchant[id]].name} on ${formatDay(cols.day[id])}`}
                        onChange={(_, e) => {
                          if (e.shiftKey) store.selectRange(pos);
                          else store.toggle(id, pos);
                          onFocusPos(pos);
                        }}
                      />
                    </div>
                    <div className="tabular px-3 text-mini text-ink-2" role="gridcell">
                      {formatDay(cols.day[id], true)}
                    </div>
                    <div className="flex min-w-0 items-center gap-2.5 px-3" role="gridcell">
                      <MerchantTile name={MERCHANTS[cols.merchant[id]].name} />
                      <span className="truncate font-medium">{MERCHANTS[cols.merchant[id]].name}</span>
                      {memo ? <span className="hidden truncate text-xs text-ink-3 xl:inline">{memo}</span> : null}
                      {cols.flagged[id] ? <Flag aria-label="Flagged" className="shrink-0 text-breach" size={13} weight="fill" /> : null}
                    </div>
                    <div className="min-w-0 px-3" role="gridcell">
                      <Pill>{CATEGORIES[cols.category[id]].label}</Pill>
                    </div>
                    <div className="truncate px-3 text-ink-2" role="gridcell">
                      {DEPARTMENTS[cols.dept[id]].label}
                    </div>
                    <div className="truncate px-3 text-ink-2" role="gridcell">
                      {HOLDERS[cols.holder[id]].name}
                    </div>
                    <div className="px-3" role="gridcell">
                      {receipt === RECEIPT_MATCHED ? (
                        <span className="inline-flex items-center gap-1 text-xs text-ink-2">
                          <Paperclip size={13} /> Matched
                        </span>
                      ) : receipt === RECEIPT_MISSING ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-breach">
                          <Warning size={13} /> Missing
                        </span>
                      ) : (
                        <span className="text-xs text-ink-3">Not needed</span>
                      )}
                    </div>
                    <div className="px-3 text-right font-medium" role="gridcell">
                      <Money cents={cols.amount[id]} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonRows({ rowH }: { rowH: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: 18 }, (_, i) => (
        <div className={cx(GRID, "border-b border-line-2")} key={i} style={{ height: rowH }}>
          <div />
          <div className="px-3">
            <div className="h-3 w-14 rounded bg-paper-2" />
          </div>
          <div className="flex items-center gap-2.5 px-3">
            <div className="size-6 rounded-[4px] bg-paper-2" />
            <div className="h-3 rounded bg-paper-2" style={{ width: `${40 + ((i * 37) % 50)}%` }} />
          </div>
          <div className="px-3">
            <div className="h-5 w-20 rounded bg-paper-2" />
          </div>
          <div className="px-3">
            <div className="h-3 w-16 rounded bg-paper-2" />
          </div>
          <div className="px-3">
            <div className="h-3 w-24 rounded bg-paper-2" />
          </div>
          <div className="px-3">
            <div className="h-3 w-14 rounded bg-paper-2" />
          </div>
          <div className="flex justify-end px-3">
            <div className="h-3 w-16 rounded bg-paper-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 px-6 py-16">
      <p className="text-lg font-semibold tracking-tight">Nothing matches this view.</p>
      <p className="max-w-[52ch] text-sm text-ink-2">
        Filters combine with AND. Try loosening one, or search a merchant name in quotes, like
        <code className="mx-1 rounded bg-paper-2 px-1 font-mono text-mini">"blue bottle"</code>.
      </p>
      {hasFilters ? (
        <Button onClick={onClear} size="sm" variant="secondary">
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}

export function selectionSummary(store: LedgerStore): string {
  return `${formatCount(store.selectedCount)} selected`;
}
