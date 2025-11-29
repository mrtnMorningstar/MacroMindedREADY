"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

type SessionExpiredModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SessionExpiredModal({
  isOpen,
  onClose,
}: SessionExpiredModalProps) {
  const router = useRouter();

  const handleLogin = () => {
    onClose();
    router.push("/login");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-1/2 z-[101] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border/70 bg-background px-8 py-10 shadow-[0_0_80px_-30px_rgba(215,38,61,0.7)]"
          >
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent/60 bg-accent/10">
                <span className="text-3xl">⏱️</span>
              </div>

              <h2 className="mb-3 text-2xl font-bold uppercase tracking-[0.32em] text-foreground">
                Session Expired
              </h2>

              <p className="mb-8 text-sm font-medium uppercase tracking-[0.3em] text-foreground/70">
                Your session has expired. Please log in again.
              </p>

              <button
                onClick={handleLogin}
                className="w-full rounded-full border border-accent bg-accent px-6 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-background transition hover:bg-transparent hover:text-accent"
              >
                Go to Login
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

