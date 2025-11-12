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
import { doc, getDoc, type Timestamp } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { getActivePurchase } from "@/lib/purchases";
import MealPlanGallery from "@/components/MealPlanGallery";

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
  mealPlanFileURL?: string | null;
  mealPlanImageURLs?: string[] | null;
  mealPlanDeliveredAt?: Timestamp | { seconds: number; nanoseconds: number } | Date | null;
  groceryListURL?: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<UserDashboardData | null>(null);
  const [purchase, setPurchase] = useState<any>(null);
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
          const activePurchase = await getActivePurchase(firebaseUser.uid);
          setPurchase(activePurchase);

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
          setError("We couldn't load your dashboard. Please refresh.");
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

  const deliveredAtDate = useMemo(() => {
    const value = data?.mealPlanDeliveredAt;
    if (!value) return null;

    if (value instanceof Date) {
      return value;
    }

    if (typeof (value as Timestamp).toDate === "function") {
      return (value as Timestamp).toDate();
    }

    if (
      typeof (value as { seconds: number }).seconds === "number" &&
      typeof (value as { nanoseconds: number }).nanoseconds === "number"
    ) {
      const { seconds, nanoseconds } = value as {
        seconds: number;
        nanoseconds: number;
      };
      return new Date(seconds * 1000 + Math.floor(nanoseconds / 1_000_000));
    }

    return null;
  }, [data?.mealPlanDeliveredAt]);

  const daysSinceDelivery = useMemo(() => {
    if (!deliveredAtDate) return null;
    const diffMs = Date.now() - deliveredAtDate.getTime();
    if (diffMs < 0) {
      return 0;
    }
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }, [deliveredAtDate]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const goal = data?.profile?.goal ?? null;

  const nextCheckInDate = useMemo(() => {
    if (!deliveredAtDate) return null;
    const tier = data?.packageTier ?? "";
    if (!["Pro", "Elite"].includes(tier)) return null;
    const daysToAdd = tier === "Elite" ? 7 : 7;
    const next = new Date(deliveredAtDate);
    next.setDate(next.getDate() + daysToAdd);
    return next;
  }, [deliveredAtDate, data?.packageTier]);

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
            className="font-medium uppercase tracking-[0.45em] text-foreground/70"
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
              <h1 className="font-bold text-3xl uppercase tracking-[0.22em] text-foreground sm:text-4xl">
                Your Nutrition Operations Hub
              </h1>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.3em] text-foreground/60 sm:text-sm">
                {user?.email
                  ? `Signed in as ${user.email}`
                  : "Stay in sync with your coaching team."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-border/70 px-5 py-2 text-xs font-medium uppercase tracking-[0.3em] text-foreground/70 transition hover:border-accent hover:text-accent"
            >
              Sign Out
            </button>
          </motion.div>
        </header>

        <DashboardMetrics
          goal={goal}
          daysSinceDelivery={daysSinceDelivery}
          nextCheckInDate={nextCheckInDate}
        />

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
        ) : !purchase ? (
          <LockedDashboardScreen />
        ) : !data ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-accent/40 bg-muted/70 px-6 py-6 text-center text-xs font-semibold uppercase tracking-[0.3em] text-accent"
          >
            Unable to load dashboard data. Please refresh.
          </motion.div>
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
              <MealPlanSection
                status={selectedStatus}
                fileUrl={data.mealPlanFileURL}
                imageUrls={data.mealPlanImageURLs}
                daysSinceDelivery={daysSinceDelivery}
                groceryListUrl={data.groceryListURL}
              />
              <ProgressTracker statusIndex={statusIndex} />
            </div>
          </motion.div>
        )}
      </section>
        </div>
  );
}

function LockedDashboardScreen() {
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
          Awaiting payment confirmation
          </h2>
        <p className="max-w-2xl text-xs uppercase tracking-[0.32em] text-foreground/60 sm:text-sm">
          Your dashboard will unlock once your payment is confirmed. Refresh in
          about 30 seconds after completing checkout.
        </p>
        <Link
          href="/packages"
          className="rounded-full border border-accent bg-accent px-8 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-background transition hover:border-foreground hover:bg-transparent hover:text-accent"
        >
          View Packages
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
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden rounded-3xl border border-border/70 bg-muted/60 px-8 py-8 shadow-[0_0_60px_-35px_rgba(215,38,61,0.6)] backdrop-blur"
    >
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-32 bg-gradient-to-b from-background/20 via-background/5 to-transparent blur-3xl" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-medium uppercase tracking-[0.32em] text-foreground/70">
            Plan Status
          </span>
          <h3 className="mt-4 font-bold text-2xl uppercase tracking-[0.22em] text-foreground">
            {status}
          </h3>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.28em] text-foreground/60 sm:text-sm">
            Package tier: <span className="text-foreground">{packageTier ?? "Unknown"}</span>
          </p>
        </div>
        <div className="flex gap-4">
          {progressSteps.map((step, index) => {
            const isActive = progressSteps.indexOf(status) >= index;
            return (
              <div
                key={step}
                className={`relative flex min-w-[120px] flex-col items-center rounded-2xl border px-4 py-4 text-center text-[0.6rem] font-medium uppercase tracking-[0.3em] transition ${
                  isActive
                    ? "border-accent/70 bg-background/30 text-foreground"
                    : "border-border/70 bg-background/10 text-foreground/40"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${isActive ? "bg-accent" : "bg-border/60"}`} />
                <span className="mt-3">{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function ProfileSummary({ profile }: { profile: Profile }) {
  const entries = Object.entries(profile).filter(
    ([, value]) => value && String(value).trim() !== ""
  );

  if (entries.length === 0) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="rounded-3xl border border-border/70 bg-muted/60 px-8 py-8 text-center text-xs font-medium uppercase tracking-[0.3em] text-foreground/50 backdrop-blur"
      >
        No profile metrics yet. Complete the macro intake form to unlock custom
        insights.
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="rounded-3xl border border-border/70 bg-muted/60 px-8 py-8 backdrop-blur"
    >
      <h3 className="font-bold uppercase tracking-[0.34em] text-foreground">
        Athlete Profile
      </h3>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map(([key, value]) => (
          <motion.div
            key={key}
            whileHover={{ scale: 1.02 }}
            className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/20 px-5 py-5 text-xs font-medium uppercase tracking-[0.28em] text-foreground/70 transition"
          >
            <span className="text-foreground/50">
              {key.replace(/([A-Z])/g, " $1").toUpperCase()}
            </span>
            <span className="text-sm font-bold tracking-[0.18em] text-foreground">
              {value}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function MealPlanSection({
  status,
  fileUrl,
  imageUrls,
  daysSinceDelivery,
  groceryListUrl,
}: {
  status: MealPlanStatus;
  fileUrl?: string | null;
  imageUrls?: string[] | null;
  daysSinceDelivery: number | null;
  groceryListUrl?: string | null;
}) {
  const isDelivered = status === "Delivered";
  const images = imageUrls ?? [];

  const deliveryLabel =
    daysSinceDelivery === null
      ? null
      : daysSinceDelivery <= 0
        ? "Plan delivered today"
        : daysSinceDelivery === 1
          ? "Plan delivered 1 day ago"
          : `Plan delivered ${daysSinceDelivery} days ago`;
  const showRefreshCTA =
    daysSinceDelivery !== null && daysSinceDelivery > 30;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden rounded-3xl border border-border/70 bg-muted/60 px-8 py-8 backdrop-blur shadow-[0_0_60px_-35px_rgba(215,38,61,0.6)]"
    >
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-32 bg-gradient-to-b from-background/20 via-background/5 to-transparent blur-3xl" />
      <div className="relative flex flex-col gap-4">
        <h3 className="font-bold uppercase tracking-[0.34em] text-foreground">
          Meal Plan Delivery
        </h3>
        {!isDelivered ? (
          <>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-foreground/60 sm:text-sm">
              Your dashboard will unlock automatically once our coaches deliver
              your plan. Refresh shortly after checkout to see updates.
            </p>
            <div className="mt-4 flex h-36 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/20 text-[0.65rem] font-medium uppercase tracking-[0.3em] text-foreground/50">
              Meal plan file pending upload
            </div>
          </>
        ) : (
          <>
            {deliveryLabel && (
              <span className="inline-flex w-fit items-center justify-center rounded-full border border-border/70 bg-background/20 px-4 py-1 text-[0.55rem] font-medium uppercase tracking-[0.32em] text-foreground/70">
                {deliveryLabel}
              </span>
            )}
            {fileUrl ? (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-accent bg-accent px-6 py-3 text-xs font-bold uppercase tracking-[0.32em] text-background transition hover:bg-transparent hover:text-accent"
              >
                Download Meal Plan PDF
              </a>
            ) : (
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-foreground/60 sm:text-sm">
                PDF delivery is being prepared. Check back soon.
              </p>
            )}

            {groceryListUrl && (
              <a
                href={groceryListUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center justify-center rounded-full border border-border/70 px-5 py-2 text-[0.6rem] font-medium uppercase tracking-[0.3em] text-foreground/70 transition hover:border-accent hover:text-accent"
              >
                Download Grocery List
              </a>
            )}

            {showRefreshCTA && (
              <button
                type="button"
                className="inline-flex w-fit items-center justify-center rounded-full border border-border/70 px-5 py-2 text-[0.6rem] font-medium uppercase tracking-[0.3em] text-foreground/70 transition hover:border-accent hover:text-accent"
              >
                Request Updated Meal Plan
              </button>
            )}

            {images.length > 0 ? (
              <MealPlanGallery images={images} />
            ) : (
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-foreground/50">
                Image gallery coming soon.
              </p>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

function DashboardMetrics({
  goal,
  daysSinceDelivery,
  nextCheckInDate,
}: {
  goal: string | null;
  daysSinceDelivery: number | null;
  nextCheckInDate: Date | null;
}) {
  const progressValue =
    daysSinceDelivery !== null && daysSinceDelivery >= 0
      ? Math.min(100, daysSinceDelivery)
      : 0;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      transition={{ duration: 0.7, delay: 0.15, ease: heroEase }}
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
    >
      <MetricCard
        title="Current Goal"
        value={goal ?? "No goal set"}
        subtitle="Based on your macro intake profile."
      />
      <MetricCard
        title="Daily Calories"
        value="Coming soon"
        subtitle="Coach-calculated calorie target."
      />
      <MetricCard
        title="Macro Targets"
        value="Protein / Fat / Carbs"
        subtitle="Detailed targets launching shortly."
      />
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-border/80 bg-muted/60 px-6 py-8 text-center shadow-[0_0_60px_-35px_rgba(215,38,61,0.6)] backdrop-blur">
        <div className="relative h-24 w-24">
          <div className="absolute inset-0 rounded-full border border-border/60" />
          <div
            className="absolute inset-0 rounded-full border-[10px] border-accent/30"
            style={{
              clipPath: "polygon(50% 50%, 0 0, 0 100%)",
            }}
          />
          <div
            className="absolute inset-0 rounded-full border-[10px] border-accent"
            style={{
              clipPath: `polygon(50% 50%, 50% 0%, ${progressValue}% 0%, 50% 50%)`,
            }}
          />
          <div className="absolute inset-4 flex items-center justify-center rounded-full bg-background/80 text-sm font-semibold">
            {daysSinceDelivery !== null ? (
              <span>{daysSinceDelivery}d</span>
            ) : (
              <span>0d</span>
            )}
          </div>
        </div>
        <span className="text-xs uppercase tracking-[0.3em] text-foreground/70">
          Days Since Delivery
        </span>
      </div>

      {nextCheckInDate && (
        <MetricCard
          title="Next Check-in"
          value={nextCheckInDate.toLocaleDateString()}
          subtitle="Your coach will follow up on this date."
        />
      )}
    </motion.div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-muted/60 px-6 py-6 shadow-[0_0_50px_-30px_rgba(215,38,61,0.5)] backdrop-blur"
    >
      <h3 className="font-bold uppercase tracking-[0.34em] text-foreground">
        {title}
      </h3>
      <p className="text-xl font-bold uppercase tracking-[0.2em] text-foreground">
        {value}
      </p>
      {subtitle && (
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-foreground/60">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

function ProgressTracker({ statusIndex }: { statusIndex: number }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="rounded-3xl border border-border/70 bg-muted/60 px-8 py-8 backdrop-blur shadow-[0_0_60px_-35px_rgba(215,38,61,0.6)]"
    >
      <h3 className="font-bold uppercase tracking-[0.34em] text-foreground">
        Progress Tracker
      </h3>
      <div className="mt-6 flex flex-col gap-4">
        {progressSteps.map((step, index) => {
          const isReached = index <= statusIndex;
          return (
            <div
              key={step}
              className="flex items-center gap-3"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-xs font-bold uppercase tracking-[0.28em] ${
                  isReached
                    ? "border-accent bg-accent text-background"
                    : "border-border/60 bg-background/20 text-foreground/50"
                }`}
              >
                {index + 1}
              </span>
              <div className="flex-1 rounded-2xl border border-border/60 bg-background/20 px-4 py-3 text-[0.65rem] font-medium uppercase tracking-[0.3em] text-foreground/70">
                {step}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-48 animate-pulse rounded-3xl border border-border/70 bg-muted/40 ${className}`}
    />
  );
}


