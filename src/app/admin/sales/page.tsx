"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { collection, getDocs, doc, getDoc, type DocumentData } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

import { auth, db } from "@/lib/firebase";

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

const containerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const tiers: Array<PurchaseRecord["tier"]> = ["Basic", "Pro", "Elite"];
const baseBackground = "bg-[radial-gradient(circle_at_top,#161616_0%,rgba(0,0,0,0.92)_60%,#000_98%)]";

export default function AdminSalesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        setCheckingAuth(false);
        return;
      }
      try {
        const docRef = doc(db, "users", currentUser.uid);
        const currentSnapshot = await getDoc(docRef);
        const role = currentSnapshot.data()?.role;

        if (role !== "admin") {
          router.replace("/dashboard");
          setCheckingAuth(false);
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Failed to verify admin role:", error);
        router.replace("/dashboard");
        setCheckingAuth(false);
        return;
      } finally {
        setCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!isAdmin) return;

    const loadPurchases = async () => {
      setLoading(true);
      setError(null);
      try {
        const purchasesRef = collection(db, "purchases");
        const snapshot = await getDocs(purchasesRef);
        const records: PurchaseRecord[] = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data() as DocumentData;
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
            tier: tiers.includes(tier) ? tier : "Basic",
            createdAt: created,
          };
        });
        setPurchases(records);
      } catch (fetchError) {
        console.error("Failed to fetch purchases", fetchError);
        setError("Unable to load sales data.");
      } finally {
        setLoading(false);
      }
    };

    void loadPurchases();
  }, [isAdmin]);

  const totals = useMemo(() => {
    const metrics: Record<PurchaseRecord["tier"], TierMetrics> = {
      Basic: { count: 0, revenue: 0 },
      Pro: { count: 0, revenue: 0 },
      Elite: { count: 0, revenue: 0 },
    };

    let totalRevenue = 0;

    purchases.forEach((purchase) => {
      totalRevenue += purchase.amount;
      metrics[purchase.tier].count += 1;
      metrics[purchase.tier].revenue += purchase.amount;
    });

    return {
      totalRevenue,
      metrics,
      customers: new Set(purchases.map((purchase) => purchase.id)).size,
    };
  }, [purchases]);

  const revenueSeries = useMemo(() => {
    const points: Array<{ label: string; value: number }> = [];
    const today = new Date();
    const dayMillis = 1000 * 60 * 60 * 24;

    for (let i = 29; i >= 0; i -= 1) {
      const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const dayEnd = new Date(dayStart.getTime() + dayMillis);
      const value = purchases
        .filter((purchase) => {
          if (!purchase.createdAt) return false;
          return purchase.createdAt >= dayStart && purchase.createdAt < dayEnd;
        })
        .reduce((sum, purchase) => sum + purchase.amount, 0);

      points.push({ label: dayStart.toLocaleDateString(undefined, { month: "short", day: "numeric" }), value });
    }

    const max = Math.max(...points.map((point) => point.value), 1);

    return { points, max };
  }, [purchases]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">
          Validating access...
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="hidden h-[calc(100vh-5rem)] w-64 flex-col border-r border-border/70 bg-muted/40 px-6 py-10 shadow-[0_0_80px_-40px_rgba(215,38,61,0.6)] backdrop-blur lg:fixed lg:left-0 lg:top-20 lg:flex"
      >
        <span className="font-bold uppercase tracking-[0.48em] text-foreground">
          MacroMinded
        </span>
        <p className="mt-2 text-[0.65rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
          Admin navigation
        </p>

        <nav className="mt-10 flex-1 overflow-y-auto pr-1">
          <div className="flex flex-col gap-3">
            <Link
              href="/admin"
              className={`rounded-full border px-4 py-2 text-left text-[0.65rem] uppercase tracking-[0.3em] transition ${
                pathname === "/admin"
                  ? "border-accent/60 bg-accent/20 text-accent"
                  : "border-border/70 text-foreground/70 hover:border-accent hover:text-accent"
              }`}
            >
              Users
            </Link>
            <Link
              href="/admin/referrals"
              className={`rounded-full border px-4 py-2 text-left text-[0.65rem] uppercase tracking-[0.3em] transition ${
                pathname === "/admin/referrals"
                  ? "border-accent/60 bg-accent/20 text-accent"
                  : "border-border/70 text-foreground/70 hover:border-accent hover:text-accent"
              }`}
            >
              Referrals
            </Link>
            <Link
              href="/admin/recipes"
              className={`rounded-full border px-4 py-2 text-left text-[0.65rem] uppercase tracking-[0.3em] transition ${
                pathname === "/admin/recipes"
                  ? "border-accent/60 bg-accent/20 text-accent"
                  : "border-border/70 text-foreground/70 hover-border-accent hover:text-accent"
              }`}
            >
              Recipes
            </Link>
            <Link
              href="/admin/sales"
              className={`rounded-full border px-4 py-2 text-left text-[0.65rem] uppercase tracking-[0.3em] transition ${
                pathname === "/admin/sales"
                  ? "border-accent/60 bg-accent/20 text-accent"
                  : "border-border/70 text-foreground/70 hover:border-accent hover:text-accent"
              }`}
            >
              Sales / Revenue
            </Link>
            <Link
              href="/admin/requests"
              className={`rounded-full border px-4 py-2 text-left text-[0.65rem] uppercase tracking-[0.3em] transition ${
                pathname === "/admin/requests"
                  ? "border-accent/60 bg-accent/20 text-accent"
                  : "border-border/70 text-foreground/70 hover:border-accent hover:text-accent"
              }`}
            >
              Plan Requests
            </Link>
          </div>
        </nav>
      </motion.aside>

      <div className="relative isolate flex-1 lg:ml-64">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1 }}
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute -top-36 left-1/2 h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-accent/30 blur-3xl" />
          <div className={`absolute inset-0 ${baseBackground}`} />
        </motion.div>

        <div className="relative flex flex-col gap-10 px-6 py-10 sm:py-16 lg:px-10">
          <header className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-muted/60 px-6 py-6 shadow-[0_0_70px_-35px_rgba(215,38,61,0.6)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-bold text-2xl uppercase tracking-[0.32em] text-foreground sm:text-3xl">
                Sales & Revenue
              </h1>
              <p className="mt-2 text-[0.7rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
                Overview of MacroMinded plan purchases.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="rounded-full border border-border/70 px-4 py-2 text-[0.6rem] font-medium uppercase tracking-[0.3em] text-foreground/70">
                Customers: {totals.customers}
              </div>
              <button
                type="button"
                onClick={async () => {
                  await auth.signOut();
                  router.replace("/login");
                }}
                className="rounded-full border border-accent bg-accent px-4 py-2 text-[0.6rem] font-medium uppercase tracking-[0.3em] text-background transition hover:bg-transparent hover:text-accent"
              >
                Logout
              </button>
            </div>
          </header>

      {error && (
        <div className="rounded-3xl border border-border/70 bg-muted/70 px-6 py-4 text-center text-xs font-medium uppercase tracking-[0.28em] text-foreground/70">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-3xl border border-border/80 bg-muted/40"
            />
          ))}
        </div>
      ) : (
        <>
          <motion.section
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.02 }}
            className="rounded-3xl border border-border/70 bg-muted/60 px-6 py-8 shadow-[0_0_90px_-45px_rgba(215,38,61,0.6)] backdrop-blur"
          >
            <h2 className="font-bold text-xl uppercase tracking-[0.32em] text-foreground">
              Total Revenue
            </h2>
            <p className="mt-2 text-4xl font-bold uppercase tracking-[0.18em] text-foreground">
              ${totals.totalRevenue.toFixed(2)}
            </p>
            <p className="mt-1 text-[0.7rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
              Combined across all plans.
            </p>
          </motion.section>
          <motion.section
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="grid gap-4 sm:grid-cols-3"
          >
            {tiers.map((tier) => (
              <motion.div
                key={tier}
                whileHover={{ scale: 1.02 }}
                className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-muted/60 px-6 py-6 shadow-[0_0_70px_-40px_rgba(215,38,61,0.6)] backdrop-blur"
              >
                <h3 className="font-bold uppercase tracking-[0.32em] text-foreground">
                  {tier} Plan
                </h3>
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
                  Customers: {totals.metrics[tier].count}
                </p>
                <p className="text-xl font-bold uppercase tracking-[0.2em] text-foreground">
                  ${totals.metrics[tier].revenue.toFixed(2)}
                </p>
              </motion.div>
            ))}
          </motion.section>

          <motion.section
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.02 }}
            className="rounded-3xl border border-border/70 bg-muted/60 px-6 py-8 shadow-[0_0_90px_-45px_rgba(215,38,61,0.6)] backdrop-blur"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-bold text-xl uppercase tracking-[0.32em] text-foreground">
                30-Day Revenue Trend
              </h2>
              <span className="text-[0.7rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
                Placeholder chart — live analytics coming soon
              </span>
            </div>
            <div className="mt-6 h-48 rounded-2xl border border-border/70 bg-background/10 px-4 py-4">
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="h-full w-full text-foreground/70"
              >
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  points={revenueSeries.points
                    .map((point, index) => {
                      const x = (index / (revenueSeries.points.length - 1 || 1)) * 100;
                      const normalized = revenueSeries.max
                        ? 100 - (point.value / revenueSeries.max) * 80 - 10
                        : 90;
                      const y = Math.max(Math.min(normalized, 95), 5);
                      return `${x},${y}`;
                    })
                    .join(" ")}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </motion.section>
        </>
      )}
        </div>
      </div>
    </div>
  );
}
