import { formatMoney } from "@/lib/ledger/model";

import { cx } from "./cx";

export function Money({ cents, compact, className }: { cents: number; compact?: boolean; className?: string }) {
  return <span className={cx("tabular", className)}>{formatMoney(cents, compact)}</span>;
}
