import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l([...toasts]));
}

export const toast = {
  show(message: string, type: ToastType = "info", durationMs = 4000) {
    const id = Math.random().toString(36).substring(2, 9);
    const item: ToastItem = { id, type, message };
    toasts = [...toasts, item];
    notify();

    setTimeout(() => {
      toast.dismiss(id);
    }, Math.max(1500, durationMs));
  },
  success(message: string, opts?: { duration?: number }) {
    this.show(message, "success", opts?.duration);
  },
  error(message: string, opts?: { duration?: number }) {
    this.show(message, "error", opts?.duration);
  },
  info(message: string, opts?: { duration?: number }) {
    this.show(message, "info", opts?.duration);
  },
  dismiss(id: string) {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  },
};

export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.add(setItems);
    return () => {
      listeners.delete(setItems);
    };
  }, []);

  if (typeof document === "undefined" || items.length === 0) return null;

  return createPortal(
    <div
      aria-live="polite"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 md:bottom-auto md:left-auto md:translate-x-0 md:top-5 md:right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full px-4 md:px-0 pointer-events-none"
    >
      {items.map((t) => {
        const isSuccess = t.type === "success";
        const isError = t.type === "error";

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-200 animate-slide-in-up md:animate-slide-in-right ${
              isSuccess
                ? "bg-emerald-950/95 border-emerald-500/40 text-emerald-100"
                : isError
                ? "bg-rose-950/95 border-rose-500/40 text-rose-100"
                : "bg-navy-950/95 border-navy-700/50 text-slate-100"
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {isSuccess ? (
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : isError ? (
                <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            <div className="flex-1 text-xs md:text-sm font-medium leading-relaxed">
              {t.message}
            </div>

            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-shrink-0 text-white/50 hover:text-white transition p-0.5 rounded-lg"
              aria-label="Close notification"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
