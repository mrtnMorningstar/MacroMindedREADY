"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Timestamp } from "firebase/firestore";

import MealPlanGallery from "@/components/MealPlanGallery";
import { progressSteps, type MealPlanStatus, type Profile } from "@/types/dashboard";

const heroEase: [number, number, number, number] = [0.22, 1, 0.36, 1];
const containerVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: heroEase },
  },
} as const;

export function DashboardMetrics({
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
            style={{ clipPath: "polygon(50% 50%, 0 0, 0 100%)" }}
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

export function MetricCard({
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

export function StatusOverview({
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

export function ProfileSummary({ profile }: { profile: Profile }) {
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

export function MealPlanSection({
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

            <MealPlanGallery images={images.length > 0 ? images : []} />
            {images.length === 0 && (
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

export function ProgressTracker({ statusIndex }: { statusIndex: number }) {
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
            <div key={step} className="flex items-center gap-3">
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

export function ReferralsCard({
  referralCode,
  referralCredits,
}: {
  referralCode?: string | null;
  referralCredits: number;
}) {
  const [copied, setCopied] = useState(false);
  const shareLink = referralCode
    ? `https://macrominded.net/register?ref=${referralCode}`
    : "";

  const handleCopyLink = async () => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  if (!referralCode) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="relative overflow-hidden rounded-3xl border border-border/70 bg-muted/60 px-8 py-8 backdrop-blur shadow-[0_0_60px_-35px_rgba(215,38,61,0.6)]"
      >
        <div className="pointer-events-none absolute inset-x-0 -top-24 h-32 bg-gradient-to-b from-background/20 via-background/5 to-transparent blur-3xl" />
        <div className="relative flex flex-col gap-4">
          <h3 className="font-bold uppercase tracking-[0.34em] text-foreground">
            Referral Program
          </h3>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-foreground/60">
            Your referral code is being generated. Please refresh the page in a moment.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden rounded-3xl border border-border/70 bg-muted/60 px-8 py-8 backdrop-blur shadow-[0_0_60px_-35px_rgba(215,38,61,0.6)]"
    >
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-32 bg-gradient-to-b from-background/20 via-background/5 to-transparent blur-3xl" />
      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h3 className="font-bold uppercase tracking-[0.34em] text-foreground">
            Referral Program
          </h3>
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.24em] text-foreground/60">
            Share MacroMinded with friends and earn rewards for every successful referral.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-foreground/70">
              Your Referral Code
            </span>
            <code className="rounded-2xl border-2 border-accent/40 bg-background/40 px-5 py-4 text-base font-bold uppercase tracking-[0.2em] text-foreground">
              {referralCode}
            </code>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-foreground/70">
              Total Referrals
            </span>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold uppercase tracking-[0.1em] text-foreground">
                {referralCredits}
              </p>
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/50">
                {referralCredits === 1 ? "credit" : "credits"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background/30 px-6 py-5">
          <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-foreground">
            How It Works
          </h4>
          <div className="flex flex-col gap-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-foreground/80">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                <span className="text-[0.65rem] font-bold">1</span>
              </span>
              <div>
                <span className="font-semibold text-foreground">Share your referral link</span>
                <span className="block mt-1 text-[0.65rem] tracking-[0.18em] text-foreground/60 normal-case">
                  When someone signs up using your link, you earn 1 credit
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                <span className="text-[0.65rem] font-bold">2</span>
              </span>
              <div>
                <span className="font-semibold text-foreground">Redeem your credits</span>
                <span className="block mt-1 text-[0.65rem] tracking-[0.18em] text-foreground/60 normal-case">
                  Each credit can be used for a free meal plan revision or a $5 discount on your next purchase
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-foreground/70">
              Your Referral Link
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              readOnly
              value={shareLink}
              className="flex-1 rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-xs font-medium tracking-[0.2em] text-foreground/70"
            />
            <motion.button
              type="button"
              onClick={handleCopyLink}
              whileTap={{ scale: 0.95 }}
              className="relative shrink-0 rounded-full border border-accent bg-accent px-6 py-3 text-xs font-bold uppercase tracking-[0.32em] text-background transition hover:bg-accent/90"
            >
              {copied ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </span>
              ) : (
                <span>Copy Link</span>
              )}
            </motion.button>
          </div>
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-foreground/50">
            Share this link with friends, family, or on social media to start earning credits
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function LockedDashboardScreen() {
  const handleRefresh = () => {
    window.location.reload();
  };

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
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-full border border-border/70 bg-background/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-foreground transition hover:border-accent hover:bg-accent/10 hover:text-accent"
          >
            Refresh Dashboard
          </button>
          <Link
            href="/packages"
            className="rounded-full border border-accent bg-accent px-8 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-background transition hover:border-foreground hover:bg-transparent hover:text-accent"
          >
            View Packages
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export function SkeletonGrid() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid gap-6 sm:grid-cols-2"
    >
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard className="sm:col-span-2 h-56" />
    </motion.div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-48 animate-pulse rounded-3xl border border-border/70 bg-muted/40 ${className}`}
    />
  );
}

export function useDeliveryMeta(
  mealPlanDeliveredAt?: Timestamp | { seconds: number; nanoseconds: number } | Date | null
) {
  return useMemo(() => {
    if (!mealPlanDeliveredAt) return { deliveredAtDate: null, daysSinceDelivery: null };

    if (mealPlanDeliveredAt instanceof Date) {
      const diffMs = Date.now() - mealPlanDeliveredAt.getTime();
      return {
        deliveredAtDate: mealPlanDeliveredAt,
        daysSinceDelivery: diffMs < 0 ? 0 : Math.floor(diffMs / (1000 * 60 * 60 * 24)),
      };
    }

    if (typeof (mealPlanDeliveredAt as Timestamp).toDate === "function") {
      const date = (mealPlanDeliveredAt as Timestamp).toDate();
      const diffMs = Date.now() - date.getTime();
      return {
        deliveredAtDate: date,
        daysSinceDelivery: diffMs < 0 ? 0 : Math.floor(diffMs / (1000 * 60 * 60 * 24)),
      };
    }

    if (
      typeof (mealPlanDeliveredAt as { seconds: number }).seconds === "number" &&
      typeof (mealPlanDeliveredAt as { nanoseconds: number }).nanoseconds === "number"
    ) {
      const value = mealPlanDeliveredAt as { seconds: number; nanoseconds: number };
      const date = new Date(value.seconds * 1000 + Math.floor(value.nanoseconds / 1_000_000));
      const diffMs = Date.now() - date.getTime();
      return {
        deliveredAtDate: date,
        daysSinceDelivery: diffMs < 0 ? 0 : Math.floor(diffMs / (1000 * 60 * 60 * 24)),
      };
    }

  return { deliveredAtDate: null, daysSinceDelivery: null };
}, [mealPlanDeliveredAt]);
}

