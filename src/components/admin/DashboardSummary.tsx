"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { Timestamp, where } from "firebase/firestore";
import { MealPlanStatus } from "@/types/status";

type DashboardStats = {
  totalClients: number;
  plansPending: number;
  plansDelivered: number;
  revenueThisMonth: number;
};

type StatCardProps = {
  title: string;
  value: string | number;
  isLoading: boolean;
  isHighlight?: boolean;
  delay?: number;
};

function StatCard({
  title,
  value,
  isLoading,
  isHighlight = false,
  delay = 0,
}: StatCardProps) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.3 }}
        className="rounded-2xl border border-neutral-800 bg-neutral-900/50 backdrop-blur p-6 shadow-lg"
      >
        <div className="h-4 w-24 animate-pulse rounded bg-neutral-800 mb-4" />
        <div className="h-10 w-32 animate-pulse rounded bg-neutral-800" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-2xl border p-6 shadow-lg transition-all duration-300 ${
        isHighlight
          ? "border-[#D7263D]/50 bg-neutral-900/80 backdrop-blur shadow-[0_0_60px_-35px_rgba(215,38,61,0.6)]"
          : "border-neutral-800 bg-neutral-900/50 backdrop-blur"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-3">
        {title}
      </p>
      <p
        className={`text-3xl font-bold uppercase tracking-wide ${
          isHighlight ? "text-[#D7263D]" : "text-white"
        }`}
      >
        {value}
      </p>
    </motion.div>
  );
}

export default function DashboardSummary() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    plansPending: 0,
    plansDelivered: 0,
    revenueThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  // Calculate current month range
  const currentMonthRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
  }, []);

  // Memoize filter function to prevent re-renders
  const filterNonAdmins = useMemo(
    () => (doc: any) => doc.role !== "admin",
    []
  );

  // Memoize timestamp to prevent re-creating on every render
  const threeMonthsAgo = useMemo(
    () => Timestamp.fromDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)),
    []
  );

  // Memoize constraints to prevent re-creating on every render
  const purchaseConstraints = useMemo(
    () => [where("createdAt", ">=", threeMonthsAgo)],
    [threeMonthsAgo]
  );

  // Load users for client stats
  const {
    data: users,
    loading: loadingUsers,
  } = usePaginatedQuery<any>({
    db,
    collectionName: "users",
    pageSize: 100,
    orderByField: "createdAt",
    orderByDirection: "desc",
    filterFn: filterNonAdmins,
  });

  // Load purchases for revenue calculation
  const {
    data: rawPurchases,
    loading: loadingPurchases,
  } = usePaginatedQuery<any>({
    db,
    collectionName: "purchases",
    pageSize: 500,
    orderByField: "createdAt",
    orderByDirection: "desc",
    additionalConstraints: purchaseConstraints,
  });

  // Filter purchases to current month only
  const purchases = useMemo(() => {
    return rawPurchases.filter((p: any) => {
      const createdAt = p.createdAt;
      if (!createdAt) return false;

      let purchaseDate: Date;
      if (createdAt instanceof Date) {
        purchaseDate = createdAt;
      } else if (createdAt.toDate) {
        purchaseDate = createdAt.toDate();
      } else if (createdAt.seconds) {
        purchaseDate = new Date(createdAt.seconds * 1000);
      } else {
        return false;
      }

      return (
        purchaseDate >= currentMonthRange.start &&
        purchaseDate <= currentMonthRange.end
      );
    });
  }, [rawPurchases, currentMonthRange]);

  // Calculate stats from paginated data
  useEffect(() => {
    if (loadingUsers || loadingPurchases) {
      setLoading(true);
      return;
    }

    setLoading(false);

    // Calculate client stats
    const totalClients = users.length;
    const plansPending = users.filter(
      (u: any) => u.mealPlanStatus && u.mealPlanStatus !== MealPlanStatus.DELIVERED
    ).length;
    const plansDelivered = users.filter(
      (u: any) => u.mealPlanStatus === MealPlanStatus.DELIVERED
    ).length;

    // Calculate revenue for current month
    const revenueThisMonth = purchases.reduce((sum: number, purchase: any) => {
      return sum + (Number(purchase.amount) || 0);
    }, 0);

    setStats({
      totalClients,
      plansPending,
      plansDelivered,
      revenueThisMonth,
    });
  }, [users, purchases, loadingUsers, loadingPurchases]);

  return (
    <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Clients"
        value={stats.totalClients}
        isLoading={loading}
        delay={0}
      />
      <StatCard
        title="Plans Pending"
        value={stats.plansPending}
        isLoading={loading}
        isHighlight
        delay={0.1}
      />
      <StatCard
        title="Plans Delivered"
        value={stats.plansDelivered}
        isLoading={loading}
        delay={0.2}
      />
      <StatCard
        title="Revenue This Month"
        value={`$${stats.revenueThisMonth.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`}
        isLoading={loading}
        isHighlight
        delay={0.3}
      />
    </section>
  );
}
