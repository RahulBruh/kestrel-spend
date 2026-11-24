import { createFileRoute } from "@tanstack/react-router";
import type { SearchSchemaInput } from "@tanstack/react-router";
import { useCallback } from "react";

import { ConsolePage } from "@/features/console/console-page";
import type { ConsoleSearch, ConsoleView } from "@/features/console/console-page";
import { SORT_KEYS } from "@/lib/ledger/query";
import type { SortDir, SortKey } from "@/lib/ledger/query";

export const Route = createFileRoute("/console")({
  component: ConsoleRoute,
  head: () => ({
    meta: [{ title: "Console · Kestrel" }, { content: "A keyboard-first ledger of 50,000 synthetic card transactions.", name: "description" }],
  }),
  // Filters, sort and view live in the URL, so any view is a shareable link.
  validateSearch: (search: { [K in keyof ConsoleSearch]?: unknown } & SearchSchemaInput): ConsoleSearch => ({
    dir: search.dir === "asc" ? "asc" : ("desc" as SortDir),
    q: typeof search.q === "string" ? search.q.slice(0, 300) : "",
    sort: SORT_KEYS.includes(search.sort as SortKey) ? (search.sort as SortKey) : "day",
    view: search.view === "budgets" ? "budgets" : ("ledger" as ConsoleView),
  }),
});

function ConsoleRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const onSearchChange = useCallback(
    (next: Partial<ConsoleSearch>) => {
      void navigate({ replace: true, search: (prev) => ({ ...prev, ...next }) });
    },
    [navigate],
  );
  return <ConsolePage {...search} onSearchChange={onSearchChange} />;
}
