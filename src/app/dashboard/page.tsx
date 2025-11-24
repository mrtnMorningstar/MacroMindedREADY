"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { query, where, getDocs, collection } from "firebase/firestore";
import {
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  GiftIcon,
  SparklesIcon,
  PhoneIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

import LockedDashboard from "@/components/dashboard/LockedDashboard";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { RequireWizard } from "@/components/guards";
import FullScreenLoader from "@/components/FullScreenLoader";
import { useAppContext } from "@/context/AppContext";
import { db } from "@/lib/firebase";
import { parseFirestoreDate } from "@/lib/utils/date";
import { progressSteps, type MealPlanStatusType } from "@/types/dashboard";
import { MealPlanStatus } from "@/types/status";
import MealPlanStatusCard from "@/components/dashboard/MealPlanStatusCard";
import MacrosOverviewCard from "@/components/dashboard/MacrosOverviewCard";
import ReferralsCard from "@/components/dashboard/ReferralsCard";
import RecipesPreviewCard from "@/components/dashboard/RecipesPreviewCard";
import PlanTimelineCard from "@/components/dashboard/PlanTimelineCard";

export default function DashboardOverviewPage() {
  const { user, data, loading, error, isUnlocked, signOutAndRedirect } =
    useAppContext();


  const status: MealPlanStatusType = useMemo(() => {
    if (!data || !data.mealPlanStatus) return MealPlanStatus.NOT_STARTED;
    return progressSteps.includes(data.mealPlanStatus as MealPlanStatusType)
      ? (data.mealPlanStatus as MealPlanStatusType)
      : MealPlanStatus.NOT_STARTED;
  }, [data]);

  const goal = data?.profile?.goal ?? null;
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestText, setRequestText] = useState("");
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasUpdateRequest, setHasUpdateRequest] = useState(false);

  const accountCreatedAt = useMemo(() => {
    if (user?.metadata?.creationTime) {
      return new Date(user.metadata.creationTime);
    }
    return parseFirestoreDate(data?.createdAt);
  }, [user, data?.createdAt]);

  const purchaseDate = useMemo(() => parseFirestoreDate(data?.purchaseDate), [data?.purchaseDate]);
  const mealPlanDeliveredAt = useMemo(
    () => parseFirestoreDate(data?.mealPlanDeliveredAt),
    [data?.mealPlanDeliveredAt]
  );

  // Check for update requests
  useEffect(() => {
    if (!user?.uid) return;

    const checkUpdateRequests = async () => {
      try {
        const q = query(
          collection(db, "planUpdateRequests"),
          where("userId", "==", user.uid),
          where("handled", "==", false)
        );
        const snapshot = await getDocs(q);
        setHasUpdateRequest(!snapshot.empty);
      } catch (error) {
        console.error("Failed to check update requests:", error);
      }
    };

    checkUpdateRequests();
  }, [user?.uid]);

  // Handle loading state - guards handle auth, but we need to wait for data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-[#D7263D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-neutral-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <DashboardCard className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">Something went wrong</h3>
        <p className="text-sm text-neutral-400 mb-4">
          We couldn't load your dashboard. Try refreshing or logging in again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl border border-[#D7263D] bg-[#D7263D] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90"
        >
          Refresh Page
        </button>
      </DashboardCard>
    );
  }

  // Show locked dashboard preview if user is authenticated but has no package
  if (!isUnlocked || !data?.packageTier) {
    return <LockedDashboard />;
  }

  const handleSubmitPlanUpdateRequest = async () => {
    if (!user?.uid || !requestText.trim()) {
      setRequestError("Please describe what needs to change.");
      return;
    }
    setRequestSubmitting(true);
    setRequestError(null);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/user/create-plan-update-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          requestText: requestText.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Failed to submit plan update request");
      }

      setShowRequestModal(false);
      setRequestText("");
      setToastMessage("Thanks! Your coach has been notified.");
      window.setTimeout(() => setToastMessage(null), 4000);
    } catch (submitError) {
      console.error("Failed to submit plan update request:", submitError);
      setRequestError(
        submitError instanceof Error
          ? submitError.message
          : "We couldn't send your request. Please try again."
      );
    } finally {
      setRequestSubmitting(false);
    }
  };

  // Get first name from displayName
  const firstName = user?.displayName?.split(" ")[0] ?? "Athlete";

  return (
    <RequireWizard>
      <div className="flex flex-col gap-8">
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-6 right-6 z-40 rounded-2xl border border-[#D7263D]/40 bg-neutral-900 px-6 py-3 text-sm font-semibold text-[#D7263D] shadow-[0_0_40px_-20px_rgba(215,38,61,0.6)]"
          >
            {toastMessage}
          </motion.div>
        )}

        {/* Personalized Welcome Header */}
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-white font-display tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-neutral-400">
            Here's what's happening with your plan today.
          </p>
        </header>

        {/* Main Dashboard Grid */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Meal Plan Progress Card */}
          <MealPlanStatusCard
            mealPlanStatus={status}
            mealPlanDeliveredAt={mealPlanDeliveredAt}
            packageTier={data?.packageTier ?? null}
            fileUrl={data?.mealPlanFileURL}
            imageUrls={data?.mealPlanImageURLs}
          />

          {/* Daily Targets Card */}
          <MacrosOverviewCard estimatedMacros={data?.estimatedMacros ?? null} />

          {/* Progress Tracker Card */}
          <PlanTimelineCard
            accountCreatedAt={accountCreatedAt}
            purchaseDate={purchaseDate}
            mealPlanStatus={status}
            mealPlanDeliveredAt={mealPlanDeliveredAt}
          />

          {/* Referrals Summary Card */}
          <ReferralsCard
            referralCode={data?.referralCode ?? null}
            referralCredits={data?.referralCredits ?? 0}
          />

          {/* Recipe Library Card */}
          <RecipesPreviewCard />

          {/* Coach Contact Card */}
          <DashboardCard delay={0.5}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-white font-display">Coach Contact</h3>
              <PhoneIcon className="h-6 w-6 text-[#D7263D]" />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-1">
                  Email
                </p>
                <a
                  href="mailto:support@macrominded.net"
                  className="text-sm text-[#D7263D] hover:text-[#D7263D]/80 transition-colors"
                >
                  support@macrominded.net
                </a>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-1">
                  Response Time
                </p>
                <p className="text-sm text-neutral-300">24 hours on weekdays</p>
              </div>
              <Link
                href="/dashboard/support"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#D7263D] hover:text-[#D7263D]/80 transition-colors group"
              >
                Visit Support
                <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </DashboardCard>
        </section>

        {/* Quick Actions Section */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/dashboard/plan">
            <DashboardCard delay={0.6} className="cursor-pointer hover:border-[#D7263D]/30">
              <div className="flex items-center gap-3">
                <ClipboardDocumentCheckIcon className="h-6 w-6 text-[#D7263D]" />
                <div>
                  <p className="text-sm font-semibold text-white">View Meal Plan</p>
                  <p className="text-xs text-neutral-400">Access your plan</p>
                </div>
              </div>
            </DashboardCard>
          </Link>

          <Link href="/dashboard/profile">
            <DashboardCard delay={0.65} className="cursor-pointer hover:border-[#D7263D]/30">
              <div className="flex items-center gap-3">
                <UserCircleIcon className="h-6 w-6 text-[#D7263D]" />
                <div>
                  <p className="text-sm font-semibold text-white">Update Profile</p>
                  <p className="text-xs text-neutral-400">Manage goals</p>
                </div>
              </div>
            </DashboardCard>
          </Link>

          <Link href="/dashboard/referrals">
            <DashboardCard delay={0.7} className="cursor-pointer hover:border-[#D7263D]/30">
              <div className="flex items-center gap-3">
                <GiftIcon className="h-6 w-6 text-[#D7263D]" />
                <div>
                  <p className="text-sm font-semibold text-white">Share Referrals</p>
                  <p className="text-xs text-neutral-400">Earn credits</p>
                </div>
              </div>
            </DashboardCard>
          </Link>

          <Link href="/dashboard/support">
            <DashboardCard delay={0.75} className="cursor-pointer hover:border-[#D7263D]/30">
              <div className="flex items-center gap-3">
                <PhoneIcon className="h-6 w-6 text-[#D7263D]" />
                <div>
                  <p className="text-sm font-semibold text-white">Get Support</p>
                  <p className="text-xs text-neutral-400">Contact coach</p>
                </div>
              </div>
            </DashboardCard>
          </Link>
        </section>

        {/* Plan Update Request Section (if delivered) */}
        {status === MealPlanStatus.DELIVERED && (
          <DashboardCard delay={0.8}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-1 font-display">Need an adjustment?</h3>
                <p className="text-sm text-neutral-400">
                  Request a plan update and your coach will follow up.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRequestText("");
                  setRequestError(null);
                  setShowRequestModal(true);
                }}
                className="rounded-xl border border-[#D7263D] bg-[#D7263D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90 hover:shadow-[0_0_20px_-10px_rgba(215,38,61,0.5)]"
              >
                Request Plan Update
              </button>
            </div>
          </DashboardCard>
        )}

        {/* Plan Update Request Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 px-8 py-8 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-2 font-display">
                Tell us what needs to change
              </h3>
              <p className="text-sm text-neutral-400 mb-5">
                Describe the adjustments you'd like. Your coach will follow up.
              </p>
              <textarea
                value={requestText}
                onChange={(event) => setRequestText(event.target.value)}
                rows={6}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-800/50 px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-[#D7263D] focus:outline-none focus:ring-2 focus:ring-[#D7263D]/20 transition-all"
                placeholder="Example: Increase carbs on training days, swap meal 2 for a quick option..."
              />
              {requestError && (
                <p className="mt-3 text-sm font-semibold text-[#D7263D]">
                  {requestError}
                </p>
              )}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestModal(false);
                    setRequestError(null);
                  }}
                  className="rounded-xl border border-neutral-700 bg-neutral-800 px-5 py-2 text-sm font-semibold text-neutral-200 transition hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitPlanUpdateRequest}
                  disabled={requestSubmitting}
                  className="rounded-xl border border-[#D7263D] bg-[#D7263D] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90 hover:shadow-[0_0_20px_-10px_rgba(215,38,61,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {requestSubmitting ? "Sending..." : "Submit Request"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </RequireWizard>
  );
}
