import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@tanstack/react-router";

/** "Open the console": a cobalt slab whose right edge is cut like the wing mark; the cut opens on hover. */
export function WingCta({ className = "" }: { className?: string }) {
  return (
    <Link
      className={`group relative inline-flex h-12 items-center gap-3 bg-cobalt pr-10 pl-5 text-lede font-medium text-raised transition-[padding,background-color] duration-300 [clip-path:polygon(0_0,100%_0,calc(100%-22px)_100%,0_100%)] hover:bg-cobalt-2 hover:pr-14 focus-visible:outline-offset-4 active:translate-y-[1px] motion-reduce:transition-none ${className}`}
      to="/console"
    >
      Open the console
      <ArrowRight
        aria-hidden="true"
        className="absolute right-7 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transition-none"
        size={16}
        weight="bold"
      />
    </Link>
  );
}

/** "Try ⌘K": a physical keycap that sinks when pressed. */
export function KeycapCta() {
  return (
    <Link
      className="inline-flex h-11 items-center gap-3 rounded-[8px] border border-line bg-raised px-4 text-sm font-medium text-ink shadow-[0_3px_0_var(--color-line)] transition-[transform,box-shadow] duration-100 hover:border-ink-3 active:translate-y-[3px] active:shadow-none motion-reduce:transition-none"
      search={{ dir: "desc", q: "", sort: "day", view: "ledger" }}
      to="/console"
    >
      Try
      <span className="inline-flex items-center gap-1 font-mono text-mini text-ink-2">
        <span className="rounded-[4px] border border-line px-1.5 py-0.5">⌘</span>
        <span className="rounded-[4px] border border-line px-1.5 py-0.5">K</span>
      </span>
    </Link>
  );
}

/** "Read the system": a text link underlined by three ledger rules that extend on hover. */
export function LedgerLink() {
  return (
    <Link className="group inline-flex flex-col gap-[3px] self-start text-lede font-medium text-ink" to="/system">
      <span className="inline-flex items-center gap-2">
        Read the system
        <ArrowRight aria-hidden="true" size={14} />
      </span>
      <span aria-hidden="true" className="block h-[2px] w-full origin-left bg-cobalt transition-transform duration-300 group-hover:scale-x-110 motion-reduce:transition-none" />
      <span aria-hidden="true" className="block h-[2px] w-3/4 origin-left bg-cobalt transition-transform duration-300 group-hover:scale-x-[1.45] motion-reduce:transition-none" />
      <span aria-hidden="true" className="block h-[2px] w-1/2 origin-left bg-cobalt transition-transform duration-300 group-hover:scale-x-[2.2] motion-reduce:transition-none" />
    </Link>
  );
}
