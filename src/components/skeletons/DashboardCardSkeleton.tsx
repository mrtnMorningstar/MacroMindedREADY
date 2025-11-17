"use client";

export default function DashboardCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-border/70 bg-muted/60 px-8 py-8 backdrop-blur">
      <div className="mb-4 h-6 w-3/4 rounded bg-background/40"></div>
      <div className="mb-2 h-4 w-full rounded bg-background/30"></div>
      <div className="h-4 w-2/3 rounded bg-background/30"></div>
    </div>
  );
}

