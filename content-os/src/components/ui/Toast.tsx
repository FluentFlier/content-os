'use client';

import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from 'react';

type ToastType = 'success' | 'error';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastNotification key={t.id} item={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastNotification({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), 3000);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  const styles =
    item.type === 'success'
      ? 'bg-[#EAF3DE] text-[#3B6D11] border-[rgba(59,109,17,0.20)]'
      : 'bg-[#FAECE7] text-[#993C1D] border-[rgba(153,60,29,0.20)]';

  return (
    <div
      className={`${styles} border-[0.5px] text-[13px] font-['Space_Grotesk'] font-medium px-4 py-2.5 rounded-[12px] animate-fade-in max-w-xs`}
    >
      {item.message}
    </div>
  );
}
