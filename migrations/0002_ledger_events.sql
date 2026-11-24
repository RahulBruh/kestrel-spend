-- Kestrel ledger: every edit a visitor makes is an append-only event.
-- The base ledger is a deterministic synthetic dataset; edits fold over it.
CREATE TABLE IF NOT EXISTS ledger_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace TEXT NOT NULL,
  client_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ledger_events_ws ON ledger_events (workspace, id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_events_client ON ledger_events (workspace, client_id);
