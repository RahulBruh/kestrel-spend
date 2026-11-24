import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";
import { THEME_COLOR } from "../lib/talon-tokens";

const TITLE = "Kestrel";
const DESCRIPTION =
  "A keyboard-first spend console: 50,000 transactions, virtualized and queried in a Web Worker, with unlimited undo saved to the edge.";
const OG_IMAGE = "https://www.rahulmoka.com/kestrel-spend/og.png";

function buildHead() {
  return {
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "author", content: "Rahul Moka" },
      { name: "theme-color", content: THEME_COLOR },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" as const },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/kestrel-spend/favicon.ico", sizes: "48x48" },
      { rel: "icon", href: "/kestrel-spend/favicon-32.png", type: "image/png", sizes: "32x32" },
      { rel: "apple-touch-icon", href: "/kestrel-spend/apple-touch-icon.png" },
      { rel: "manifest", href: "/kestrel-spend/site.webmanifest" },
    ],
  };
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-6">
      <div className="max-w-md">
        <p className="tabular text-sm text-ink-3">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">This page is not in the ledger.</h1>
        <p className="mt-3 text-sm text-ink-2">The link may be old, or the page moved.</p>
        <Link className="mt-6 inline-flex h-9 items-center rounded-k bg-cobalt px-4 text-sm font-medium text-raised hover:bg-cobalt-2" to="/">
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-6">
      <div className="max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">This page didn't load.</h1>
        <p className="mt-3 text-sm text-ink-2">Something went wrong on our end. Try again, or head back home.</p>
        <div className="mt-6 flex gap-3">
          <button
            className="inline-flex h-9 items-center rounded-k bg-cobalt px-4 text-sm font-medium text-raised hover:bg-cobalt-2"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            type="button"
          >
            Try again
          </button>
          <a className="inline-flex h-9 items-center rounded-k border border-line px-4 text-sm font-medium text-ink hover:border-ink-3" href="/kestrel-spend">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: buildHead,
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" style={{ colorScheme: "light" }}>
      <head>
        <HeadContent />
      </head>
      <body className="bg-paper text-ink">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
