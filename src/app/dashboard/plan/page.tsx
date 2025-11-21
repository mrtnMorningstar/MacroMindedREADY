"use client";

import {
  LockedDashboardScreen,
  MealPlanSection,
  ProgressTracker,
  useDeliveryMeta,
} from "@/components/dashboard/client-components";
import { MealPlanSkeleton } from "@/components/skeletons";
import MealPlanStatusCard from "@/components/status/MealPlanStatusCard";
import { useDashboard } from "@/context/dashboard-context";
import { progressSteps, type MealPlanStatus } from "@/types/dashboard";

export default function PlanPage() {
  const { data, loading, error, isUnlocked } = useDashboard();

  const status: MealPlanStatus =
    data?.mealPlanStatus && progressSteps.includes(data.mealPlanStatus)
      ? data.mealPlanStatus
      : "Not Started";

  const statusIndex = progressSteps.indexOf(status);
  const { daysSinceDelivery } = useDeliveryMeta(data?.mealPlanDeliveredAt ?? null);

  if (loading) {
    return <MealPlanSkeleton />;
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
            Meal Plan
          </p>
          <h1 className="text-2xl font-bold uppercase tracking-[0.22em] text-foreground">
            Access your latest delivery
          </h1>
          <p className="text-[0.75rem] uppercase tracking-[0.3em] text-foreground/50">
            Download files, review delivery status, and request updates.
          </p>
        </div>

        <MealPlanStatusCard
          status={status}
          packageTier={data?.packageTier ?? null}
          showDownload={status === "Delivered"}
          fileUrl={data?.mealPlanFileURL}
        />

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <MealPlanSection
            status={status}
            fileUrl={data?.mealPlanFileURL}
            imageUrls={data?.mealPlanImageURLs}
            daysSinceDelivery={daysSinceDelivery}
            groceryListUrl={data?.groceryListURL}
            packageTier={data?.packageTier ?? null}
          />
          <ProgressTracker statusIndex={statusIndex} />
        </div>
      </div>
  );
}

