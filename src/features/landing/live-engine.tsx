import { useEffect, useMemo, useState } from "react";

import { MerchantTile, Money, Pill } from "@/components/talon";
import { MERCHANTS } from "@/lib/ledger/generate";
import { CATEGORIES, formatCount, formatDay } from "@/lib/ledger/model";
import { parseQuery } from "@/lib/ledger/query-language";

import { QueryBar } from "../console/query-bar";
import { useLedger } from "../console/use-ledger";

const EXAMPLES = ["cat:travel >500 is:missing", "cat:cloud >2k in:2026-08", '"blue bottle" dept:eng', "dept:sales,marketing after:2026-06 is:flagged"];

/** The real query engine, embedded: same worker, same parser, same 50,000 rows. */
export function LiveEngine() {
  const store = useLedger({ persist: false });
  const [text, setText] = useState(EXAMPLES[0]);
  const parsed = useMemo(() => parseQuery(text), [text]);
  const key = JSON.stringify(parsed.filter);

  useEffect(() => {
    store.query({ dir: "desc", filter: parsed.filter, sort: "amount" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, key]);

  const cols = store.cols;
  const rows = cols && store.status === "ready" ? Array.from(store.indices.subarray(0, 6)) : [];

  return (
    <div className="rounded-k border border-line bg-raised p-4 shadow-float sm:p-5">
      <QueryBar onChange={setText} tokens={parsed.tokens} value={text} />
      <div className="mt-8 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            className="rounded-k border border-line px-2 py-1 font-mono text-xs text-ink-2 transition-colors hover:border-cobalt hover:text-cobalt"
            key={ex}
            onClick={() => setText(ex)}
            type="button"
          >
            {ex}
          </button>
        ))}
      </div>
      <div className="tabular mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-1 border-b border-line pb-3 text-xs text-ink-3">
        {store.agg ? (
          <>
            <span>
              <span className="text-base font-semibold text-ink">{formatCount(store.agg.count)}</span> of 50,000 rows
            </span>
            <span>
              <Money cents={store.agg.total} className="text-ink" /> total
            </span>
            <span>
              answered in <span className="text-cobalt">{store.queryMs.toFixed(1)} ms</span>
            </span>
          </>
        ) : (
          <span>Building 50,000 rows in a worker…</span>
        )}
      </div>
      <ul className="divide-y divide-line-2" aria-label="Largest matching transactions">
        {rows.length === 0 && store.status === "ready" ? <li className="py-6 text-sm text-ink-3">No rows match. Try another example.</li> : null}
        {cols
          ? rows.map((id) => (
              <li className="flex h-11 items-center gap-3 text-sm" key={id}>
                <MerchantTile name={MERCHANTS[cols.merchant[id]].name} />
                <span className="min-w-0 flex-1 truncate font-medium">{MERCHANTS[cols.merchant[id]].name}</span>
                <span className="hidden sm:inline">
                  <Pill>{CATEGORIES[cols.category[id]].label}</Pill>
                </span>
                <span className="tabular hidden w-24 text-xs text-ink-3 md:inline">{formatDay(cols.day[id], true)}</span>
                <Money cents={cols.amount[id]} className="w-24 text-right font-medium" />
              </li>
            ))
          : Array.from({ length: 6 }, (_, i) => (
              <li aria-hidden="true" className="flex h-11 items-center gap-3" key={i}>
                <span className="size-6 rounded-[4px] bg-paper-2" />
                <span className="h-3 flex-1 rounded bg-paper-2" />
                <span className="h-3 w-20 rounded bg-paper-2" />
              </li>
            ))}
      </ul>
    </div>
  );
}
