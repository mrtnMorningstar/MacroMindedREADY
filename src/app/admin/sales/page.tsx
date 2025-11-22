"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { Timestamp, where } from "firebase/firestore";
import StatCard from "@/components/admin/StatCard";

type PurchaseRecord = {
  id: string;
  amount: number;
  tier: "Basic" | "Pro" | "Elite";
  createdAt?: Date | null;
};

type TierMetrics = {
  count: number;
  revenue: number;
};

export default function AdminSalesPage() {
  // Limit to purchases from the last year for metrics calculation
  // This reduces database reads while still providing accurate metrics
  const oneYearAgo = Timestamp.fromDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000));

  const {
    data: rawPurchases,
    loading,
    loadingMore,
    hasMore,
    loadMore,
  } = usePaginatedQuery<any>({
    db,
    collectionName: "purchases",
    pageSize: 100, // Larger page size for metrics
    orderByField: "createdAt",
    orderByDirection: "desc",
    additionalConstraints: [
      where("createdAt", ">=", oneYearAgo),
    ],
  });

  // Transform purchases
  const purchases = useMemo(() => {
    return rawPurchases.map((p: any) => {
      const amount = Number(p?.amount ?? 0);
      const tier = (p?.planType ?? p?.tier ?? "Basic") as PurchaseRecord["tier"];
      const created = p?.createdAt?.toDate
        ? p.createdAt.toDate()
        : p?.createdAt instanceof Date
        ? p.createdAt
        : null;

      return {
        id: p.id,
        amount: isFinite(amount) ? amount : 0,
        tier: ["Basic", "Pro", "Elite"].includes(tier) ? tier : "Basic",
        createdAt: created,
      };
    });
  }, [rawPurchases]);

  const metrics = useMemo(() => {
    const tierMetrics: Record<PurchaseRecord["tier"], TierMetrics> = {
      Basic: { count: 0, revenue: 0 },
      Pro: { count: 0, revenue: 0 },
      Elite: { count: 0, revenue: 0 },
    };

    let totalRevenue = 0;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let revenueLast30Days = 0;
    let activeUsers = new Set<string>();

    purchases.forEach((purchase) => {
      totalRevenue += purchase.amount;
      tierMetrics[purchase.tier].count += 1;
      tierMetrics[purchase.tier].revenue += purchase.amount;

      if (purchase.createdAt && purchase.createdAt.getTime() >= thirtyDaysAgo) {
        revenueLast30Days += purchase.amount;
        activeUsers.add(purchase.id);
      }
    });

    const avgPurchaseValue =
      purchases.length > 0 ? totalRevenue / purchases.length : 0;

    return {
      totalRevenue,
      revenueLast30Days,
      tierMetrics,
      totalPurchases: purchases.length,
      avgPurchaseValue,
      activeUsers: activeUsers.size,
    };
  }, [purchases]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-6"
    >
      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Revenue"
          value={`$${metrics.totalRevenue.toLocaleString()}`}
          isLoading={loading}
          delay={0}
        />
        <StatCard
          title="Last 30 Days"
          value={`$${metrics.revenueLast30Days.toLocaleString()}`}
          isLoading={loading}
          isHighlight
          delay={0.1}
        />
        <StatCard
          title="Total Purchases"
          value={metrics.totalPurchases}
          isLoading={loading}
          delay={0.2}
        />
        <StatCard
          title="Avg Purchase"
          value={`$${metrics.avgPurchaseValue.toFixed(0)}`}
          isLoading={loading}
          delay={0.3}
        />
        <StatCard
          title="Active Users"
          value={metrics.activeUsers}
          isLoading={loading}
          delay={0.4}
        />
      </div>

      {/* Tier Breakdown */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <p className="uppercase text-xs text-neutral-500 tracking-wide mb-6">Plan Breakdown</p>
        <div className="grid gap-6 sm:grid-cols-3">
          {(["Basic", "Pro", "Elite"] as const).map((tier, index) => (
            <motion.div
              key={tier}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="rounded-xl border border-neutral-800 bg-neutral-800/50 p-6"
            >
              <p className="text-sm uppercase tracking-wide text-neutral-500 mb-4">{tier} Plan</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Purchases</p>
                  <p className="text-2xl font-bold text-white">
                    {loading ? "—" : metrics.tierMetrics[tier].count}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Revenue</p>
                  <p className="text-2xl font-bold text-[#D7263D]">
                    {loading ? "—" : `$${metrics.tierMetrics[tier].revenue.toLocaleString()}`}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Load More Button (if needed for detailed view) */}
      {hasMore && (
        <div>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full rounded-lg border border-[#D7263D] bg-[#D7263D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? "Loading..." : "Load More Purchases (Last Year)"}
          </button>
        </div>
      )}
    </motion.div>
  );
}
