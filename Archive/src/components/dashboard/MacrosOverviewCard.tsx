"use client";

import { motion } from "framer-motion";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import DashboardCard from "./DashboardCard";

type MacrosOverviewCardProps = {
  estimatedMacros?: {
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fats?: number | null;
  } | null;
};

export default function MacrosOverviewCard({
  estimatedMacros,
}: MacrosOverviewCardProps) {
  // Use placeholder values if macros aren't available
  const macros = {
    calories: estimatedMacros?.calories ?? 2200,
    protein: estimatedMacros?.protein ?? 165,
    carbs: estimatedMacros?.carbs ?? 220,
    fats: estimatedMacros?.fats ?? 73,
  };

  const hasRealData = !!(
    estimatedMacros?.calories ||
    estimatedMacros?.protein ||
    estimatedMacros?.carbs ||
    estimatedMacros?.fats
  );

  return (
    <DashboardCard delay={0.1}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white font-display">Daily Targets</h3>
        {!hasRealData && (
          <div className="flex items-center gap-1 text-xs text-neutral-500">
            <InformationCircleIcon className="h-4 w-4" />
            <span>Estimated</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-1">
            Calories
          </p>
          <p className="text-2xl font-bold text-white">{macros.calories}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-1">
            Protein
          </p>
          <p className="text-2xl font-bold text-[#D7263D]">{macros.protein}g</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-1">
            Carbs
          </p>
          <p className="text-2xl font-bold text-white">{macros.carbs}g</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-1">
            Fats
          </p>
          <p className="text-2xl font-bold text-white">{macros.fats}g</p>
        </div>
      </div>
    </DashboardCard>
  );
}
