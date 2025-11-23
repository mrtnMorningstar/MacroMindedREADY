"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { db } from "@/lib/firebase";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { Timestamp, where } from "firebase/firestore";
import EmptyState from "./EmptyState";
import { ClockIcon } from "@heroicons/react/24/outline";

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
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="h-6 w-32 animate-pulse rounded bg-neutral-800 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-neutral-800" />
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        </div>
        <EmptyState
          icon={<ClockIcon className="h-12 w-12" />}
          title="No recent activity"
          description="Recent purchases and plan requests will appear here."
          className="rounded-xl border-0 m-0 p-8"
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        <Link
          href="/admin/plan-requests"
          className="flex items-center gap-1 text-sm text-[#D7263D] hover:text-[#D7263D]/80 transition-colors"
        >
          View all
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-4 rounded-lg border border-neutral-800 bg-neutral-800/30"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">
                {activity.description}
              </p>
              {activity.amount && (
                <p className="text-xs text-[#D7263D] mt-1">
                  ${activity.amount.toFixed(2)}
                </p>
              )}
            </div>
            <p className="text-xs text-neutral-400 ml-4 flex-shrink-0">
              {formatTimeAgo(activity.date)}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

