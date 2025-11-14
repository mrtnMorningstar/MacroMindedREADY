"use client";

import Link from "next/link";
import { useMemo } from "react";

import {
  DashboardMetrics,
  LockedDashboardScreen,
  MealPlanSection,
  ProfileSummary,
  ProgressTracker,
  ReferralsCard,
  SkeletonGrid,
  StatusOverview,
  useDeliveryMeta,
} from "@/components/dashboard/client-components";
import { useDashboard } from "@/context/dashboard-context";
import { progressSteps, type MealPlanStatus } from "@/types/dashboard";

export default function DashboardOverviewPage() {
  const { user, data, loading, error, isUnlocked, signOutAndRedirect } =
    useDashboard();

  const status: MealPlanStatus = useMemo(() => {
    if (!data || !data.mealPlanStatus) return "Not Started";
    return progressSteps.includes(data.mealPlanStatus)
      ? data.mealPlanStatus
      : "Not Started";
  }, [data]);

  const statusIndex = progressSteps.indexOf(status);
  const { daysSinceDelivery } = useDeliveryMeta(data?.mealPlanDeliveredAt ?? null);
  const goal = data?.profile?.goal ?? null;

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <SkeletonGrid />
      </div>
    );
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
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 text-center sm:text-left sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.45em] text-foreground/70">
            Macro Command Center
          </p>
          <h1 className="mt-2 text-3xl font-bold uppercase tracking-[0.22em] text-foreground sm:text-4xl">
            Welcome back, {user?.displayName ?? "Athlete"}
          </h1>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.3em] text-foreground/60 sm:text-sm">
            {user?.email ?? "Stay connected to your coaching team."}
          </p>
        </div>
        <button
          type="button"
          onClick={signOutAndRedirect}
          className="rounded-full border border-border/70 px-5 py-2 text-xs font-medium uppercase tracking-[0.3em] text-foreground/70 transition hover:border-accent hover:text-accent"
        >
          Sign Out
        </button>
      </header>

      <DashboardMetrics
        goal={goal}
        daysSinceDelivery={daysSinceDelivery}
        nextCheckInDate={null}
      />

      <section className="grid gap-6">
        <StatusOverview status={status} packageTier={data?.packageTier} />

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <MealPlanSection
            status={status}
            fileUrl={data?.mealPlanFileURL}
            imageUrls={data?.mealPlanImageURLs}
            daysSinceDelivery={daysSinceDelivery}
            groceryListUrl={data?.groceryListURL}
          />
          <ProgressTracker statusIndex={statusIndex} />
        </div>

        <ProfileSummary profile={data?.profile ?? {}} />

        <ReferralsCard
          referralCode={data?.referralCode ?? null}
          referralCredits={data?.referralCredits ?? 0}
        />

        <div className="rounded-3xl border border-border/70 bg-muted/60 px-8 py-8 text-center text-xs font-medium uppercase tracking-[0.3em] text-foreground/60 backdrop-blur">
          Need a plan adjustment?{" "}
          <Link
            href="/macro-form"
            className="text-accent underline underline-offset-4"
          >
            Update your macro intake form
          </Link>{" "}
          to keep your plan accurate.
        </div>
      </section>
    </div>
  );
}

