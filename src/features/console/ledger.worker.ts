/// <reference lib="webworker" />
// Owns a copy of the ledger columns and answers queries off the main thread,
// so typing in the search box never competes with scrolling or painting.

import { applyOps } from "../../lib/ledger/edits";
import { generateLedger } from "../../lib/ledger/generate";
import type { LedgerColumns } from "../../lib/ledger/model";
import { runQuery } from "../../lib/ledger/query";
import type { WorkerRequest, WorkerResponse } from "./worker-protocol";

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage: (message: WorkerResponse, transfer?: Transferable[]) => void;
};

let cols: LedgerColumns | null = null;

scope.onmessage = (event) => {
  const msg = event.data;
  if (msg.type === "init") {
    const t0 = performance.now();
    cols = generateLedger(msg.seed, msg.size);
    const genMs = performance.now() - t0;
    // Structured clone hands the main thread its own copy for synchronous row reads.
    scope.postMessage({ columns: cols, genMs, type: "ready" });
    return;
  }
  if (!cols) return;
  if (msg.type === "patch") {
    applyOps(cols, msg.ops);
    return;
  }
  if (msg.type === "query") {
    const t0 = performance.now();
    const { indices, agg } = runQuery(cols, msg.query);
    const ms = performance.now() - t0;
    scope.postMessage({ agg, indices, ms, reqId: msg.reqId, type: "result" }, [indices.buffer]);
  }
};
