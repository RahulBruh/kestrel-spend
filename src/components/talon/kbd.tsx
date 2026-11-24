import type { ReactNode } from "react";

import { cx } from "./cx";

export function Kbd({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "inverse" }) {
  return (
    <kbd
      className={cx(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] border px-1 font-mono text-micro leading-none",
        tone === "inverse" ? "border-raised/30 text-raised/85" : "border-line bg-raised text-ink-3 shadow-[0_1px_0_var(--color-line)]",
      )}
    >
      {children}
    </kbd>
  );
}
