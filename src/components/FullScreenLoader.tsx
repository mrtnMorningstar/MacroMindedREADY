"use client";

import { motion } from "framer-motion";

export default function FullScreenLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black text-foreground"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent/30 border-t-transparent"></div>
          <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent border-t-accent"></div>
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">
          Loading...
        </p>
      </div>
    </motion.div>
  );
}

