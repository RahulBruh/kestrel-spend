import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { bindings } from "../bindings.server";

// Every edit a visitor makes is an append-only event in D1, keyed by an
// anonymous workspace id the browser generates. Undo is itself an event, so
// replaying the log in order always reproduces the visitor's exact ledger.

const workspaceSchema = z.string().regex(/^[a-z0-9-]{8,64}$/);
const clientIdSchema = z.string().regex(/^[a-z0-9-]{8,64}$/);

const opSchema = z.object({
  field: z.enum(["category", "dept", "receipt", "flagged", "memo"]),
  ids: z.array(z.number().int().min(0).max(49_999)).min(1).max(50_000),
  value: z.union([z.number().int().min(0).max(255), z.string().max(280)]),
});

const eventSchema = z.discriminatedUnion("kind", [
  z.object({ clientId: clientIdSchema, kind: z.literal("edit"), ops: z.array(opSchema).min(1).max(64) }),
  z.object({
    cents: z.number().int().min(0).max(100_000_000_000),
    clientId: clientIdSchema,
    dept: z.number().int().min(0).max(6),
    kind: z.literal("budget"),
  }),
]);

export type LedgerEvent = z.infer<typeof eventSchema>;

const MAX_EVENTS_PER_WORKSPACE = 2000;

export const loadWorkspace = createServerFn({ method: "POST" })
  .validator(z.object({ workspace: workspaceSchema }))
  .handler(async ({ data }) => {
    const { DB } = bindings();
    if (!DB) return { events: [] as LedgerEvent[], persisted: false };
    try {
      const rows = await DB.prepare(
        "SELECT kind, client_id, payload FROM ledger_events WHERE workspace = ? ORDER BY id LIMIT ?",
      )
        .bind(data.workspace, MAX_EVENTS_PER_WORKSPACE)
        .all<{ kind: string; client_id: string; payload: string }>();
      const events: LedgerEvent[] = [];
      for (const row of rows.results ?? []) {
        try {
          const parsed = eventSchema.safeParse({ ...JSON.parse(row.payload), clientId: row.client_id, kind: row.kind });
          if (parsed.success) events.push(parsed.data);
        } catch {
          // A corrupt row is skipped rather than breaking the whole workspace.
        }
      }
      return { events, persisted: true };
    } catch (error) {
      console.error("loadWorkspace failed", error);
      return { events: [] as LedgerEvent[], persisted: false };
    }
  });

export const appendEvents = createServerFn({ method: "POST" })
  .validator(z.object({ events: z.array(eventSchema).min(1).max(32), workspace: workspaceSchema }))
  .handler(async ({ data }) => {
    const { DB } = bindings();
    if (!DB) return { persisted: false, saved: 0 };
    const existing = await DB.prepare("SELECT COUNT(*) AS n FROM ledger_events WHERE workspace = ?")
      .bind(data.workspace)
      .first<{ n: number }>();
    if ((existing?.n ?? 0) + data.events.length > MAX_EVENTS_PER_WORKSPACE) {
      throw new Error("This demo workspace is full. Reset it from the command menu to keep editing.");
    }
    const insert = DB.prepare(
      "INSERT OR IGNORE INTO ledger_events (workspace, client_id, kind, payload) VALUES (?, ?, ?, ?)",
    );
    await DB.batch(
      data.events.map((event) => {
        const { clientId, kind, ...rest } = event;
        return insert.bind(data.workspace, clientId, kind, JSON.stringify(rest));
      }),
    );
    return { persisted: true, saved: data.events.length };
  });

export const resetWorkspace = createServerFn({ method: "POST" })
  .validator(z.object({ workspace: workspaceSchema }))
  .handler(async ({ data }) => {
    const { DB } = bindings();
    if (!DB) return { persisted: false };
    await DB.prepare("DELETE FROM ledger_events WHERE workspace = ?").bind(data.workspace).run();
    return { persisted: true };
  });
