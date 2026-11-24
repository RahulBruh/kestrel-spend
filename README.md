# Kestrel

A keyboard-first spend console over 50,000 synthetic card transactions.

**Live demo:** https://www.rahulmoka.com/kestrel-spend

![Kestrel](public/kestrel-spend/og.png)

## How it works

- **Ledger** (`src/lib/ledger`): a seeded generator fills typed-array columns
  (14 bytes a row, 700 KB in total). The same seed always gives the same ledger.
- **Query engine** (`src/features/console/ledger.worker.ts`): filtering, sorting
  and totals run in a Web Worker, off the main thread.
- **Query language** (`src/lib/ledger/query-language.ts`): a tokenizer behind
  searches like `cat:travel >500 is:missing`, with syntax highlighting and
  autocomplete in the query bar.
- **Grid** (`src/features/console/ledger-table.tsx`): hand-rolled virtualization;
  only the visible rows and a small overscan are in the DOM.
- **Edits** (`src/lib/ledger/edits.ts`): edits are plain data. Each one's inverse
  is computed from the values it overwrites, which is what powers undo and redo.
- **Persistence** (`src/lib/api/ledger.functions.ts`): edits apply optimistically
  and are saved to Cloudflare D1 as an append-only event log, replayed on load.
- **Talon** (`src/components/talon`): the token-based design system, documented
  in the app at `/kestrel-spend/system`.

## Stack

React 19, TypeScript, TanStack Start (Vite), Tailwind CSS 4, Cloudflare Workers
and D1.

## Develop

Requires [Bun](https://bun.sh).

```sh
bun install
bun run test
bun run lint
bun run build
bunx wrangler d1 migrations apply kestrel-spend-db --local
bun run preview        # http://localhost:8787/kestrel-spend/
```

## Deploy

To deploy your own copy, run `bunx wrangler d1 create kestrel-spend-db`, put the
id it prints in `wrangler.jsonc`, then:

```sh
bunx wrangler d1 migrations apply kestrel-spend-db --remote
bun run deploy
```
