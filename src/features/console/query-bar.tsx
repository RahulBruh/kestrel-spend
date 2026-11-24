import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { forwardRef, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import { cx, Kbd } from "@/components/talon";
import { suggest } from "@/lib/ledger/query-language";
import type { Token, TokenKind } from "@/lib/ledger/query-language";

const tokenClass: Record<TokenKind, string> = {
  amount: "bg-cobalt-wash text-cobalt",
  category: "bg-cobalt-wash text-cobalt",
  date: "bg-paper-2 text-ink",
  dept: "bg-paper-2 text-ink",
  error: "text-breach underline decoration-wavy decoration-breach underline-offset-4",
  state: "bg-paper-2 text-ink",
  text: "text-ink",
};

interface QueryBarProps {
  value: string;
  tokens: Token[];
  onChange: (value: string) => void;
}

/**
 * Search input with live syntax highlighting. The visible text is a mirror
 * layer drawn under a transparent input, so every token gets its own color
 * while the native caret, selection and IME behavior stay intact.
 */
export const QueryBar = forwardRef<HTMLInputElement, QueryBarProps>(function QueryBar({ value, tokens, onChange }, ref) {
  const mirror = useRef<HTMLDivElement>(null);
  const [caret, setCaret] = useState(0);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const completion = useMemo(() => suggest(value, caret), [value, caret]);
  const open = focused && !dismissed && completion.items.length > 0;
  const error = tokens.find((t) => t.kind === "error");

  const segments = useMemo(() => {
    const out: { text: string; kind: TokenKind | null }[] = [];
    let at = 0;
    for (const t of tokens) {
      if (t.start > at) out.push({ kind: null, text: value.slice(at, t.start) });
      out.push({ kind: t.kind, text: value.slice(t.start, t.end) });
      at = t.end;
    }
    if (at < value.length) out.push({ kind: null, text: value.slice(at) });
    return out;
  }, [tokens, value]);

  const accept = (index: number, input: HTMLInputElement) => {
    const item = completion.items[index];
    if (!item) return;
    const next = value.slice(0, completion.from) + item.insert + value.slice(completion.to).replace(/^\s+/, "");
    onChange(next);
    const pos = completion.from + item.insert.length;
    requestAnimationFrame(() => {
      input.setSelectionRange(pos, pos);
      setCaret(pos);
    });
    setActive(0);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (open) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((a) => (a + 1) % completion.items.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive((a) => (a - 1 + completion.items.length) % completion.items.length);
        return;
      }
      if (event.key === "Tab" || event.key === "Enter") {
        event.preventDefault();
        accept(active, event.currentTarget);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setDismissed(true);
        return;
      }
    }
    if (event.key === "Escape") {
      event.currentTarget.blur();
    }
  };

  return (
    <div className="relative w-full max-w-[44rem]">
      <div className="relative flex h-10 items-center rounded-k border border-line bg-raised transition-colors focus-within:border-cobalt hover:border-ink-3">
        <MagnifyingGlass aria-hidden="true" className="ml-3 shrink-0 text-ink-3" size={16} />
        <div className="relative h-full min-w-0 flex-1">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center overflow-hidden px-2.5 font-mono text-mini whitespace-pre"
            ref={mirror}
          >
            {value ? (
              segments.map((s, i) => (
                <span className={cx(s.kind && "rounded-[3px]", s.kind ? tokenClass[s.kind] : "text-ink")} key={i}>
                  {s.text}
                </span>
              ))
            ) : (
              <span className="font-sans text-sm text-ink-3">Search or filter: cat:travel &gt;500 is:missing</span>
            )}
          </div>
          <input
            aria-autocomplete="list"
            aria-controls="query-suggestions"
            aria-describedby={error ? "query-error" : undefined}
            aria-expanded={open}
            aria-label="Search and filter transactions"
            autoComplete="off"
            className="absolute inset-0 w-full bg-transparent px-2.5 font-mono text-mini text-transparent caret-ink outline-none selection:bg-cobalt/20"
            onBlur={() => setFocused(false)}
            onChange={(e) => {
              onChange(e.target.value);
              setCaret(e.target.selectionStart ?? e.target.value.length);
              setDismissed(false);
              setActive(0);
            }}
            onFocus={() => setFocused(true)}
            onKeyDown={onKeyDown}
            onScroll={(e) => {
              if (mirror.current) mirror.current.scrollLeft = e.currentTarget.scrollLeft;
            }}
            onSelect={(e) => setCaret(e.currentTarget.selectionStart ?? 0)}
            ref={ref}
            role="combobox"
            spellCheck={false}
            value={value}
          />
        </div>
        <span className="mr-2 hidden sm:inline-flex">
          <Kbd>/</Kbd>
        </span>
      </div>
      {open ? (
        <ul
          className="k-pop absolute top-11 left-0 z-30 w-72 overflow-hidden rounded-k border border-line bg-raised py-1 shadow-float"
          id="query-suggestions"
          role="listbox"
        >
          {completion.items.map((item, i) => (
            <li
              aria-selected={i === active}
              className={cx(
                "flex cursor-pointer items-center justify-between gap-3 px-3 py-1.5 text-sm",
                i === active ? "bg-cobalt-wash text-cobalt" : "text-ink",
              )}
              key={item.label}
              onMouseDown={(e) => {
                e.preventDefault();
                const input = (e.currentTarget.closest(".relative")?.querySelector("input") ?? null) as HTMLInputElement | null;
                if (input) accept(i, input);
              }}
              onMouseEnter={() => setActive(i)}
              role="option"
            >
              <span className="font-mono text-mini">{item.label}</span>
              <span className="text-xs text-ink-3">{item.hint}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <p className="absolute top-11 left-1 text-xs text-breach" id="query-error">
          {error.label}
        </p>
      ) : null}
    </div>
  );
});
