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
import DashboardCard from "./DashboardCard";

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
    <DashboardCard delay={0.2}>
      <h3 className="text-lg font-bold text-white mb-6 font-display">Progress Tracker</h3>
      
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
                  className={`absolute left-5 top-12 h-full w-0.5 transition-colors duration-300 ${
                    isActive ? "bg-[#D7263D]" : "bg-neutral-700"
                  }`}
                  style={{ height: "calc(100% + 1rem)" }}
                />
              )}

              {/* Icon */}
              <div
                className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  isActive
                    ? "border-[#D7263D] bg-[#D7263D]/20 scale-110 shadow-[0_0_15px_rgba(215,38,61,0.5)]"
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
                    className={`text-sm font-semibold transition-colors ${
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
    </DashboardCard>
  );
}
