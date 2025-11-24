"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowDownTrayIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import type { MealPlanStatusType } from "@/types/dashboard";
import { MealPlanStatus } from "@/types/status";
import DashboardCard from "./DashboardCard";

type MealPlanStatusCardProps = {
  mealPlanStatus: MealPlanStatusType | string | null;
  mealPlanDeliveredAt: Date | null;
  packageTier?: string | null;
  fileUrl?: string | null;
  imageUrls?: string[] | null;
};

export default function MealPlanStatusCard({
  mealPlanStatus,
  mealPlanDeliveredAt,
  packageTier,
  fileUrl,
  imageUrls,
}: MealPlanStatusCardProps) {
  const getStatusInfo = () => {
    switch (mealPlanStatus) {
      case MealPlanStatus.DELIVERED:
        return {
          badge: "Ready to Download",
          badgeColor: "bg-[#D7263D]/20 border-[#D7263D]/30 text-[#D7263D]",
          message: "Your meal plan is ready!",
        };
      case MealPlanStatus.IN_PROGRESS:
        return {
          badge: "Being Prepared",
          badgeColor: "bg-amber-500/20 border-amber-500/30 text-amber-400",
          message: "Your coach is preparing your custom meal plan.",
        };
      case MealPlanStatus.NOT_STARTED:
      default:
        return {
          badge: "Awaiting Coach",
          badgeColor: "bg-neutral-600/20 border-neutral-600/30 text-neutral-400",
          message: "Your meal plan is in queue.",
        };
    }
  };

  const getExpectedTimeframe = () => {
    switch (packageTier) {
      case "Elite":
        return "Expected in up to 1 business day";
      case "Pro":
        return "Expected in 2-3 business days";
      default:
        return "Expected in 3-5 business days";
    }
  };

  const statusInfo = getStatusInfo();
  const canDownload = mealPlanStatus === MealPlanStatus.DELIVERED && fileUrl;

  return (
    <DashboardCard delay={0} className={canDownload ? "border-[#D7263D]/30" : ""}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-bold text-white font-display">Meal Plan Progress</h3>
        {canDownload && (
          <div className="h-2 w-2 rounded-full bg-[#D7263D] animate-pulse" />
        )}
      </div>

      <div className="space-y-4">
        <div>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${statusInfo.badgeColor}`}
          >
            {statusInfo.badge}
          </span>
          <p className="text-sm text-neutral-300 mt-3 leading-relaxed">
            {statusInfo.message}
          </p>
          {mealPlanStatus !== MealPlanStatus.DELIVERED && (
            <p className="text-xs text-neutral-500 mt-2">
              {getExpectedTimeframe()}
            </p>
          )}
        </div>

        {canDownload && (
          <div className="pt-4 border-t border-neutral-800">
            <Link
              href="/dashboard/plan"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#D7263D] hover:text-[#D7263D]/80 transition-colors group"
            >
              Download Plan
              <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
