import { Money, Sparkline } from "@/components/talon";
import { formatCount } from "@/lib/ledger/model";

import type { LedgerStore } from "./ledger-store";

export function Metrics({ store }: { store: LedgerStore }) {
  const agg = store.agg;
  if (!agg) {
    return (
      <div className="grid grid-cols-2 gap-px border-b border-line bg-line md:grid-cols-4" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div className="h-[76px] bg-paper px-5 py-3" key={i}>
            <div className="h-3 w-20 rounded bg-paper-2" />
            <div className="mt-3 h-5 w-28 rounded bg-paper-2" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <section aria-label="Totals for the current view" className="grid grid-cols-2 gap-px border-b border-line bg-line md:grid-cols-4">
      <div className="flex items-end justify-between gap-4 bg-paper px-5 py-3">
        <div>
          <p className="text-xs text-ink-3">Spend in view</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">
            <Money cents={agg.total} />
          </p>
        </div>
        <Sparkline className="max-w-28" label="Monthly spend in view, November to October" values={agg.months} />
      </div>
      <Readout label="Transactions" value={formatCount(agg.count)} note={`of ${formatCount(store.cols?.n ?? 0)}`} />
      <Readout label="Missing receipts" value={formatCount(agg.missing)} note={agg.count ? `${((agg.missing / agg.count) * 100).toFixed(1)}% of view` : ""} />
      <Readout
        label="Engine"
        note="filter, sort and totals in a Web Worker"
        value={`${store.queryMs.toFixed(1)} ms`}
      />
    </section>
  );
}

function Readout({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="bg-paper px-5 py-3">
      <p className="text-xs text-ink-3">{label}</p>
      <p className="mt-1 flex items-baseline gap-2">
        <span className="tabular text-xl font-semibold tracking-tight">{value}</span>
        <span className="truncate text-xs text-ink-3">{note}</span>
      </p>
    </div>
  );
}
