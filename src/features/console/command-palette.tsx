import { useEffect, useMemo, useRef, useState } from "react";

import { cx, Kbd } from "@/components/talon";

import { fuzzyScore } from "./fuzzy";

export interface Command {
  id: string;
  group: string;
  title: string;
  hint?: string;
  shortcut?: string;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  initialQuery: string;
  commands: Command[];
  onClose: () => void;
}

/** ⌘K palette on a native <dialog>: free focus trap, Esc, and inert background. */
export function CommandPalette({ open, initialQuery, commands, onClose }: CommandPaletteProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) {
      setQuery(initialQuery);
      setActive(0);
      el.showModal();
      requestAnimationFrame(() => input.current?.select());
    } else if (!open && el.open) {
      el.close();
    }
  }, [open, initialQuery]);

  const results = useMemo(() => {
    const scored = commands
      .map((c) => ({ c, m: fuzzyScore(query, `${c.title} ${c.group}`) }))
      .filter((r): r is { c: Command; m: { score: number; hits: number[] } } => r.m !== null);
    if (query) scored.sort((a, b) => b.m.score - a.m.score);
    return scored.slice(0, 60);
  }, [commands, query]);

  useEffect(() => {
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const run = (index: number) => {
    const item = results[index];
    if (!item) return;
    onClose();
    item.c.run();
  };

  let lastGroup = "";
  return (
    <dialog
      aria-label="Command menu"
      className="m-auto mt-[12vh] w-[min(640px,92vw)] overflow-hidden rounded-k border border-line bg-raised p-0 text-ink shadow-float backdrop:bg-ink/25"
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
      onClose={onClose}
      ref={dialog}
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        <input
          aria-activedescendant={results[active] ? `cmd-${results[active].c.id}` : undefined}
          aria-controls="command-list"
          aria-label="Type a command"
          className="h-12 flex-1 bg-transparent text-lede outline-none placeholder:text-ink-3"
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(results.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              run(active);
            }
          }}
          placeholder="Recategorize, filter, sort, export…"
          ref={input}
          role="combobox"
          aria-expanded="true"
          value={query}
        />
        <Kbd>esc</Kbd>
      </div>
      <ul className="max-h-[52vh] overflow-y-auto py-1.5" id="command-list" ref={list} role="listbox">
        {results.length === 0 ? <li className="px-4 py-6 text-sm text-ink-3">No command matches "{query}".</li> : null}
        {results.map(({ c, m }, i) => {
          const header = c.group !== lastGroup && !query ? c.group : null;
          lastGroup = c.group;
          return (
            <li key={c.id} role="presentation">
              {header ? <p className="px-4 pt-2.5 pb-1 text-xs font-medium text-ink-3">{header}</p> : null}
              <div
                aria-selected={i === active}
                className={cx(
                  "mx-1.5 flex cursor-pointer items-center justify-between gap-4 rounded-[4px] px-2.5 py-2 text-sm",
                  i === active ? "bg-cobalt text-raised" : "text-ink",
                )}
                data-index={i}
                id={`cmd-${c.id}`}
                onClick={() => run(i)}
                onMouseMove={() => setActive(i)}
                role="option"
              >
                <span className="truncate">
                  <Highlight hits={m.hits} text={c.title} />
                </span>
                <span className={cx("flex shrink-0 items-center gap-2 text-xs", i === active ? "text-raised/80" : "text-ink-3")}>
                  {c.hint}
                  {c.shortcut ? <Kbd tone={i === active ? "inverse" : "default"}>{c.shortcut}</Kbd> : null}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </dialog>
  );
}

function Highlight({ text, hits }: { text: string; hits: number[] }) {
  if (!hits.length) return <>{text}</>;
  const set = new Set(hits);
  return (
    <>
      {Array.from(text, (ch, i) =>
        set.has(i) ? (
          <span className="font-semibold underline decoration-1 underline-offset-2" key={i}>
            {ch}
          </span>
        ) : (
          <span key={i}>{ch}</span>
        ),
      )}
    </>
  );
}
