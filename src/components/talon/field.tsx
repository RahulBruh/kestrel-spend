import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useId } from "react";

import { cx } from "./cx";

const control =
  "w-full rounded-k border border-line bg-raised px-3 text-sm text-ink placeholder:text-ink-3 transition-colors hover:border-ink-3 focus:border-cobalt focus:outline-none";

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

/** Label above, control, then hint or error below. Never placeholder-as-label. */
export function Field({ label, hint, error, children }: FieldShellProps) {
  const id = useId();
  const noteId = `${id}-note`;
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-ink-2" htmlFor={id}>
        {label}
      </label>
      {children(id, hint || error ? noteId : undefined)}
      {error ? (
        <p className="text-xs text-breach" id={noteId}>
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-ink-3" id={noteId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(control, "h-9", className)} {...rest} />;
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(control, "min-h-20 resize-y py-2 leading-relaxed", className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cx(control, "h-9 appearance-none pr-8", className)} {...rest}>
        {children}
      </select>
      <svg aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-3" height="10" viewBox="0 0 10 10" width="10">
        <path d="M2 3.5 5 6.5l3-3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
}

export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div aria-label={label} className="inline-flex rounded-k border border-line bg-paper-2 p-0.5" role="radiogroup">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            aria-checked={active}
            className={cx(
              "h-7 rounded-[4px] px-2.5 text-xs font-medium transition-colors",
              active ? "bg-raised text-ink shadow-[0_1px_2px_rgb(20_24_26/0.08)]" : "text-ink-2 hover:text-ink",
            )}
            key={String(option.value)}
            onClick={() => onChange(option.value)}
            role="radio"
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
