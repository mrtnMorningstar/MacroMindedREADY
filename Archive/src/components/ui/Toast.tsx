"use client";

import { motion, AnimatePresence } from "framer-motion";
import { createContext, useContext, useState, type ReactNode } from "react";

const ToastContext = createContext<{
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
} | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

type Toast = {
  id: number;
  type: "success" | "error" | "info";
  message: string;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: "success" | "error" | "info", message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider
      value={{
        success: (msg: string) => addToast("success", msg),
        error: (msg: string) => addToast("error", msg),
        info: (msg: string) => addToast("info", msg),
      }}
    >
      {children}

      <div className="fixed top-5 right-5 z-[9999] space-y-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`
                px-6 py-4 rounded-2xl border shadow-[0_0_40px_-20px_rgba(215,38,61,0.6)] backdrop-blur
                text-xs font-semibold uppercase tracking-[0.3em] pointer-events-auto
                ${
                  toast.type === "success"
                    ? "bg-green-600/90 border-green-500/50 text-white"
                    : toast.type === "error"
                      ? "bg-accent/90 border-accent/50 text-background"
                      : "bg-muted/90 border-border/70 text-foreground"
                }
              `}
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

