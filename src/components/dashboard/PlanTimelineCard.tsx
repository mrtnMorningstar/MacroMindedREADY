"use client";

import { motion } from "framer-motion";
import {
  CheckCircleIcon,
  ClockIcon,
  UserPlusIcon,
  ShoppingCartIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/solid";
import type { MealPlanStatusType } from "@/types/dashboard";
import { MealPlanStatus } from "@/types/status";

type PlanTimelineCardProps = {
  accountCreatedAt: Date | null;
  purchaseDate: Date | null;
  mealPlanStatus: MealPlanStatusType | string | null;
  mealPlanDeliveredAt: Date | null;
};

type TimelineStep = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
  date: Date | null;
};

export default function PlanTimelineCard({
  accountCreatedAt,
  purchaseDate,
  mealPlanStatus,
  mealPlanDeliveredAt,
}: PlanTimelineCardProps) {
  const steps: TimelineStep[] = [
    {
      id: "account",
      label: "Account Created",
      icon: UserPlusIcon,
      completed: !!accountCreatedAt,
      date: accountCreatedAt,
    },
    {
      id: "purchase",
      label: "Package Purchased",
      icon: ShoppingCartIcon,
      completed: !!purchaseDate,
      date: purchaseDate,
    },
    {
      id: "progress",
      label: "Plan In Progress",
      icon: ClockIcon,
      completed: mealPlanStatus === MealPlanStatus.IN_PROGRESS || mealPlanStatus === MealPlanStatus.DELIVERED,
      date: null,
    },
    {
      id: "delivered",
      label: "Plan Delivered",
      icon: DocumentTextIcon,
      completed: mealPlanStatus === MealPlanStatus.DELIVERED,
      date: mealPlanDeliveredAt,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm"
    >
      <h3 className="text-xl font-semibold text-white mb-6">Plan Delivery Timeline</h3>
      
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.completed;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="relative flex items-start gap-4">
              {/* Timeline Line */}
              {!isLast && (
                <div
                  className={`absolute left-5 top-12 h-full w-0.5 ${
                    isActive ? "bg-[#D7263D]" : "bg-neutral-700"
                  }`}
                  style={{ height: "calc(100% + 1rem)" }}
                />
              )}

              {/* Icon */}
              <div
                className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 transition ${
                  isActive
                    ? "border-[#D7263D] bg-[#D7263D]/20 scale-110"
                    : "border-neutral-700 bg-neutral-800"
                }`}
              >
                {isActive ? (
                  <CheckCircleIcon className="h-6 w-6 text-[#D7263D]" />
                ) : (
                  <Icon className="h-5 w-5 text-neutral-500" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between">
                  <p
                    className={`text-sm font-semibold ${
                      isActive ? "text-white" : "text-neutral-400"
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.date && (
                    <p className="text-xs text-neutral-500">
                      {step.date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

