"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { db } from "@/lib/firebase";
import AdminLayout from "@/components/admin/AdminLayout";
import { SkeletonCard } from "@/components/common/Skeleton";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { Timestamp, where } from "firebase/firestore";

type PurchaseRecord = {
  id: string;
  amount: number;
  planType: string;
  createdAt?: Date | null;
  userId: string;
};

const COLORS = ["#D7263D", "#1a1a1a", "#262626", "#404040"];

const parseFirestoreDate = (date?: { toDate?: () => Date; seconds?: number } | Date | null): Date | null => {
  if (!date) return null;
  if (date instanceof Date) return date;
  if (typeof (date as { toDate?: () => Date }).toDate === "function") {
    return (date as { toDate: () => Date }).toDate();
  }
  if (typeof (date as { seconds?: number }).seconds === "number") {
    const value = date as { seconds: number; nanoseconds?: number };
    return new Date(value.seconds * 1000 + Math.floor((value.nanoseconds ?? 0) / 1_000_000));
  }
  return null;
};

export default function AdminAnalyticsPage() {
  // Limit to purchases from the last year for analytics
  // This reduces database reads while still providing accurate charts
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
    pageSize: 100, // Larger page size for analytics
    orderByField: "createdAt",
    orderByDirection: "desc",
    additionalConstraints: [
      where("createdAt", ">=", oneYearAgo),
    ],
  });

  // Transform purchases
  const purchases = useMemo(() => {
    return rawPurchases.map((p: any) => ({
      id: p.id,
      amount: Number(p?.amount ?? 0),
      planType: p?.planType ?? "Basic",
      createdAt: parseFirestoreDate(p?.createdAt),
      userId: p?.userId ?? "",
    }));
  }, [rawPurchases]);

  const revenueData = useMemo(() => {
    const today = new Date();
    const data: Array<{ date: string; revenue: number }> = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const revenue = purchases
        .filter((p) => {
          if (!p.createdAt) return false;
          const purchaseDate = new Date(p.createdAt);
          return (
            purchaseDate.getDate() === date.getDate() &&
            purchaseDate.getMonth() === date.getMonth() &&
            purchaseDate.getFullYear() === date.getFullYear()
          );
        })
        .reduce((sum, p) => sum + p.amount, 0);

      data.push({ date: dateStr, revenue });
    }

    return data;
  }, [purchases]);

  const planDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    purchases.forEach((p) => {
      const plan = p.planType || "Basic";
      distribution[plan] = (distribution[plan] || 0) + 1;
    });

    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [purchases]);

  return (
    <AdminLayout>
      {/* Revenue Chart */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <p className="uppercase text-xs text-neutral-500 tracking-wide mb-4">Revenue (Last 30 Days)</p>
        {loading ? (
          <SkeletonCard className="h-64" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #404040",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#D7263D"
                strokeWidth={2}
                dot={{ fill: "#D7263D" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Plan Distribution Chart */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <p className="uppercase text-xs text-neutral-500 tracking-wide mb-4">Plan Distribution</p>
        {loading ? (
          <SkeletonCard className="h-64" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={planDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {planDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #404040",
                  borderRadius: "8px",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Load More Button (if needed) */}
      {hasMore && (
        <div className="mt-6">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full rounded-lg border border-[#D7263D] bg-[#D7263D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? "Loading..." : "Load More Purchase Data (Last Year)"}
          </button>
        </div>
      )}
    </AdminLayout>
  );
}
