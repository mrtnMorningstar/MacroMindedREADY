"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRightIcon, ClockIcon } from "@heroicons/react/24/outline";
import { db } from "@/lib/firebase";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { Timestamp, where } from "firebase/firestore";
import EmptyState from "./EmptyState";

type ActivityItem = {
  id: string;
  type: "purchase" | "plan_request";
  description: string;
  date: Date | null;
  amount?: number;
};

export default function RecentActivity() {
  // Get purchases from last 7 days
  const sevenDaysAgo = useMemo(
    () => Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    []
  );

  const {
    data: recentPurchases,
    loading: loadingPurchases,
  } = usePaginatedQuery<any>({
    db,
    collectionName: "purchases",
    pageSize: 10,
    orderByField: "createdAt",
    orderByDirection: "desc",
    additionalConstraints: [where("createdAt", ">=", sevenDaysAgo)],
  });

  const {
    data: recentRequests,
    loading: loadingRequests,
  } = usePaginatedQuery<any>({
    db,
    collectionName: "planUpdateRequests",
    pageSize: 10,
    orderByField: "date",
    orderByDirection: "desc",
  });

  const activities = useMemo(() => {
    const items: ActivityItem[] = [];

    // Add purchases
    recentPurchases.slice(0, 5).forEach((purchase: any) => {
      let date: Date | null = null;
      if (purchase.createdAt) {
        if (purchase.createdAt.toDate) {
          date = purchase.createdAt.toDate();
        } else if (purchase.createdAt instanceof Date) {
          date = purchase.createdAt;
        }
      }

      if (date) {
        items.push({
          id: purchase.id,
          type: "purchase",
          description: `New purchase: ${purchase.planType || "Unknown Plan"}`,
          date,
          amount: Number(purchase.amount) || 0,
        });
      }
    });

    // Add plan requests
    recentRequests.slice(0, 5).forEach((request: any) => {
      let date: Date | null = null;
      if (request.date) {
        if (request.date.toDate) {
          date = request.date.toDate();
        } else if (request.date instanceof Date) {
          date = request.date;
        }
      }

      if (date) {
        items.push({
          id: request.id,
          type: "plan_request",
          description: "New plan update request",
          date,
        });
      }
    });

    // Sort by date (most recent first)
    return items.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return b.date.getTime() - a.date.getTime();
    }).slice(0, 5);
  }, [recentPurchases, recentRequests]);

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return "Unknown";
    const now = Date.now();
    const diff = now - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const loading = loadingPurchases || loadingRequests;

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-800/50 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 shadow-xl">
        <div className="h-6 w-32 animate-pulse rounded bg-neutral-800 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-neutral-800/50" />
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-neutral-800/50 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 shadow-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white font-display">Recent Activity</h3>
        </div>
        <EmptyState
          icon={<ClockIcon className="h-12 w-12" />}
          title="No recent activity"
          description="Recent purchases and plan requests will appear here."
          className="rounded-xl border-0 m-0 p-8"
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-neutral-800/50 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 shadow-xl"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white font-display">Recent Activity</h3>
        <Link
          href="/admin/plan-requests"
          className="flex items-center gap-1 text-sm font-semibold text-[#D7263D] hover:text-[#D7263D]/80 transition-colors group"
        >
          View all
          <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ x: 4 }}
            className="flex items-center justify-between p-4 rounded-xl border border-neutral-800/50 bg-neutral-800/20 hover:bg-neutral-800/40 hover:border-neutral-700 transition-all duration-200 group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white group-hover:text-[#D7263D] transition-colors">
                {activity.description}
              </p>
              {activity.amount && (
                <p className="text-xs font-bold text-[#D7263D] mt-1.5">
                  ${activity.amount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              )}
            </div>
            <p className="text-xs font-medium text-neutral-500 ml-4 flex-shrink-0 group-hover:text-neutral-400 transition-colors">
              {formatTimeAgo(activity.date)}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
