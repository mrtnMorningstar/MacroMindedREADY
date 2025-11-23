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
  trend?: {
    value: number;
    isPositive: boolean;
  };
};

export default function StatCard({
  title,
  value,
  isLoading = false,
  isHighlight = false,
  delay = 0,
  icon,
  description,
  trend,
}: StatCardProps) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.3 }}
        className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 shadow-xl"
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
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-2xl border p-6 shadow-xl transition-all duration-300 relative overflow-hidden ${
        isHighlight
          ? "border-[#D7263D]/50 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 shadow-[0_0_60px_-30px_rgba(215,38,61,0.8)]"
          : "border-neutral-800/50 bg-gradient-to-br from-neutral-900 to-neutral-950"
      }`}
    >
      {/* Subtle gradient overlay for highlighted cards */}
      {isHighlight && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#D7263D]/5 via-transparent to-transparent pointer-events-none" />
      )}
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-500">
            {title}
          </p>
          {icon && (
            <div className={`transition-transform duration-300 ${isHighlight ? "text-[#D7263D]" : "text-neutral-600"}`}>
              {icon}
            </div>
          )}
        </div>
        
        <div className="flex items-baseline gap-3 mb-2">
          <p
            className={`text-4xl font-bold tracking-tight ${
              isHighlight 
                ? "text-[#D7263D] drop-shadow-[0_0_20px_rgba(215,38,61,0.5)]" 
                : "text-white"
            }`}
          >
            {value}
          </p>
          {trend && (
            <span
              className={`text-xs font-bold px-2 py-1 rounded-lg ${
                trend.isPositive 
                  ? "text-green-400 bg-green-500/10" 
                  : "text-red-400 bg-red-500/10"
              }`}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        
        {description && (
          <p className="text-xs text-neutral-500 mt-3 leading-relaxed">{description}</p>
        )}
      </div>
    </motion.div>
  );
}
