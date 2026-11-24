import { DownloadSimple, Funnel } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import type { ReactNode } from "react";

import {
  Button,
  Checkbox,
  Field,
  IconButton,
  Kbd,
  MerchantTile,
  Money,
  Pill,
  Segmented,
  Select,
  Sparkline,
  TextArea,
  TextInput,
  ToastHost,
  useToast,
} from "@/components/talon";
import { COLOR_TOKENS, TYPE_SCALE } from "@/lib/talon-tokens";

import { SiteFooter, SiteNav } from "../landing/site-nav";

const SECTIONS = [
  ["principles", "Principles"],
  ["color", "Color"],
  ["type", "Type"],
  ["components", "Components"],
  ["query", "Query language"],
] as const;

export function SystemPage() {
  return (
    <ToastHost>
      <SiteNav />
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-5 pt-28 pb-24 md:px-10 lg:grid-cols-[200px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav aria-label="On this page" className="sticky top-28 flex flex-col gap-2 text-sm">
            {SECTIONS.map(([id, label]) => (
              <a className="text-ink-2 hover:text-ink" href={`#${id}`} key={id}>
                {label}
              </a>
            ))}
          </nav>
        </aside>
        <main className="min-w-0">
          <h1 className="text-5xl leading-none font-semibold tracking-tighter md:text-6xl">Talon</h1>
          <p className="mt-5 max-w-[60ch] text-base leading-relaxed text-ink-2">
            The design system behind Kestrel. Every screen in the console is assembled from the tokens and components on this page, and every specimen here is the live component, not a picture of it.
          </p>

          <Section id="principles" title="Principles">
            <ol className="grid grid-cols-1 gap-px overflow-hidden rounded-k border border-line bg-line md:grid-cols-3">
              {[
                ["Numbers first", "Money is always Geist Mono with tabular figures, so columns of amounts align to the cent."],
                ["One accent", "Cobalt means action, focus or selection. Red is reserved for one job: something is over budget or missing."],
                ["Keyboard parity", "Anything you can click, you can do from the keyboard, and every shortcut is listed where it applies."],
              ].map(([t, d]) => (
                <li className="bg-raised p-5" key={t}>
                  <p className="font-semibold tracking-tight">{t}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">{d}</p>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="color" title="Color">
            <div className="overflow-hidden rounded-k border border-line">
              {COLOR_TOKENS.map((t) => (
                <div className="grid grid-cols-[56px_140px_minmax(0,1fr)_96px] items-center gap-4 border-b border-line bg-raised px-4 py-3 last:border-b-0" key={t.name}>
                  <span className="size-10 rounded-[4px] border border-line" style={{ background: `var(--color-${t.name})` }} />
                  <code className="font-mono text-sm">--color-{t.name}</code>
                  <span className="text-sm text-ink-2">{t.role}</span>
                  <code className="tabular text-right text-xs text-ink-3">{t.value}</code>
                </div>
              ))}
            </div>
          </Section>

          <Section id="type" title="Type">
            <div className="divide-y divide-line rounded-k border border-line bg-raised">
              {TYPE_SCALE.map((t) => (
                <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-[180px_minmax(0,1fr)] md:items-baseline" key={t.name}>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="font-mono text-micro text-ink-3">{t.spec}</p>
                  </div>
                  <p className={t.className}>{t.sample}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="components" title="Components">
            <ComponentGallery />
          </Section>

          <Section id="query" title="Query language">
            <p className="mb-5 max-w-[64ch] text-sm leading-relaxed text-ink-2">
              The console search box is a small language, parsed on every keystroke. Tokens combine with AND; comma lists inside a field combine with OR.
            </p>
            <div className="overflow-hidden rounded-k border border-line bg-raised">
              {[
                ["cat:travel,meals", "Category is Travel or Meals"],
                ["dept:eng", "Team is Engineering"],
                [">500  <20  amount>=1.5k", "Amount bounds, in dollars, k for thousands"],
                ["is:missing  is:flagged  is:clean", "Receipt and policy state"],
                ["after:2026-03  before:2026-06-15  in:2026-04", "Date range or a single month"],
                ['"blue bottle"  sweetgreen', "Merchant, cardholder, category or memo contains"],
              ].map(([syntax, meaning]) => (
                <div className="grid grid-cols-1 gap-1 border-b border-line px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" key={syntax}>
                  <code className="font-mono text-sm text-cobalt">{syntax}</code>
                  <span className="text-sm text-ink-2">{meaning}</span>
                </div>
              ))}
            </div>
          </Section>
        </main>
      </div>
      <SiteFooter />
    </ToastHost>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-title`} className="mt-20 scroll-mt-24" id={id}>
      <h2 className="mb-6 text-2xl font-semibold tracking-tight" id={`${id}-title`}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Specimen({ name, usage, children }: { name: string; usage: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 border-b border-line last:border-b-0 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="border-line bg-raised p-5 md:border-r">
        <p className="font-mono text-sm">{name}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{usage}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 bg-paper p-5">{children}</div>
    </div>
  );
}

function ComponentGallery() {
  const toast = useToast();
  const [checked, setChecked] = useState(true);
  const [seg, setSeg] = useState<"ledger" | "budgets">("ledger");
  const [budget, setBudget] = useState("250000");
  const invalid = !/^\d+$/.test(budget);
  return (
    <div className="overflow-hidden rounded-k border border-line">
      <Specimen name="<Button variant size icon shortcut>" usage="Four intents. Primary appears at most once per surface; danger is outlined until hover so it never shouts.">
        <Button variant="primary">Approve</Button>
        <Button icon={<DownloadSimple size={15} />}>Export CSV</Button>
        <Button variant="ghost">Cancel</Button>
        <Button variant="danger">Reset workspace</Button>
        <Button shortcut="⌘K" size="sm">
          Commands
        </Button>
      </Specimen>
      <Specimen name="<IconButton label active>" usage="Square, labeled for assistive tech, with a visible active state for toggles.">
        <IconButton label="Filter">
          <Funnel size={18} />
        </IconButton>
        <IconButton active label="Filter (active)">
          <Funnel size={18} />
        </IconButton>
      </Specimen>
      <Specimen name="<Pill tone>" usage="Neutral for categories, accent for healthy state, breach only when something needs fixing.">
        <Pill>Software</Pill>
        <Pill tone="accent">On pace</Pill>
        <Pill tone="breach">Over by $12K</Pill>
        <Pill tone="quiet">In policy</Pill>
      </Specimen>
      <Specimen name="<Checkbox checked indeterminate>" usage="Button-based so it can live inside a virtualized row without stealing focus from the grid.">
        <Checkbox checked={checked} label="Toggle example" onChange={setChecked} />
        <Checkbox checked={false} indeterminate label="Partially selected example" onChange={() => {}} />
        <Checkbox checked={false} label="Unchecked example" onChange={() => {}} />
      </Specimen>
      <Specimen name="<Field> + <TextInput> <Select> <TextArea>" usage="Label above, control, then hint or error below. Placeholders never stand in for labels.">
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          <Field error={invalid ? "Whole dollars only, digits and nothing else." : undefined} hint="Whole dollars." label="Annual budget">
            {(id, d) => <TextInput aria-describedby={d} aria-invalid={invalid} className="tabular" id={id} onChange={(e) => setBudget(e.target.value)} value={budget} />}
          </Field>
          <Field label="Team">
            {(id) => (
              <Select defaultValue="eng" id={id}>
                <option value="eng">Engineering</option>
                <option value="sales">Sales</option>
              </Select>
            )}
          </Field>
          <div className="sm:col-span-2">
            <Field label="Memo">{(id) => <TextArea id={id} placeholder="What was this for?" />}</Field>
          </div>
        </div>
      </Specimen>
      <Specimen name="<Segmented>" usage="Two to four mutually exclusive views. A radiogroup underneath.">
        <Segmented
          label="View"
          onChange={setSeg}
          options={[
            { label: "Ledger", value: "ledger" },
            { label: "Budgets", value: "budgets" },
          ]}
          value={seg}
        />
      </Specimen>
      <Specimen name="<Money> <Sparkline> <MerchantTile> <Kbd>" usage="Display primitives for dense financial UI.">
        <MerchantTile name="Blue Bottle" />
        <MerchantTile name="AWS" />
        <Money cents={1248007} className="text-lg font-medium" />
        <span className="w-32">
          <Sparkline label="Example trend" values={[3, 4, 3.6, 5, 4.8, 6.2, 5.9, 7.4]} />
        </span>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </Specimen>
      <Specimen name="useToast()" usage="One message at a time, with an optional action. Announced politely to screen readers.">
        <Button onClick={() => toast({ action: { label: "Undo", run: () => toast({ message: "Undone" }) }, message: "Moved 124 rows to Travel" })}>Show a toast</Button>
      </Specimen>
    </div>
  );
}
