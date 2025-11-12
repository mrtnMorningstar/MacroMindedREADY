"use client";

import { useEffect, useState } from "react";
import { getActivePurchase } from "@/lib/purchases";
import type { User } from "firebase/auth";

type Purchase = {
  planType?: string;
  status?: string;
  [key: string]: unknown;
};

type DashboardWrapperProps = {
  user: User;
};

export default function DashboardWrapper({ user }: DashboardWrapperProps) {
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPurchase() {
      const res = await getActivePurchase(user.uid);
      setPurchase(res);
      setLoading(false);
    }
    fetchPurchase();
  }, [user.uid]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">
          Loading dashboard...
        </p>
      </div>
    );
  }

  const locked = !purchase;

  return (
    <div className="relative min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold uppercase tracking-[0.3em] text-accent">
          MacroMinded Dashboard
        </h1>
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">
          {user.email}
        </p>
      </header>

      {/* Dashboard Content */}
      <div
        className={`grid gap-6 md:grid-cols-3 ${
          locked ? "blur-sm pointer-events-none select-none" : ""
        }`}
      >
        <div className="rounded-3xl border border-border/70 bg-muted/60 p-6 shadow-[0_0_60px_-35px_rgba(215,38,61,0.5)] backdrop-blur">
          <h2 className="text-lg font-semibold uppercase tracking-[0.3em] text-foreground">
            Current Plan
          </h2>
          <p className="mt-2 text-sm uppercase tracking-[0.2em] text-foreground/70">
            {purchase?.planType || "No active plan"}
          </p>
        </div>

        <div className="rounded-3xl border border-border/70 bg-muted/60 p-6 shadow-[0_0_60px_-35px_rgba(215,38,61,0.5)] backdrop-blur">
          <h2 className="text-lg font-semibold uppercase tracking-[0.3em] text-foreground">
            Meal Plan Progress
          </h2>
          <p className="mt-2 text-sm uppercase tracking-[0.2em] text-foreground/70">
            {purchase?.status === "delivered"
              ? "Your plan is ready!"
              : "Pending delivery"}
          </p>
        </div>

        <div className="rounded-3xl border border-border/70 bg-muted/60 p-6 shadow-[0_0_60px_-35px_rgba(215,38,61,0.5)] backdrop-blur">
          <h2 className="text-lg font-semibold uppercase tracking-[0.3em] text-foreground">
            Account Duration
          </h2>
          <p className="mt-2 text-sm uppercase tracking-[0.2em] text-foreground/70">
            {user.metadata?.creationTime
              ? new Date(user.metadata.creationTime).toLocaleDateString()
              : "N/A"}
          </p>
        </div>
      </div>

      {/* Locked Overlay */}
      {locked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/70 p-6 text-center">
          <h2 className="mb-3 text-2xl font-semibold uppercase tracking-[0.3em] text-foreground">
            Unlock Your Dashboard
          </h2>
          <p className="mb-6 max-w-md text-sm uppercase tracking-[0.3em] text-foreground/60">
            Choose a plan to access your personalized meal plan, progress tools,
            and goal tracking.
          </p>
          <button
            type="button"
            className="rounded-full border border-accent bg-accent px-6 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-background transition hover:bg-transparent hover:text-accent"
            onClick={() => {
              window.location.href = "/packages";
            }}
          >
            Choose a Plan
          </button>
        </div>
      )}
    </div>
  );
}

