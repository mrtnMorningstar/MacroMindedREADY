"use client";

import {
  LockedDashboardScreen,
  ReferralsCard,
} from "@/components/dashboard/client-components";
import { DashboardCardSkeleton } from "@/components/skeletons";
import { useDashboard } from "@/context/dashboard-context";

export default function ReferralsPage() {
  const { data, loading, error, isUnlocked } = useDashboard();

  if (loading) {
    return <DashboardCardSkeleton />;
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
            Referrals
          </p>
          <h1 className="text-2xl font-bold uppercase tracking-[0.22em] text-foreground">
            Earn free upgrades
          </h1>
          <p className="text-[0.75rem] uppercase tracking-[0.3em] text-foreground/50">
            Share your link. Every successful referral unlocks credits for plan revisions.
          </p>
        </div>

        <ReferralsCard
          referralCode={data?.referralCode ?? null}
        referralCredits={data?.referralCredits ?? 0}
      />
    </div>
  );
}

