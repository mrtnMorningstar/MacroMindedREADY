"use client";

export default function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-1/2 rounded bg-background/40"></div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 w-full rounded bg-background/30"></div>
      ))}
    </div>
  );
}

