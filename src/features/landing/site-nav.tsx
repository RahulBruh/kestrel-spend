import { Link } from "@tanstack/react-router";

import { KestrelWordmark } from "@/components/talon";

import { WingCta } from "./ctas";

const navLink =
  "relative px-1 py-1 text-sm text-ink-2 hover:text-ink data-[status=active]:text-ink data-[status=active]:after:absolute data-[status=active]:after:inset-x-1 data-[status=active]:after:-bottom-0.5 data-[status=active]:after:h-[2px] data-[status=active]:after:bg-cobalt";

export function SiteNav({ cta = true }: { cta?: boolean }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-line/70 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-8 px-5 md:px-10">
        <Link aria-label="Kestrel home" to="/">
          <KestrelWordmark />
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-5">
          <Link className={navLink} to="/console">
            Console
          </Link>
          <Link className={navLink} to="/system">
            System
          </Link>
        </nav>
        {cta ? (
          <div className="ml-auto hidden sm:block">
            <WingCta className="h-10 text-sm" />
          </div>
        ) : null}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-5 py-10 md:flex-row md:items-end md:justify-between md:px-10">
        <div className="flex flex-col gap-3">
          <KestrelWordmark />
          <p className="max-w-[48ch] text-sm text-ink-2">
            A portfolio project by{" "}
            <a className="text-ink underline decoration-line underline-offset-4 hover:decoration-cobalt" href="https://rahulmoka.com">
              Rahul Moka
            </a>
            . Kestrel is fictional and every transaction is synthetic, generated in your browser from a fixed seed.
          </p>
        </div>
        <nav aria-label="Footer" className="flex gap-6 text-sm text-ink-2">
          <Link className="hover:text-ink" to="/console">
            Console
          </Link>
          <Link className="hover:text-ink" to="/system">
            Design system
          </Link>
        </nav>
      </div>
    </footer>
  );
}
