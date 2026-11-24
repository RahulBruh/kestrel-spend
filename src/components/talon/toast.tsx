import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { Button } from "./button";

interface ToastInput {
  message: string;
  action?: { label: string; run: () => void };
}

interface ToastItem extends ToastInput {
  id: number;
}

const ToastContext = createContext<(toast: ToastInput) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

/** One toast at a time, bottom center, announced politely to screen readers. */
export function ToastHost({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  const show = useCallback((input: ToastInput) => {
    seq.current += 1;
    setToast({ ...input, id: seq.current });
  }, []);

  useEffect(() => {
    if (!toast) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 5200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [toast]);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
        {toast ? (
          <div className="k-pop pointer-events-auto flex items-center gap-3 rounded-k bg-ink py-2 pr-2 pl-4 text-sm text-raised shadow-float" key={toast.id}>
            <span>{toast.message}</span>
            {toast.action ? (
              <Button
                className="border-raised/20 bg-transparent text-raised hover:border-raised/50 hover:bg-transparent"
                onClick={() => {
                  toast.action?.run();
                  setToast(null);
                }}
                size="sm"
                variant="secondary"
              >
                {toast.action.label}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}
