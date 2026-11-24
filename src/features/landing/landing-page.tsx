import { useEffect } from "react";

import { ScrollScrub } from "@/components/scroll-scrub/scroll-scrub";
import type { ScrollScrubScene } from "@/components/scroll-scrub/scroll-scrub";
import { Button, Checkbox, Kbd, KestrelMark, Pill } from "@/components/talon";
import { COLOR_TOKENS } from "@/lib/talon-tokens";
import { scrollScrubScenes, scrollScrubTheme } from "@/scroll-scrub-scenes";

import { KeycapCta, LedgerLink, WingCta } from "./ctas";
import { LiveEngine } from "./live-engine";
import { SiteFooter, SiteNav } from "./site-nav";

// Module constant: the final chapter carries the primary CTA.
const scenes: ScrollScrubScene[] = scrollScrubScenes.map((scene, i, all) =>
  i === all.length - 1 ? { ...scene, actions: <WingCta /> } : scene,
);

const BUILD_NOTES: [string, string][] = [
  ["Rendering", "Hand-rolled row virtualization. About 30 DOM rows stand in for 50,000 records, moved by a single transform."],
  ["Querying", "Struct-of-arrays columns in a Web Worker. Filter, sort and totals run off the main thread; results come back as a transferred buffer, not a copy."],
  ["Query language", "Tokenized on every keystroke, highlighted in place, with autocomplete for fields like cat:, dept: and is:."],
  ["Editing", "Optimistic bulk edits with computed inverses, so undo and redo are unlimited and exact."],
  ["Persistence", "Every edit is an append-only event in Cloudflare D1. Reloading replays your log over a deterministic ledger."],
  ["Accessibility", "ARIA grid semantics, a complete keyboard model, native dialogs, and reduced-motion fallbacks."],
  ["Stack", "React 19, TypeScript, TanStack Start on Vite, Tailwind v4, Cloudflare Workers. No table or chart libraries."],
];

export function LandingPage() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let destroy: (() => void) | undefined;
    let cancelled = false;
    void import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      const lenis = new Lenis({ autoRaf: true, lerp: 0.12 });
      destroy = () => lenis.destroy();
    });
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, []);

  return (
    <>
      <SiteNav />
      <main>
        <ScrollScrub className="kestrel-journey" scenes={scenes} theme={scrollScrubTheme} />

        <section aria-labelledby="engine-title" className="relative z-10 border-t border-line bg-paper">
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-5 py-24 md:px-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center">
            <div className="k-rise">
              <h2 className="text-4xl leading-none font-semibold tracking-tighter md:text-6xl" id="engine-title">
                The real engine, right here.
              </h2>
              <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-ink-2">
                This panel runs the same worker and parser as the console. Edit the query and watch 50,000 rows answer before you finish typing.
              </p>
              <div className="mt-8">
                <KeycapCta />
              </div>
            </div>
            <LiveEngine />
          </div>
        </section>

        <section aria-labelledby="build-title" className="border-t border-line bg-paper">
          <div className="mx-auto max-w-[1400px] px-5 py-24 md:px-10">
            <h2 className="text-4xl leading-none font-semibold tracking-tighter md:text-5xl" id="build-title">
              How Kestrel is built
            </h2>
            <dl className="mt-12 border-t border-ink">
              {BUILD_NOTES.map(([term, detail]) => (
                <div className="grid grid-cols-1 gap-2 border-b border-line py-5 md:grid-cols-[220px_minmax(0,1fr)] md:gap-10" key={term}>
                  <dt className="font-mono text-sm text-ink">{term}</dt>
                  <dd className="max-w-[72ch] text-base leading-relaxed text-ink-2">{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section aria-labelledby="system-title" className="border-t border-line bg-paper">
          <div className="mx-auto max-w-[1400px] px-5 py-24 md:px-10">
            <h2 className="text-4xl leading-none font-semibold tracking-tighter md:text-5xl" id="system-title">
              Drawn with one ruler
            </h2>
            <p className="mt-5 max-w-[56ch] text-base leading-relaxed text-ink-2">
              Talon is the design system underneath: ten color tokens, one accent, one radius, and the components the console is made of.
            </p>
            <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-6">
              <div className="rounded-k border border-line bg-raised p-6 md:col-span-4">
                <p className="text-sm font-medium">Color</p>
                <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-10">
                  {COLOR_TOKENS.map((t) => (
                    <div key={t.name}>
                      <div className="aspect-[3/4] rounded-[4px] border border-line" style={{ background: `var(--color-${t.name})` }} />
                      <p className="mt-2 truncate font-mono text-micro text-ink-3">{t.name}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-between rounded-k bg-cobalt p-6 text-raised md:col-span-2">
                <KestrelMark className="size-20 text-raised" />
                <p className="mt-10 max-w-[28ch] text-sm leading-relaxed text-raised/85">
                  The wing is three ledger bars cut at 45 degrees. The same cut shapes the primary call to action.
                </p>
              </div>
              <div className="rounded-k border border-line bg-raised p-6 md:col-span-3">
                <p className="text-sm font-medium">Type</p>
                <p className="mt-5 text-5xl leading-none font-semibold tracking-tighter">Aa Geist</p>
                <p className="tabular mt-4 text-2xl text-ink-2">$48,210.07</p>
              </div>
              <div className="flex flex-col justify-between gap-6 rounded-k border border-line bg-raised p-6 md:col-span-3">
                <div>
                  <p className="text-sm font-medium">Components</p>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Button tabIndex={-1} variant="primary">
                      Approve
                    </Button>
                    <Button tabIndex={-1}>Export</Button>
                    <Pill>Travel</Pill>
                    <Pill tone="accent">On pace</Pill>
                    <Pill tone="breach">Missing</Pill>
                    <Kbd>⌘K</Kbd>
                    <Checkbox checked label="Example checkbox" onChange={() => {}} />
                  </div>
                </div>
                <LedgerLink />
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
