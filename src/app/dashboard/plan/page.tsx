"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import {
  LockedDashboardScreen,
  MealPlanSection,
  ProgressTracker,
  useDeliveryMeta,
} from "@/components/dashboard/client-components";
import { MealPlanSkeleton } from "@/components/skeletons";
import MealPlanStatusCard from "@/components/status/MealPlanStatusCard";
import { useAppContext } from "@/context/AppContext";
import { progressSteps, type MealPlanStatusType } from "@/types/dashboard";
import { MealPlanStatus } from "@/types/status";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { parseFirestoreDate } from "@/lib/utils/date";

export default function PlanPage() {
  const { data, loading, error, isUnlocked } = useAppContext();

  const status: MealPlanStatusType =
    data?.mealPlanStatus && progressSteps.includes(data.mealPlanStatus)
      ? (data.mealPlanStatus as MealPlanStatusType)
      : MealPlanStatus.NOT_STARTED;

  const statusIndex = progressSteps.indexOf(status);
  const { daysSinceDelivery } = useDeliveryMeta(data?.mealPlanDeliveredAt ?? null);

  // Calculate estimated delivery date
  const estimatedDeliveryDate = useMemo(() => {
    if (status === MealPlanStatus.DELIVERED || !data?.purchaseDate) return null;
    
    const purchaseDate = parseFirestoreDate(data.purchaseDate);
    if (!purchaseDate) return null;
    
    const daysToAdd = data.packageTier === "Elite" ? 1 : data.packageTier === "Pro" ? 3 : 5;
    const estimated = new Date(purchaseDate);
    estimated.setDate(estimated.getDate() + daysToAdd);
    
    // Skip weekends
    while (estimated.getDay() === 0 || estimated.getDay() === 6) {
      estimated.setDate(estimated.getDate() + 1);
    }
    
    return estimated;
  }, [status, data?.purchaseDate, data?.packageTier]);

  if (loading) {
    return <MealPlanSkeleton />;
  }

  if (error) {
    return (
      <DashboardCard>
        <div className="text-center py-8">
          <h3 className="text-xl font-bold text-white mb-2">Error</h3>
          <p className="text-sm text-neutral-400">{error}</p>
        </div>
      </DashboardCard>
    );
  }

  if (!isUnlocked) {
    return <LockedDashboardScreen />;
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <h1 className="text-3xl font-bold text-white font-display tracking-tight">
          Meal Plan
        </h1>
        <p className="text-sm text-neutral-400">
          Track your plan delivery status and access your meals
        </p>
      </motion.header>

      {/* Status Card */}
      <MealPlanStatusCard
        status={status}
        packageTier={data?.packageTier ?? null}
        showDownload={status === MealPlanStatus.DELIVERED}
        fileUrl={data?.mealPlanFileURL}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Plan Details Section */}
        <DashboardCard delay={0.2}>
          <h2 className="text-xl font-bold text-white mb-6 font-display">Plan Details</h2>
          
          <MealPlanSection
            status={status}
            fileUrl={data?.mealPlanFileURL}
            imageUrls={data?.mealPlanImageURLs}
            daysSinceDelivery={daysSinceDelivery ?? null}
            groceryListUrl={data?.groceryListURL}
            packageTier={data?.packageTier ?? null}
          />

          {/* Estimated Delivery */}
          {estimatedDeliveryDate && status !== MealPlanStatus.DELIVERED && (
            <div className="mt-6 pt-6 border-t border-neutral-800">
              <div className="flex items-center gap-3 text-sm">
                <CalendarDaysIcon className="h-5 w-5 text-[#D7263D]" />
                <div>
                  <p className="text-neutral-400">Estimated Delivery</p>
                  <p className="text-white font-semibold">
                    {estimatedDeliveryDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DashboardCard>

        {/* Progress Timeline */}
        <DashboardCard delay={0.3}>
          <h2 className="text-xl font-bold text-white mb-6 font-display">Progress Timeline</h2>
          <ProgressTracker statusIndex={statusIndex} />
        </DashboardCard>
      </div>
    </div>
  );
}
