"use client";

import { motion } from "framer-motion";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Estimated Daily Targets</h3>
        {!hasRealData && (
          <div className="flex items-center gap-1 text-xs text-neutral-400">
            <InformationCircleIcon className="h-4 w-4" />
            <span>Placeholder</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-neutral-800 bg-neutral-800/50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-400 mb-1">Calories</p>
          <p className="text-2xl font-bold text-white">{macros.calories}</p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-800/50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-400 mb-1">Protein</p>
          <p className="text-2xl font-bold text-white">{macros.protein}g</p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-800/50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-400 mb-1">Carbs</p>
          <p className="text-2xl font-bold text-white">{macros.carbs}g</p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-800/50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-400 mb-1">Fats</p>
          <p className="text-2xl font-bold text-white">{macros.fats}g</p>
        </div>
      </div>

      {!hasRealData && (
        <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-800/30 p-3">
          <p className="text-xs text-neutral-400">
            Your coach sets these manually for your plan.
          </p>
        </div>
      )}

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-neutral-800 bg-neutral-800/30 p-3">
        <InformationCircleIcon className="h-4 w-4 flex-shrink-0 text-neutral-400 mt-0.5" />
        <p className="text-xs text-neutral-400">
          These values are for reference. Always follow your exact PDF plan.
        </p>
      </div>
    </motion.div>
  );
}

