"use client";

import { motion } from "framer-motion";
import type { MealPlanStatusType } from "@/types/dashboard";
import { MealPlanStatus } from "@/types/status";

type MealPlanStatusCardProps = {
  status: MealPlanStatusType | string | null;
  packageTier?: string | null;
  showDownload?: boolean;
  fileUrl?: string | null;
};

export default function MealPlanStatusCard({
  status,
  packageTier,
  showDownload = false,
  fileUrl,
}: MealPlanStatusCardProps) {
  const getStatusInfo = () => {
    switch (status) {
      case MealPlanStatus.DELIVERED:
        return {
          badge: "🟢 Delivered",
          message: "Your meal plan is ready!",
          color: "text-green-500",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/30",
        };
      case MealPlanStatus.IN_PROGRESS:
        return {
          badge: "🟠 Being Prepared",
          message: "Your meal plan is being prepared. Estimated delivery: 1–5 business days depending on your package.",
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
          borderColor: "border-yellow-500/30",
        };
      case MealPlanStatus.NOT_STARTED:
      default:
        return {
          badge: "🟡 In Queue",
          message: "Your meal plan is in queue. Estimated delivery: 1–5 business days depending on your package.",
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
          borderColor: "border-yellow-500/30",
        };
    }
  };

  const statusInfo = getStatusInfo();
  const estimatedDays = packageTier === "Elite" ? "1–3" : packageTier === "Pro" ? "2–4" : "3–5";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-border/70 bg-muted/60 px-8 py-8 shadow-[0_0_60px_-35px_rgba(215,38,61,0.6)] backdrop-blur"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-3 flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] ${statusInfo.color} ${statusInfo.bgColor} ${statusInfo.borderColor}`}
            >
              {statusInfo.badge}
            </span>
          </div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-foreground/80">
            {status === MealPlanStatus.DELIVERED
              ? statusInfo.message
              : `Your meal plan is being prepared. Estimated delivery: ${estimatedDays} business days depending on your package.`}
          </p>
        </div>
        {showDownload && status === MealPlanStatus.DELIVERED && fileUrl && (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 rounded-full border border-accent bg-accent px-6 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-background transition hover:bg-transparent hover:text-accent"
          >
            Download PDF
          </a>
        )}
      </div>
    </motion.div>
  );
}

