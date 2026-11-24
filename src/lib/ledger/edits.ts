// Edits are plain data (EditOp). Applying one mutates the columns; its
// inverse is computed from the values it is about to overwrite, which is
// what makes unlimited undo and redo cheap.

import type { EditOp, LedgerColumns } from "./model";

export function readField(cols: LedgerColumns, field: EditOp["field"], id: number): number | string {
  switch (field) {
    case "category":
      return cols.category[id];
    case "dept":
      return cols.dept[id];
    case "receipt":
      return cols.receipt[id];
    case "flagged":
      return cols.flagged[id];
    case "memo":
      return cols.memo.get(id) ?? "";
  }
}

export function applyOp(cols: LedgerColumns, op: EditOp): void {
  const { field, value } = op;
  for (const id of op.ids) {
    if (id < 0 || id >= cols.n) continue;
    switch (field) {
      case "category":
        cols.category[id] = Number(value);
        break;
      case "dept":
        cols.dept[id] = Number(value);
        break;
      case "receipt":
        cols.receipt[id] = Number(value);
        break;
      case "flagged":
        cols.flagged[id] = Number(value) ? 1 : 0;
        break;
      case "memo": {
        const text = String(value);
        if (text) cols.memo.set(id, text);
        else cols.memo.delete(id);
        break;
      }
    }
  }
}

export function applyOps(cols: LedgerColumns, ops: EditOp[]): void {
  for (const op of ops) applyOp(cols, op);
}

/** Ops that restore the current values of every id the given ops will touch. */
export function inverseOf(cols: LedgerColumns, ops: EditOp[]): EditOp[] {
  const inverse: EditOp[] = [];
  for (const op of ops) {
    const groups = new Map<string, { value: number | string; ids: number[] }>();
    for (const id of op.ids) {
      const value = readField(cols, op.field, id);
      const key = `${typeof value}:${value}`;
      let g = groups.get(key);
      if (!g) {
        g = { ids: [], value };
        groups.set(key, g);
      }
      g.ids.push(id);
    }
    for (const g of groups.values()) inverse.push({ field: op.field, ids: g.ids, value: g.value });
  }
  // Undo must replay in reverse order so overlapping ops restore correctly.
  return inverse.reverse();
}

/** Drop ids whose value would not change, so no-op edits never hit the log. */
export function effectiveOps(cols: LedgerColumns, ops: EditOp[]): EditOp[] {
  return ops
    .map((op) => ({
      ...op,
      ids: op.ids.filter((id) => {
        const current = readField(cols, op.field, id);
        if (op.field === "memo") return String(current) !== String(op.value);
        return Number(current) !== Number(op.value);
      }),
    }))
    .filter((op) => op.ids.length > 0);
}
