"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import {
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

const heroEase: [number, number, number, number] = [0.22, 1, 0.36, 1];
const containerVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: heroEase },
  },
};

const progressSteps = ["Not Started", "In Progress", "Delivered"] as const;
type MealPlanStatus = (typeof progressSteps)[number];

type Profile = {
  height?: string;
  weight?: string;
  age?: string;
  gender?: string;
  activityLevel?: string;
  goal?: string;
  dietaryRestrictions?: string;
  allergies?: string;
  preferences?: string;
};

type UserDashboardData = {
  packageTier?: string | null;
  mealPlanStatus?: MealPlanStatus | null;
  profile?: Profile | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        router.replace("/login");
        return;
      }

      const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const snapshot = await getDoc(userDocRef);
          if (!snapshot.exists()) {
            setData({});
          } else {
            const payload = snapshot.data() as UserDashboardData;
            setData(payload ?? {});
          }
        } catch (err) {
          console.error("Failed to load dashboard data:", err);
          setError("We couldn’t load your dashboard. Please refresh.");
          setData({});
        } finally {
          setLoading(false);
        }
      };

      void loadData();
    });

    return () => unsubscribe();
  }, [router]);

  const selectedStatus: MealPlanStatus = useMemo(() => {
    if (!data || !data.mealPlanStatus) return "Not Started";
    return progressSteps.includes(data.mealPlanStatus)
      ? data.mealPlanStatus
      : "Not Started";
  }, [data]);

  const statusIndex = progressSteps.indexOf(selectedStatus);

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  return (
    <div className="relative isolate min-h-screen bg-background text-foreground">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.1 }}
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -top-36 left-1/2 h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#161616_0%,rgba(0,0,0,0.92)_55%,#000000_95%)]" />
      </motion.div>

      <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 sm:py-20">
        <header className="flex flex-col gap-4 text-center sm:text-left sm:gap-2">
          <motion.span
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="font-display text-xs uppercase tracking-[0.5em] text-accent/90"
          >
            Macro Command Center
          </motion.span>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            transition={{ duration: 0.7, delay: 0.1, ease: heroEase }}
            className="flex flex-col items-center justify-between gap-4 sm:flex-row"
          >
            <div className="text-center sm:text-left">
              <h1 className="font-display text-3xl uppercase tracking-[0.24em] text-foreground sm:text-4xl">
                Your Nutrition Operations Hub
              </h1>
              <p className="mt-2 text-xs uppercase tracking-[0.32em] text-foreground/60 sm:text-sm">
                {user?.email
                  ? `Signed in as ${user.email}`
                  : "Stay in sync with your coaching team."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-border/80 bg-muted/60 px-5 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-foreground transition hover:border-accent hover:bg-accent hover:text-background"
            >
              Sign Out
            </button>
          </motion.div>
        </header>

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-6 sm:grid-cols-2"
          >
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard className="sm:col-span-2 h-56" />
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-accent/40 bg-muted/70 px-6 py-6 text-center text-xs font-semibold uppercase tracking-[0.3em] text-accent"
          >
            {error}
          </motion.div>
        ) : !data?.packageTier ? (
          <LockedPreview />
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            transition={{ duration: 0.7, delay: 0.1, ease: heroEase }}
            className="grid gap-8"
          >
            <StatusOverview
              status={selectedStatus}
              packageTier={data.packageTier}
            />
            <ProfileSummary profile={data.profile ?? {}} />
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <MealPlanPlaceholder />
              <ProgressTracker statusIndex={statusIndex} />
            </div>
          </motion.div>
        )}
      </section>
    </div>
  );
}

function LockedPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-border/80 bg-muted/60 px-10 py-16 text-center shadow-[0_0_90px_-45px_rgba(215,38,61,0.6)] backdrop-blur"
    >
      <div className="pointer-events-none absolute inset-x-0 -top-32 h-44 bg-gradient-to-b from-accent/45 via-accent/15 to-transparent blur-3xl" />
      <div className="relative flex flex-col items-center gap-6">
        <span className="font-display text-xs uppercase tracking-[0.45em] text-accent/90">
          Unlock Your Plan
        </span>
        <h2 className="max-w-3xl font-display text-3xl uppercase tracking-[0.24em]">
          Your personalized meal plans are waiting
        </h2>
        <p className="max-w-2xl text-xs uppercase tracking-[0.32em] text-foreground/60 sm:text-sm">
          Select a MacroMinded plan to unlock your dashboard, receive tailored
          macros, and access weekly coach check-ins.
        </p>
        <Link
          href="/packages"
          className="rounded-full border border-accent bg-accent px-8 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-background transition hover:border-foreground hover:bg-transparent hover:text-accent"
        >
          Buy a Plan
        </Link>
      </div>
    </motion.div>
  );
}

function StatusOverview({
  status,
  packageTier,
}: {
  status: MealPlanStatus;
  packageTier?: string | null;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-muted/60 px-8 py-10 shadow-[0_0_90px_-45px_rgba(215,38,61,0.6)] backdrop-blur">
      <div className="pointer-events-none absolute inset-x-0 -top-28 h-40 bg-gradient-to-b from-accent/45 via-accent/15 to-transparent blur-3xl" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-display text-xs uppercase tracking-[0.45em] text-accent">
            Plan Status
          </span>
          <h3 className="mt-4 font-display text-3xl uppercase tracking-[0.24em]">
            {status}
          </h3>
          <p className="mt-2 text-xs uppercase tracking-[0.28em] text-foreground/60 sm:text-sm">
            Package tier:{" "}
            <span className="text-foreground/90">{packageTier ?? "Unknown"}</span>
          </p>
        </div>
        <div className="flex gap-4">
          {progressSteps.map((step, index) => {
            const isActive = progressSteps.indexOf(status) >= index;
            return (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`relative flex min-w-[120px] flex-col items-center rounded-2xl border px-4 py-4 text-center text-[0.6rem] uppercase tracking-[0.3em] ${
                  isActive
                    ? "border-accent bg-accent/20 text-accent"
                    : "border-border/70 bg-background/20 text-foreground/40"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span className="mt-3">{step}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ProfileSummary({ profile }: { profile: Profile }) {
  const entries = Object.entries(profile).filter(
    ([, value]) => value && String(value).trim() !== ""
  );

  if (entries.length === 0) {
    return (
      <div className="rounded-3xl border border-border/80 bg-muted/60 px-8 py-10 text-center text-xs uppercase tracking-[0.3em] text-foreground/50 backdrop-blur">
        No profile metrics yet. Complete the macro intake form to unlock custom
        insights.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border/80 bg-muted/60 px-8 py-10 backdrop-blur">
      <h3 className="font-display text-xs uppercase tracking-[0.45em] text-accent">
        Athlete Profile
      </h3>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map(([key, value]) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/30 px-6 py-6 text-xs uppercase tracking-[0.3em] text-foreground/80"
          >
            <span className="text-foreground/50">
              {key.replace(/([A-Z])/g, " $1").toUpperCase()}
            </span>
            <span className="text-sm tracking-[0.18em] text-foreground">
              {value}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function MealPlanPlaceholder() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-muted/60 px-8 py-10 backdrop-blur">
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-32 bg-gradient-to-b from-accent/35 via-accent/10 to-transparent blur-3xl" />
      <div className="relative flex flex-col gap-4">
        <h3 className="font-display text-xs uppercase tracking-[0.45em] text-accent">
          Meal Plan Delivery
        </h3>
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/60 sm:text-sm">
          Once your plan is ready, it will appear here as a downloadable file.
          Watch your inbox for coach updates.
        </p>
        <div className="mt-4 flex h-36 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/20 text-[0.65rem] uppercase tracking-[0.3em] text-foreground/50">
          Meal plan file pending upload
        </div>
      </div>
    </div>
  );
}

function ProgressTracker({ statusIndex }: { statusIndex: number }) {
  return (
    <div className="rounded-3xl border border-border/80 bg-muted/60 px-8 py-10 backdrop-blur">
      <h3 className="font-display text-xs uppercase tracking-[0.45em] text-accent">
        Progress Tracker
      </h3>
      <div className="mt-6 flex flex-col gap-4">
        {progressSteps.map((step, index) => {
          const isReached = index <= statusIndex;
          return (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.15 }}
              className="flex items-center gap-3"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-xs font-semibold uppercase tracking-[0.28em] ${
                  isReached
                    ? "border-accent bg-accent text-background"
                    : "border-border/60 bg-background/20 text-foreground/50"
                }`}
              >
                {index + 1}
              </span>
              <div className="flex-1 rounded-2xl border border-border/60 bg-background/20 px-4 py-3 text-[0.65rem] uppercase tracking-[0.3em] text-foreground/70">
                {step}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-48 animate-pulse rounded-3xl border border-border/70 bg-muted/40 ${className}`}
    />
  );
}


