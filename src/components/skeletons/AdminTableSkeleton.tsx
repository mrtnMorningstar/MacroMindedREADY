"use client";

export default function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {/* Header */}
      <div className="flex gap-4 border-b border-border/50 pb-3">
        <div className="h-4 w-1/4 rounded bg-background/40"></div>
        <div className="h-4 w-1/4 rounded bg-background/40"></div>
        <div className="h-4 w-1/4 rounded bg-background/40"></div>
        <div className="h-4 w-1/4 rounded bg-background/40"></div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3">
          <div className="h-4 w-1/4 rounded bg-background/30"></div>
          <div className="h-4 w-1/4 rounded bg-background/30"></div>
          <div className="h-4 w-1/4 rounded bg-background/30"></div>
          <div className="h-4 w-1/4 rounded bg-background/30"></div>
        </div>
      ))}
    </div>
  );
}

