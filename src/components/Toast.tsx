"use client";
import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { Icon } from "./Icon";

interface Toast { id: string; msg: string }

const ToastContext = createContext<(msg: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((msg: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2200);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-host">
        {toasts.map(t => (
          <div key={t.id} className="toast"><Icon name="check" size={12}/>{t.msg}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
