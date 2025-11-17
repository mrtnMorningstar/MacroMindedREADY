"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { db } from "@/lib/firebase";
import { AdminSidebar, useSidebar } from "@/components/admin";

type PurchaseRecord = {
  id: string;
  amount: number;
  planType: string;
  createdAt?: { toDate?: () => Date; seconds?: number } | Date | null;
  userId: string;
};

type UserRecord = {
  id: string;
  mealPlanStatus?: string | null;
  purchaseDate?: { toDate?: () => Date; seconds?: number } | Date | null;
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

function SkeletonChart({ height = 300 }: { height?: number }) {
  return (
    <div className="h-[300px] w-full animate-pulse rounded-3xl border border-border/70 bg-muted/60">
      <div className="h-full w-full bg-background/20" />
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch purchases
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "purchases"),
      (snapshot) => {
        const records: PurchaseRecord[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            amount: data?.amount ?? 0,
            planType: data?.planType ?? data?.tier ?? "Basic",
            createdAt: data?.createdAt ?? null,
            userId: data?.userId ?? "",
          };
        });
        setPurchases(records);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load purchases:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch users
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const records: UserRecord[] = snapshot.docs
          .filter((doc) => {
            const data = doc.data();
            return data?.role !== "admin";
          })
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              mealPlanStatus: data?.mealPlanStatus ?? null,
              purchaseDate: data?.purchaseDate ?? null,
            };
          });
        setUsers(records);
      },
      (error) => {
        console.error("Failed to load users:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Calculate monthly revenue
  const monthlyRevenue = useMemo(() => {
    const revenueByMonth: Record<string, { month: string; revenue: number }> = {};
    const now = new Date();
    const last12Months: string[] = [];

    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      last12Months.push(monthKey);
      revenueByMonth[monthKey] = { month: monthLabel, revenue: 0 };
    }

    purchases.forEach((purchase) => {
      const purchaseDate = parseFirestoreDate(purchase.createdAt);
      if (!purchaseDate) return;

      const monthKey = `${purchaseDate.getFullYear()}-${String(purchaseDate.getMonth() + 1).padStart(2, "0")}`;
      if (revenueByMonth[monthKey]) {
        revenueByMonth[monthKey].revenue += purchase.amount || 0;
      }
    });

    return last12Months.map((key) => revenueByMonth[key] || { month: key, revenue: 0 });
  }, [purchases]);

  // Calculate plan type distribution
  const planDistribution = useMemo(() => {
    const distribution: Record<string, number> = {
      Basic: 0,
      Pro: 0,
      Elite: 0,
    };

    purchases.forEach((purchase) => {
      const planType = purchase.planType || "Basic";
      if (distribution[planType] !== undefined) {
        distribution[planType]++;
      } else {
        distribution.Basic++;
      }
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
    }));
  }, [purchases]);

  // Calculate active clients
  const activeClients = useMemo(() => {
    const now = Date.now();
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

    return users.filter((user) => {
      if (user.mealPlanStatus !== "Delivered") return false;

      const purchaseDate = parseFirestoreDate(user.purchaseDate);
      if (!purchaseDate) return false;

      return purchaseDate.getTime() >= ninetyDaysAgo;
    }).length;
  }, [users]);

  const { isOpen, isMobile } = useSidebar();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminSidebar />

      <div className={`relative isolate flex-1 transition-all duration-300 ${!isMobile && isOpen ? "lg:ml-64" : ""}`}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1 }}
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute -top-36 left-1/2 h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#161616_0%,rgba(0,0,0,0.92)_55%,#000000_95%)]" />
        </motion.div>

        <div className="relative flex flex-col gap-10 px-6 py-10 sm:py-16 lg:px-10">
          <header className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-muted/60 px-6 py-6 shadow-[0_0_70px_-35px_rgba(215,38,61,0.6)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-bold text-2xl uppercase tracking-[0.32em] text-foreground sm:text-3xl">
                Analytics & Stats
              </h1>
              <p className="mt-2 text-[0.7rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
                Revenue trends and client insights
              </p>
            </div>
          </header>

          {/* Active Clients Stat Card */}
          <div className="rounded-3xl border border-accent/70 bg-muted/60 px-8 py-8 shadow-[0_0_60px_-35px_rgba(215,38,61,0.6)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-foreground/60">
                  Active Clients
                </p>
                <p className="mt-2 text-4xl font-bold uppercase tracking-[0.2em] text-accent">
                  {loading ? (
                    <span className="inline-block h-10 w-20 animate-pulse rounded bg-accent/20"></span>
                  ) : (
                    activeClients
                  )}
                </p>
                <p className="mt-2 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-foreground/50">
                  Delivered plans with purchase in last 90 days
                </p>
              </div>
              <div className="text-5xl">📊</div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Monthly Revenue Line Chart */}
            <div className="rounded-3xl border border-border/70 bg-muted/60 px-6 py-6 shadow-[0_0_60px_-30px_rgba(215,38,61,0.6)] backdrop-blur">
              <h3 className="mb-6 text-lg font-bold uppercase tracking-[0.2em] text-foreground">
                Monthly Revenue
              </h3>
              {loading ? (
                <SkeletonChart />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                    <XAxis
                      dataKey="month"
                      stroke="#666"
                      style={{ fontSize: "0.7rem" }}
                      tick={{ fill: "#999" }}
                    />
                    <YAxis
                      stroke="#666"
                      style={{ fontSize: "0.7rem" }}
                      tick={{ fill: "#999" }}
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #333",
                        borderRadius: "0.5rem",
                        color: "#fff",
                      }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#D7263D"
                      strokeWidth={2}
                      dot={{ fill: "#D7263D", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Plan Type Distribution Pie Chart */}
            <div className="rounded-3xl border border-border/70 bg-muted/60 px-6 py-6 shadow-[0_0_60px_-30px_rgba(215,38,61,0.6)] backdrop-blur">
              <h3 className="mb-6 text-lg font-bold uppercase tracking-[0.2em] text-foreground">
                Plan Type Distribution
              </h3>
              {loading ? (
                <SkeletonChart />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={planDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={100}
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
                        border: "1px solid #333",
                        borderRadius: "0.5rem",
                        color: "#fff",
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "0.75rem", color: "#999" }}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

