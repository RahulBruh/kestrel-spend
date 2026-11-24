import { useEffect, useRef } from "react";

import { Kbd } from "@/components/talon";

const SHORTCUTS: [string[], string][] = [
  [["⌘", "K"], "Command menu"],
  [["/"], "Focus search"],
  [["J"], "Next row"],
  [["K"], "Previous row"],
  [["⇧", "J"], "Extend selection down"],
  [["X"], "Select focused row"],
  [["⌘", "A"], "Select all in view"],
  [["Enter"], "Open detail"],
  [["C"], "Recategorize"],
  [["R"], "Toggle receipt matched"],
  [["F"], "Toggle flag"],
  [["⌘", "Z"], "Undo"],
  [["⇧", "⌘", "Z"], "Redo"],
  [["B"], "Budgets view"],
  [["Esc"], "Close panel, then clear selection"],
];

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog
      aria-label="Keyboard shortcuts"
      className="m-auto w-[min(480px,92vw)] rounded-k border border-line bg-raised p-0 text-ink shadow-float backdrop:bg-ink/25"
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      onClose={onClose}
      ref={ref}
    >
      <div className="border-b border-line px-5 py-4">
        <h2 className="font-semibold tracking-tight">Keyboard shortcuts</h2>
        <p className="mt-1 text-sm text-ink-2">Everything in the ledger works without a mouse.</p>
      </div>
      <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2.5 px-5 py-4 text-sm">
        {SHORTCUTS.map(([keys, label]) => (
          <div className="contents" key={label}>
            <dt className="text-ink-2">{label}</dt>
            <dd className="flex justify-end gap-1">
              {keys.map((k) => (
                <Kbd key={k}>{k}</Kbd>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </dialog>
  );
}
