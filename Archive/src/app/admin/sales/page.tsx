"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { Timestamp, where } from "firebase/firestore";
import StatCard from "@/components/admin/StatCard";
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  FireIcon,
} from "@heroicons/react/24/outline";

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
    pageSize: 100,
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
      className="flex flex-col gap-8"
    >
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <h2 className="text-3xl font-bold text-white font-display tracking-tight">
          Revenue
        </h2>
        <p className="text-sm text-neutral-400">
          Track sales performance and revenue metrics
        </p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Revenue"
          value={`$${metrics.totalRevenue.toLocaleString()}`}
          isLoading={loading}
          delay={0}
          icon={<CurrencyDollarIcon className="h-6 w-6" />}
        />
        <StatCard
          title="Last 30 Days"
          value={`$${metrics.revenueLast30Days.toLocaleString()}`}
          isLoading={loading}
          isHighlight
          delay={0.1}
          icon={<ChartBarIcon className="h-6 w-6" />}
        />
        <StatCard
          title="Total Purchases"
          value={metrics.totalPurchases}
          isLoading={loading}
          delay={0.2}
          icon={<ShoppingBagIcon className="h-6 w-6" />}
        />
        <StatCard
          title="Avg Purchase"
          value={`$${metrics.avgPurchaseValue.toFixed(0)}`}
          isLoading={loading}
          delay={0.3}
          icon={<FireIcon className="h-6 w-6" />}
        />
        <StatCard
          title="Active Users"
          value={metrics.activeUsers}
          isLoading={loading}
          delay={0.4}
          icon={<UserGroupIcon className="h-6 w-6" />}
        />
      </div>

      {/* Tier Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl border border-neutral-800/50 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 shadow-xl"
      >
        <p className="uppercase text-xs font-bold text-neutral-500 tracking-[0.2em] mb-6">
          Plan Breakdown
        </p>
        <div className="grid gap-6 sm:grid-cols-3">
          {(["Basic", "Pro", "Elite"] as const).map((tier, index) => (
            <motion.div
              key={tier}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="rounded-xl border border-neutral-800/50 bg-gradient-to-br from-neutral-800/30 to-neutral-900/50 p-6 hover:border-[#D7263D]/30 transition-all duration-300"
            >
              <p className="text-sm uppercase tracking-[0.2em] text-neutral-500 mb-6 font-bold">
                {tier} Plan
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-neutral-500 mb-2 uppercase tracking-wide">
                    Purchases
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {loading ? "—" : metrics.tierMetrics[tier].count}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-2 uppercase tracking-wide">
                    Revenue
                  </p>
                  <p className="text-3xl font-bold text-[#D7263D]">
                    {loading ? "—" : `$${metrics.tierMetrics[tier].revenue.toLocaleString()}`}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Load More Button */}
      {hasMore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full rounded-xl border border-[#D7263D] bg-[#D7263D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90 hover:shadow-[0_0_20px_-10px_rgba(215,38,61,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? "Loading..." : "Load More Purchases (Last Year)"}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
