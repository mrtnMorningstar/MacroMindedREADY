"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

type StatCardProps = {
  title: string;
  value: string | number;
  isLoading?: boolean;
  isHighlight?: boolean;
  delay?: number;
  icon?: ReactNode;
  description?: string;
};

export default function StatCard({
  title,
  value,
  isLoading = false,
  isHighlight = false,
  delay = 0,
  icon,
  description,
}: StatCardProps) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.3 }}
        className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-lg"
      >
        <div className="h-4 w-24 animate-pulse rounded bg-neutral-800 mb-4" />
        <div className="h-10 w-32 animate-pulse rounded bg-neutral-800" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-2xl border p-6 shadow-lg transition-all duration-300 ${
        isHighlight
          ? "border-[#D7263D]/50 bg-neutral-900/80 backdrop-blur shadow-[0_0_60px_-35px_rgba(215,38,61,0.6)]"
          : "border-neutral-800 bg-neutral-900"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
          {title}
        </p>
        {icon && <div className="text-neutral-500">{icon}</div>}
      </div>
      <p
        className={`text-3xl font-bold uppercase tracking-wide mb-1 ${
          isHighlight ? "text-[#D7263D]" : "text-white"
        }`}
      >
        {value}
      </p>
      {description && (
        <p className="text-xs text-neutral-500 mt-2">{description}</p>
      )}
    </motion.div>
  );
}

