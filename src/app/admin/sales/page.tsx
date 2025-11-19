"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminLayout from "@/components/admin/AdminLayout";
import { SkeletonCard } from "@/components/common/Skeleton";

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
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, "purchases"), (snapshot) => {
      const records: PurchaseRecord[] = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        const amount = Number(data?.amount ?? 0);
        const tier = (data?.planType ?? data?.tier ?? "Basic") as PurchaseRecord["tier"];
        const created = data?.createdAt?.toDate
          ? data.createdAt.toDate()
          : data?.createdAt instanceof Date
          ? data.createdAt
          : null;

        return {
          id: docSnapshot.id,
          amount: isFinite(amount) ? amount : 0,
          tier: ["Basic", "Pro", "Elite"].includes(tier) ? tier : "Basic",
          createdAt: created,
        };
      });
      setPurchases(records);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
    <AdminLayout>
      <div className="px-6 py-8 space-y-8">
        {/* Section 1: KPI Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} className="h-32" />
            ))
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
              >
                <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
                  Total Revenue
                </p>
                <p className="text-3xl font-bold text-white">
                  ${metrics.totalRevenue.toLocaleString()}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
              >
                <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
                  Last 30 Days
                </p>
                <p className="text-3xl font-bold text-[#D7263D]">
                  ${metrics.revenueLast30Days.toLocaleString()}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
              >
                <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
                  Total Purchases
                </p>
                <p className="text-3xl font-bold text-white">{metrics.totalPurchases}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
              >
                <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
                  Avg Purchase
                </p>
                <p className="text-3xl font-bold text-white">
                  ${metrics.avgPurchaseValue.toFixed(0)}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
              >
                <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
                  Active Users
                </p>
                <p className="text-3xl font-bold text-white">{metrics.activeUsers}</p>
              </motion.div>
            </>
          )}
        </div>

        {/* Section 3: Tier Breakdown */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="uppercase text-xs text-neutral-500 tracking-wide mb-6">Plan Breakdown</p>
          <div className="grid gap-6 sm:grid-cols-3">
            {(["Basic", "Pro", "Elite"] as const).map((tier) => (
              <motion.div
                key={tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
      </div>
    </AdminLayout>
  );
}
