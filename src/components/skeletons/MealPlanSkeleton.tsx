"use client";

export default function MealPlanSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="rounded-3xl border border-border/70 bg-muted/60 px-8 py-8 backdrop-blur">
        <div className="mb-4 h-6 w-1/3 rounded bg-background/40"></div>
        <div className="mb-2 h-4 w-full rounded bg-background/30"></div>
        <div className="h-4 w-2/3 rounded bg-background/30"></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-background/20"></div>
        ))}
      </div>
    </div>
  );
}

