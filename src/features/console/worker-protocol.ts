import type { EditOp, LedgerColumns } from "../../lib/ledger/model";
import type { Aggregates, QueryRequest } from "../../lib/ledger/query";

export type WorkerRequest =
  | { type: "init"; seed: number; size: number }
  | { type: "patch"; ops: EditOp[] }
  | { type: "query"; reqId: number; query: QueryRequest };

export type WorkerResponse =
  | { type: "ready"; columns: LedgerColumns; genMs: number }
  | { type: "result"; reqId: number; indices: Uint32Array; agg: Aggregates; ms: number };
