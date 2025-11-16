"use client";

export default function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent"></div>
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">
          Loading...
        </p>
      </div>
    </div>
  );
}

