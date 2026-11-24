import type { ReactNode } from "react";

import { cx } from "./cx";

export type PillTone = "neutral" | "accent" | "breach" | "quiet";

const tones: Record<PillTone, string> = {
  accent: "bg-cobalt-wash text-cobalt border-transparent",
  breach: "bg-breach-wash text-breach border-transparent",
  neutral: "bg-raised text-ink-2 border-line",
  quiet: "bg-transparent text-ink-3 border-transparent",
};

export function Pill({ children, tone = "neutral", icon }: { children: ReactNode; tone?: PillTone; icon?: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex h-6 max-w-full items-center gap-1 rounded-k border px-2 text-xs font-medium whitespace-nowrap",
        tones[tone],
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}
