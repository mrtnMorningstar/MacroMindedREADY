"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console
    console.error("Error page caught an error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-2xl font-bold text-foreground">
          Something went wrong!
        </h1>
        <p className="mb-6 text-foreground/70">
          We're sorry, but something unexpected happened. Our team has been
          notified and is working on a fix.
        </p>
        <button
          onClick={reset}
          className="rounded-lg border border-[#D7263D] bg-[#D7263D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

