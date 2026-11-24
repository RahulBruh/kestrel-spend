import { useEffect, useState, useSyncExternalStore } from "react";

import { LedgerStore } from "./ledger-store";

/** One store per mounted console; the worker starts after hydration. */
export function useLedger(options: { persist?: boolean } = {}): LedgerStore {
  const [store] = useState(() => new LedgerStore(options));
  useEffect(() => {
    store.start();
    return () => store.destroy();
  }, [store]);
  useSyncExternalStore(store.subscribe, store.getVersion, () => 0);
  return store;
}
