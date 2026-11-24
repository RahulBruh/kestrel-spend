import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

import { cx } from "./cx";
import { Kbd } from "./kbd";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  /** Keyboard shortcut shown inside the button, e.g. "⌘K". */
  shortcut?: string;
}

const variants: Record<ButtonVariant, string> = {
  danger: "bg-raised text-breach border border-line hover:border-breach hover:bg-breach-wash",
  ghost: "bg-transparent text-ink-2 border border-transparent hover:bg-paper-2 hover:text-ink",
  primary: "bg-cobalt text-raised border border-cobalt hover:bg-cobalt-2 hover:border-cobalt-2",
  secondary: "bg-raised text-ink border border-line hover:border-ink-3",
};

const sizes: Record<ButtonSize, string> = {
  md: "h-9 px-3.5 text-sm gap-2",
  sm: "h-7 px-2.5 text-mini gap-1.5",
};

/** Talon button: one component, four intents, two sizes. Used inside the console UI. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", icon, shortcut, className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-k font-medium whitespace-nowrap transition-colors duration-150 select-none",
        "active:translate-y-[1px] disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        sizes[size],
        className,
      )}
      ref={ref}
      type={type}
      {...rest}
    >
      {icon}
      {children}
      {shortcut ? <Kbd tone={variant === "primary" ? "inverse" : "default"}>{shortcut}</Kbd> : null}
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: ButtonSize;
  active?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = "md", active, className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      aria-label={label}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-k border transition-colors duration-150 active:translate-y-[1px]",
        size === "md" ? "size-9" : "size-7",
        active
          ? "border-cobalt bg-cobalt-wash text-cobalt"
          : "border-transparent text-ink-2 hover:bg-paper-2 hover:text-ink",
        className,
      )}
      ref={ref}
      title={label}
      type={type}
      {...rest}
    >
      {children}
    </button>
  );
});
