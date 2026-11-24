import { X } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";

import { Button, Field, IconButton, MerchantTile, Money, Pill, Segmented, Select, TextArea } from "@/components/talon";
import { HOLDERS, MERCHANTS } from "@/lib/ledger/generate";
import { CATEGORIES, DEPARTMENTS, RECEIPT_STATES, formatDay } from "@/lib/ledger/model";

import type { LedgerStore } from "./ledger-store";

interface DetailPanelProps {
  store: LedgerStore;
  id: number;
  onClose: () => void;
  onFilterMerchant: (name: string) => void;
  onEdited: (message: string) => void;
}

export function DetailPanel({ store, id, onClose, onFilterMerchant, onEdited }: DetailPanelProps) {
  const cols = store.cols;
  const memo = cols?.memo.get(id) ?? "";
  const [draft, setDraft] = useState(memo);
  useEffect(() => setDraft(memo), [id, memo]);
  if (!cols || id < 0) return null;

  const merchant = MERCHANTS[cols.merchant[id]];
  const holder = HOLDERS[cols.holder[id]];
  const edit = (label: string, field: "category" | "dept" | "receipt" | "flagged" | "memo", value: number | string) => {
    const n = store.edit(label, [{ field, ids: [id], value }]);
    if (n) onEdited(label);
  };

  const commitMemo = () => {
    if (draft.trim() !== memo) edit("Memo updated", "memo", draft.trim().slice(0, 280));
  };

  return (
    <aside aria-label="Transaction detail" className="k-pop flex w-[360px] shrink-0 flex-col border-l border-line bg-raised">
      <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <MerchantTile name={merchant.name} size="lg" />
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold tracking-tight">{merchant.name}</h2>
            <p className="text-xs text-ink-3">
              {formatDay(cols.day[id])} · txn {id.toString().padStart(5, "0")}
            </p>
          </div>
        </div>
        <IconButton label="Close detail (Esc)" onClick={onClose} size="sm">
          <X size={14} />
        </IconButton>
      </header>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
        <div className="flex items-end justify-between">
          <Money cents={cols.amount[id]} className="text-3xl font-semibold tracking-tight" />
          {cols.flagged[id] ? <Pill tone="breach">Flagged</Pill> : <Pill tone="quiet">In policy</Pill>}
        </div>

        <dl className="grid grid-cols-[96px_1fr] gap-y-2 text-sm">
          <dt className="text-ink-3">Cardholder</dt>
          <dd>{holder.name}</dd>
          <dt className="text-ink-3">Card</dt>
          <dd className="tabular">•••• {holder.last4}</dd>
        </dl>

        <Field label="Category">
          {(fid) => (
            <Select id={fid} onChange={(e) => edit(`Moved to ${CATEGORIES[Number(e.target.value)].label}`, "category", Number(e.target.value))} value={cols.category[id]}>
              {CATEGORIES.map((c, i) => (
                <option key={c.id} value={i}>
                  {c.label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Team">
          {(fid) => (
            <Select id={fid} onChange={(e) => edit(`Assigned to ${DEPARTMENTS[Number(e.target.value)].label}`, "dept", Number(e.target.value))} value={cols.dept[id]}>
              {DEPARTMENTS.map((d, i) => (
                <option key={d.id} value={i}>
                  {d.label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink-2">Receipt</span>
          <Segmented
            label="Receipt"
            onChange={(v) => edit(`Receipt ${RECEIPT_STATES[v].label.toLowerCase()}`, "receipt", v)}
            options={RECEIPT_STATES.map((r, i) => ({ label: r.label, value: i }))}
            value={cols.receipt[id]}
          />
        </div>

        <Field hint="Saved when you leave the field." label="Memo">
          {(fid, described) => (
            <TextArea
              aria-describedby={described}
              id={fid}
              maxLength={280}
              onBlur={commitMemo}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.blur();
                e.stopPropagation();
              }}
              placeholder="What was this for?"
              value={draft}
            />
          )}
        </Field>

        <div className="mt-auto flex flex-wrap gap-2 border-t border-line pt-4">
          <Button onClick={() => edit(cols.flagged[id] ? "Flag cleared" : "Flagged for review", "flagged", cols.flagged[id] ? 0 : 1)} size="sm">
            {cols.flagged[id] ? "Clear flag" : "Flag"}
          </Button>
          <Button onClick={() => onFilterMerchant(merchant.name)} size="sm" variant="ghost">
            All {merchant.name}
          </Button>
        </div>
      </div>
    </aside>
  );
}
