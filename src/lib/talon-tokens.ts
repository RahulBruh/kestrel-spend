export const THEME_COLOR = "#f2f4f3";

// Token table rendered on /system. Values mirror the @theme block in styles.css.
export const COLOR_TOKENS = [
  { name: "paper", role: "Page ground", value: "#F2F4F3" },
  { name: "paper-2", role: "Wells, skeletons, quiet fills", value: "#E8EBEA" },
  { name: "raised", role: "Cards, panels, inputs", value: "#FBFCFC" },
  { name: "line", role: "Borders and dividers", value: "#D5DADA" },
  { name: "ink", role: "Primary text", value: "#14181A" },
  { name: "ink-2", role: "Secondary text", value: "#4A5257" },
  { name: "ink-3", role: "Tertiary text, captions", value: "#6F787D" },
  { name: "cobalt", role: "The one accent: actions, focus, selection", value: "#2B45D4" },
  { name: "cobalt-wash", role: "Selected rows, accent pills", value: "#E3E8FB" },
  { name: "breach", role: "Budget overruns and missing receipts only", value: "#B4362F" },
] as const;

export const TYPE_SCALE = [
  { name: "Display", spec: "Geist 600 · 64/64 · -0.04em", sample: "Spend, squared away.", className: "text-5xl font-semibold tracking-tighter md:text-6xl" },
  { name: "Title", spec: "Geist 600 · 20/28 · -0.01em", sample: "Team budgets, FY2026", className: "text-xl font-semibold tracking-tight" },
  { name: "Body", spec: "Geist 400 · 14/20", sample: "Cumulative card spend against a straight-line pace.", className: "text-sm" },
  { name: "Figures", spec: "Geist Mono 500 · tabular", sample: "$12,480.00  $3,906.15  $118.40", className: "tabular text-lg font-medium" },
  { name: "Caption", spec: "Geist 400 · 12/16", sample: "Generated 50,000 rows in 41 ms", className: "text-xs text-ink-3" },
] as const;
