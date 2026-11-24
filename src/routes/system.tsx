import { createFileRoute } from "@tanstack/react-router";

import { SystemPage } from "@/features/system/system-page";

export const Route = createFileRoute("/system")({
  component: SystemPage,
  head: () => ({
    meta: [{ title: "Talon design system · Kestrel" }, { content: "Tokens, components and the query language behind the Kestrel console.", name: "description" }],
  }),
});
