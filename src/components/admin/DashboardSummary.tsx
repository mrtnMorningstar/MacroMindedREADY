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
};

function StatCard({ title, value, isLoading, isHighlight = false }: StatCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-3xl border border-border/70 bg-muted/60 p-6 shadow-lg">
        <div className="h-4 w-24 animate-pulse rounded bg-background/20 mb-3" />
        <div className="h-8 w-32 animate-pulse rounded bg-background/20" />
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      className={`rounded-3xl border p-6 shadow-lg transition ${
        isHighlight
          ? "border-accent/70 bg-muted/60 shadow-[0_0_60px_-35px_rgba(215,38,61,0.6)]"
          : "border-border/70 bg-muted/60"
      }`}
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-foreground/60">
        {title}
      </p>
      <p
        className={`mt-2 text-3xl font-bold uppercase tracking-[0.2em] ${
          isHighlight ? "text-accent" : "text-foreground"
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

  // Calculate current month start/end
  const currentMonthRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
  }, []);

  // Use paginated queries instead of full collection listeners
  // Load users for client stats (limit to recent users for performance)
  const {
    data: users,
    loading: loadingUsers,
  } = usePaginatedQuery<any>({
    db,
    collectionName: "users",
    pageSize: 100, // Load first 100 users for stats (sufficient for most dashboards)
    orderByField: "createdAt",
    orderByDirection: "desc",
    filterFn: (doc) => doc.role !== "admin", // Filter out admins for display purposes only
  });

  // Load purchases from current month only for revenue calculation
  // Use a wider range (last 90 days) to avoid index issues, then filter client-side
  const threeMonthsAgo = Timestamp.fromDate(
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  );

  const {
    data: rawPurchases,
    loading: loadingPurchases,
  } = usePaginatedQuery<any>({
    db,
    collectionName: "purchases",
    pageSize: 500, // Larger page size for monthly revenue
    orderByField: "createdAt",
    orderByDirection: "desc",
    additionalConstraints: [
      where("createdAt", ">=", threeMonthsAgo),
    ],
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
      />
      <StatCard
        title="Plans Pending"
        value={stats.plansPending}
        isLoading={loading}
        isHighlight
      />
      <StatCard
        title="Plans Delivered"
        value={stats.plansDelivered}
        isLoading={loading}
      />
      <StatCard
        title="Revenue This Month"
        value={`$${stats.revenueThisMonth.toFixed(2)}`}
        isLoading={loading}
        isHighlight
      />
    </section>
  );
}

