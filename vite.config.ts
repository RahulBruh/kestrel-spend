import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defaultServerConditions, defineConfig } from "vite";

// Kestrel is served at rahulmoka.com/kestrel-spend through a rewrite, so pages,
// server functions and built assets all live under that prefix.
const BASE = "/kestrel-spend";

export default defineConfig(({ command }) => ({
  resolve: { tsconfigPaths: true },
  // The server bundle runs on Cloudflare Workers, which has no node_modules at
  // runtime: bundle every dependency and prefer its edge build. `vite dev` SSR
  // runs in Node, where the defaults are right.
  ssr: {
    ...(command === "build"
      ? {
          target: "webworker" as const,
          resolve: {
            conditions: [
              "workerd",
              "worker",
              "browser",
              ...defaultServerConditions.filter((c) => c !== "node"),
            ],
          },
        }
      : {}),
    noExternal: command === "build" ? (true as const) : undefined,
    external: ["cloudflare:workers"],
  },
  build: {
    assetsDir: `${BASE.slice(1)}/assets`,
    rollupOptions: { external: [/^cloudflare:/] },
  },
  plugins: [
    tanstackStart({
      router: { basepath: BASE },
      server: { entry: "server" },
      serverFns: { base: `${BASE}/_serverFn` },
    }),
    react(),
    tailwindcss(),
  ],
}));
