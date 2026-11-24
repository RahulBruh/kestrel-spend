import { cx } from "./cx";

export interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  label: string;
  onChange: (next: boolean, event: React.MouseEvent<HTMLButtonElement>) => void;
}

/** A button-based checkbox so it can live inside a virtualized grid row. */
export function Checkbox({ checked, indeterminate, label, onChange }: CheckboxProps) {
  const state = indeterminate ? "mixed" : checked;
  return (
    <button
      aria-checked={state}
      aria-label={label}
      className={cx(
        "grid size-4 place-items-center rounded-[4px] border transition-colors duration-100",
        checked || indeterminate ? "border-cobalt bg-cobalt text-raised" : "border-ink-3/60 bg-raised hover:border-ink-2",
      )}
      onClick={(event) => {
        event.stopPropagation();
        onChange(!checked, event);
      }}
      role="checkbox"
      tabIndex={-1}
      type="button"
    >
      {indeterminate ? (
        <svg aria-hidden="true" height="10" viewBox="0 0 10 10" width="10">
          <path d="M2 5h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
      ) : checked ? (
        <svg aria-hidden="true" height="10" viewBox="0 0 10 10" width="10">
          <path d="M1.8 5.2 4 7.3l4.2-4.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      ) : null}
    </button>
  );
}
