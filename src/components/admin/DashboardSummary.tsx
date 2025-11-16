"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { collection, onSnapshot, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

  // Subscribe to users collection
  useEffect(() => {
    setLoading(true);
    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const users = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Array<DocumentData & { role?: string; mealPlanStatus?: string }>;

        // Filter out admins
        const clients = users.filter((u) => u.role !== "admin");

        // Calculate stats
        const totalClients = clients.length;
        const plansPending = clients.filter(
          (u) => u.mealPlanStatus && u.mealPlanStatus !== "Delivered"
        ).length;
        const plansDelivered = clients.filter(
          (u) => u.mealPlanStatus === "Delivered"
        ).length;

        setStats((prev) => ({
          ...prev,
          totalClients,
          plansPending,
          plansDelivered,
        }));
      },
      (error) => {
        console.error("Error loading users:", error);
        setLoading(false);
      }
    );

    return () => unsubscribeUsers();
  }, []);

  // Subscribe to purchases collection for revenue
  useEffect(() => {
    const unsubscribePurchases = onSnapshot(
      collection(db, "purchases"),
      (snapshot) => {
        const purchases = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            amount: data.amount ?? 0,
            createdAt: data.createdAt,
          };
        }) as Array<{
          id: string;
          amount: number;
          createdAt?: { toDate?: () => Date; seconds?: number } | Date | null;
        }>;

        // Calculate revenue for current month
        const revenueThisMonth = purchases.reduce((sum, purchase) => {
          if (!purchase.createdAt) return sum;

          let purchaseDate: Date;
          if (purchase.createdAt instanceof Date) {
            purchaseDate = purchase.createdAt;
          } else if (typeof purchase.createdAt.toDate === "function") {
            purchaseDate = purchase.createdAt.toDate();
          } else if (typeof purchase.createdAt.seconds === "number") {
            purchaseDate = new Date(purchase.createdAt.seconds * 1000);
          } else {
            return sum;
          }

          if (
            purchaseDate >= currentMonthRange.start &&
            purchaseDate <= currentMonthRange.end
          ) {
            return sum + (purchase.amount || 0);
          }
          return sum;
        }, 0);

        setStats((prev) => ({
          ...prev,
          revenueThisMonth,
        }));
        setLoading(false);
      },
      (error) => {
        console.error("Error loading purchases:", error);
        setLoading(false);
      }
    );

    return () => unsubscribePurchases();
  }, [currentMonthRange]);

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

