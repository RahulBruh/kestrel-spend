import { useState } from "react";

import { Field, Pill, TextInput, cx } from "@/components/talon";
import { DEPARTMENTS, MONTH_LABELS, formatMoney } from "@/lib/ledger/model";

import type { LedgerStore } from "./ledger-store";

export function BudgetsView({ store }: { store: LedgerStore }) {
  const agg = store.agg;
  const budgets = store.budgets;
  if (!agg || !budgets) {
    return <div className="flex-1 p-6 text-sm text-ink-3">Loading budgets…</div>;
  }
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Team budgets, FY2026</h2>
          <p className="mt-1 max-w-[60ch] text-sm text-ink-2">
            Cumulative card spend against a straight-line pace. Budgets reflect every recategorization and team change you make in the ledger.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {DEPARTMENTS.map((d, i) => (
          <BudgetCard budget={budgets[i]} key={d.id} label={d.label} months={agg.deptMonths[i]} onSave={(c) => store.setBudget(i, c)} />
        ))}
      </div>
    </div>
  );
}

function BudgetCard({ label, months, budget, onSave }: { label: string; months: number[]; budget: number; onSave: (cents: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const cumulative: number[] = [];
  months.reduce((sum, v, i) => (cumulative[i] = sum + v), 0);
  const spent = cumulative[cumulative.length - 1] ?? 0;
  const ratio = budget ? spent / budget : 0;
  const breachMonth = cumulative.findIndex((v, i) => v > (budget * (i + 1)) / 12);
  const over = spent > budget;

  const W = 320;
  const H = 120;
  const top = Math.max(budget, spent) * 1.08 || 1;
  const x = (i: number) => (i / 11) * W;
  const y = (v: number) => H - (v / top) * H;
  const actual = cumulative.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const h = hover ?? 11;

  const commit = () => {
    if (draft === null) return;
    const dollars = Number(draft.replace(/[$,\s]/g, "").replace(/k$/i, "000"));
    if (Number.isFinite(dollars) && dollars > 0) onSave(Math.round(dollars * 100));
    setDraft(null);
  };

  return (
    <article className="rounded-k border border-line bg-raised p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold tracking-tight">{label}</h3>
          <p className="tabular mt-1 text-sm text-ink-2">
            {formatMoney(spent, true)} of {formatMoney(budget, true)}
          </p>
        </div>
        {over ? (
          <Pill tone="breach">Over by {formatMoney(spent - budget, true)}</Pill>
        ) : breachMonth >= 0 ? (
          <Pill tone="neutral">Ahead of pace in {MONTH_LABELS[breachMonth]}</Pill>
        ) : (
          <Pill tone="accent">On pace</Pill>
        )}
      </header>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-2">
        <div className={cx("h-full rounded-full", over ? "bg-breach" : "bg-cobalt")} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
      </div>

      <div className="relative mt-4 h-32">
      <svg
        aria-label={`${label}: cumulative spend by month against budget pace`}
        className="h-full w-full overflow-visible"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const i = Math.round(((e.clientX - rect.left) / rect.width) * 11);
          setHover(Math.max(0, Math.min(11, i)));
        }}
        preserveAspectRatio="none"
        role="img"
        viewBox={`0 0 ${W} ${H}`}
      >
        <line stroke="var(--color-line)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" x1={0} x2={W} y1={y(0)} y2={y(budget)} />
        <line stroke="var(--color-line-2)" vectorEffect="non-scaling-stroke" x1={0} x2={W} y1={y(budget)} y2={y(budget)} />
        <path d={actual} fill="none" stroke={over ? "var(--color-breach)" : "var(--color-cobalt)"} strokeLinejoin="round" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <line stroke="var(--color-ink-3)" strokeWidth="1" vectorEffect="non-scaling-stroke" x1={x(h)} x2={x(h)} y1={0} y2={H} opacity={hover === null ? 0 : 0.5} />
      </svg>
        <span
          aria-hidden="true"
          className={cx("pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-raised", over ? "border-breach" : "border-cobalt")}
          style={{ left: `${(x(h) / W) * 100}%`, top: `${(y(cumulative[h]) / H) * 100}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-ink-3">
        <span>
          {MONTH_LABELS[h]}: <span className="tabular text-ink">{formatMoney(cumulative[h], true)}</span> spent, pace{" "}
          <span className="tabular">{formatMoney((budget * (h + 1)) / 12, true)}</span>
        </span>
        <span>Nov to Oct</span>
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <Field hint="Dollars. Press Enter to save." label="Annual budget">
          {(fid, described) => (
            <TextInput
              aria-describedby={described}
              className="tabular"
              id={fid}
              inputMode="decimal"
              onBlur={commit}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") commit();
                if (e.key === "Escape") setDraft(null);
              }}
              value={draft ?? String(Math.round(budget / 100))}
            />
          )}
        </Field>
      </div>
    </article>
  );
}
