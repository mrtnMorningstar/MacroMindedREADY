"use client";

import { motion } from "framer-motion";

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-neutral-800 bg-neutral-900 ${className}`}
    />
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="h-6 w-32 animate-pulse rounded bg-neutral-800" />
        <div className="h-10 w-24 animate-pulse rounded bg-neutral-800" />
      </div>
      {/* Table */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-12 flex-1 animate-pulse rounded bg-neutral-800" />
            <div className="h-12 w-32 animate-pulse rounded bg-neutral-800" />
            <div className="h-12 w-24 animate-pulse rounded bg-neutral-800" />
            <div className="h-12 w-20 animate-pulse rounded bg-neutral-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonText({ width = "w-full", height = "h-4" }: { width?: string; height?: string }) {
  return (
    <div className={`${width} ${height} animate-pulse rounded bg-neutral-800`} />
  );
}

