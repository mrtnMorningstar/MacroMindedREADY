"use client";

import { motion } from "framer-motion";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import type { MealPlanStatus } from "@/types/dashboard";

type MealPlanStatusCardProps = {
  mealPlanStatus: MealPlanStatus | string | null;
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
      case "Delivered":
        return {
          badge: "Ready to Download",
          badgeColor: "bg-[#D7263D]/20 border-[#D7263D]/50 text-[#D7263D]",
          message: "Your meal plan is ready!",
        };
      case "In Progress":
        return {
          badge: "Being Prepared",
          badgeColor: "bg-amber-500/20 border-amber-500/50 text-amber-500",
          message: "Your coach is preparing your custom meal plan.",
        };
      case "Not Started":
      default:
        return {
          badge: "Awaiting Coach",
          badgeColor: "bg-neutral-600/20 border-neutral-600/50 text-neutral-400",
          message: "Your meal plan is in queue.",
        };
    }
  };

  const getExpectedTimeframe = () => {
    switch (packageTier) {
      case "Elite":
        return "Expected in up to 1 business day";
      case "Pro":
        return "Expected in up to 3 business days";
      case "Basic":
      default:
        return "Expected in up to 5 business days";
    }
  };

  const statusInfo = getStatusInfo();
  const daysSinceDelivery = mealPlanDeliveredAt
    ? Math.floor((Date.now() - mealPlanDeliveredAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-3">Meal Plan Status</h3>
          
          <div className="mb-4">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusInfo.badgeColor}`}
            >
              {statusInfo.badge}
            </span>
          </div>

          {mealPlanStatus === "Delivered" && daysSinceDelivery !== null ? (
            <div className="space-y-3">
              <p className="text-sm text-neutral-200">
                Delivered {daysSinceDelivery} {daysSinceDelivery === 1 ? "day" : "days"} ago
              </p>
              <div className="flex flex-wrap gap-3">
                {fileUrl && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#D7263D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Download Meal Plan
                  </a>
                )}
                {imageUrls && imageUrls.length > 0 && (
                  <button className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:bg-neutral-700">
                    View Images
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-neutral-200">{statusInfo.message}</p>
              <p className="text-xs uppercase tracking-wide text-neutral-400">
                {getExpectedTimeframe()}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

