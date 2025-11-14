"use client";

import Link from "next/link";

import {
  LockedDashboardScreen,
  ProfileSummary,
  SkeletonGrid,
} from "@/components/dashboard/client-components";
import { useDashboard } from "@/context/dashboard-context";

export default function ProfilePage() {
  const { data, loading, error, isUnlocked } = useDashboard();

  if (loading) {
    return <SkeletonGrid />;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-accent/40 bg-muted/70 px-6 py-6 text-center text-xs font-semibold uppercase tracking-[0.3em] text-accent">
        {error}
      </div>
    );
  }

  if (!isUnlocked) {
    return <LockedDashboardScreen />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">
          Profile
        </p>
        <h1 className="text-2xl font-bold uppercase tracking-[0.22em] text-foreground">
          Macro intake snapshot
        </h1>
        <p className="text-[0.75rem] uppercase tracking-[0.3em] text-foreground/50">
          Keep your measurements accurate to ensure the best plan results.
        </p>
      </div>

      <ProfileSummary profile={data?.profile ?? {}} />

      <div className="rounded-3xl border border-border/70 bg-muted/60 px-8 py-8 text-center text-xs font-medium uppercase tracking-[0.3em] text-foreground/60 backdrop-blur">
        <p>
          Need to refresh your stats?{" "}
          <Link
            href="/macro-form"
            className="text-accent underline underline-offset-4"
          >
            Submit the macro intake form
          </Link>{" "}
          whenever your goals or measurements change.
        </p>
      </div>
    </div>
  );
}

