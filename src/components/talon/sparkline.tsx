import { cx } from "./cx";

/** Area sparkline. Pure SVG, no chart library, scales to its container. */
export function Sparkline({
  values,
  className,
  label,
}: {
  values: number[];
  className?: string;
  label: string;
}) {
  const w = 120;
  const h = 32;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const points = values.map((v, i) => [i * step, h - 2 - (v / max) * (h - 4)] as const);
  const line = points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  return (
    <svg aria-label={label} className={cx("h-8 w-full overflow-visible", className)} preserveAspectRatio="none" role="img" viewBox={`0 0 ${w} ${h}`}>
      <path d={area} fill="var(--color-cobalt-wash)" />
      <path d={line} fill="none" stroke="var(--color-cobalt)" strokeLinejoin="round" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
