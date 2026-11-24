import { cx } from "./cx";

/** The Kestrel wing: three ledger bars cut at 45 degrees. */
export function KestrelMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={cx("text-cobalt", className)} viewBox="0 0 48 48">
      <path d="M6 12h36l-6.5 6.5H6z M6 21.5h27l-6.5 6.5H6z M6 31h18l-6.5 6.5H6z" fill="currentColor" />
    </svg>
  );
}

export function KestrelWordmark({ className }: { className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2 font-semibold tracking-tight text-ink", className)}>
      <KestrelMark className="size-6" />
      Kestrel
    </span>
  );
}
