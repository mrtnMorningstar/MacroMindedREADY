"use client";

export default function PackageListSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-3xl border border-border/70 bg-muted/60 px-8 py-10 backdrop-blur"
        >
          <div className="mb-4 h-8 w-1/2 rounded bg-background/40"></div>
          <div className="mb-6 h-6 w-3/4 rounded bg-background/30"></div>
          <div className="mb-4 space-y-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-4 w-full rounded bg-background/30"></div>
            ))}
          </div>
          <div className="mt-6 h-12 w-full rounded-full bg-background/40"></div>
        </div>
      ))}
    </div>
  );
}

