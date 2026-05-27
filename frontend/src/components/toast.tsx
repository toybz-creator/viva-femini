'use client';

import { cn } from '@/lib/utils';
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

type ToastVariant = 'default' | 'error';

type ToastItem = {
  id: string;
  title?: string;
  description?: string;
  variant: ToastVariant;
};

type ToastInput = Omit<ToastItem, 'id'>;

type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const item: ToastItem = { id, ...input };
      setItems((prev) => [...prev, item]);
      window.setTimeout(() => dismiss(id), 3500);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed top-4 left-4 right-4 z-[100] flex flex-col gap-2 md:left-auto md:right-6 md:top-6 md:w-[380px]"
        role="status"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              'rounded-2xl border bg-white px-4 py-3 shadow-lg',
              t.variant === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-900'
                : 'border-zinc-200 text-zinc-900'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {t.title ? <p className="text-sm font-semibold leading-5">{t.title}</p> : null}
                {t.description ? (
                  <p className="mt-0.5 text-xs leading-5 text-zinc-600">{t.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}

