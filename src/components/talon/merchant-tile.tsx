import { cx } from "./cx";

/** Initials tile. Shade varies by name so adjacent rows stay distinguishable without new hues. */
export function MerchantTile({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) {
  const initials = name
    .replace(/[^A-Za-z0-9 ]/g, "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const shade = ["bg-paper-2 text-ink-2", "bg-cobalt-wash text-cobalt", "bg-ink text-raised", "bg-raised text-ink border border-line"][hash % 4];
  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-grid shrink-0 place-items-center rounded-[4px] font-mono font-medium",
        size === "sm" ? "size-6 text-[10px]" : "size-11 text-sm",
        shade,
      )}
    >
      {initials}
    </span>
  );
}
