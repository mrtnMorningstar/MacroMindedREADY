"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { addDoc, collection, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";

import LockedDashboard from "@/components/dashboard/LockedDashboard";
import MealPlanStatusCard from "@/components/dashboard/MealPlanStatusCard";
import PlanTimelineCard from "@/components/dashboard/PlanTimelineCard";
import MacrosOverviewCard from "@/components/dashboard/MacrosOverviewCard";
import ReferralsCard from "@/components/dashboard/ReferralsCard";
import RecipesPreviewCard from "@/components/dashboard/RecipesPreviewCard";
import RequireWizard from "@/components/RequireWizard";
import FullScreenLoader from "@/components/FullScreenLoader";
import { useDashboard } from "@/context/dashboard-context";
import { db } from "@/lib/firebase";
import { progressSteps, type MealPlanStatus } from "@/types/dashboard";

export default function DashboardOverviewPage() {
  const { user, data, loading, error, isUnlocked, signOutAndRedirect } =
    useDashboard();

  const status: MealPlanStatus = useMemo(() => {
    if (!data || !data.mealPlanStatus) return "Not Started";
    return progressSteps.includes(data.mealPlanStatus)
      ? data.mealPlanStatus
      : "Not Started";
  }, [data]);

  const goal = data?.profile?.goal ?? null;
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestText, setRequestText] = useState("");
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasUpdateRequest, setHasUpdateRequest] = useState(false);

  // Helper to parse Firestore timestamps to Date
  const parseFirestoreDate = (
    date?: Timestamp | { seconds: number; nanoseconds: number } | Date | null
  ): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (typeof (date as Timestamp).toDate === "function") {
      return (date as Timestamp).toDate();
    }
    if (typeof (date as { seconds: number }).seconds === "number") {
      const value = date as { seconds: number; nanoseconds: number };
      return new Date(value.seconds * 1000 + Math.floor(value.nanoseconds / 1_000_000));
    }
    return null;
  };

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

  // Show loader while Firebase Auth and Firestore are loading
  if (loading || !user) {
    return <FullScreenLoader />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center">
        <h3 className="text-xl font-semibold text-white mb-2">Something went wrong</h3>
        <p className="text-sm text-neutral-400 mb-4">
          We couldn't load your dashboard. Try refreshing or logging in again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-[#D7263D] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90"
        >
          Refresh Page
        </button>
      </div>
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
      await addDoc(collection(db, "planUpdateRequests"), {
        userId: user.uid,
        requestText: requestText.trim(),
        date: serverTimestamp(),
        handled: false,
      });
      setShowRequestModal(false);
      setRequestText("");
      setToastMessage("Thanks! Your coach has been notified.");
      window.setTimeout(() => setToastMessage(null), 4000);
    } catch (submitError) {
      console.error("Failed to submit plan update request:", submitError);
      setRequestError("We couldn't send your request. Please try again.");
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
          <div className="fixed bottom-6 right-6 z-40 rounded-2xl border border-[#D7263D]/40 bg-neutral-900 px-6 py-3 text-sm font-semibold text-[#D7263D] shadow-[0_0_40px_-20px_rgba(215,38,61,0.6)]">
            {toastMessage}
          </div>
        )}

        {/* Header Section */}
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-neutral-400">
            Here's what's happening with your plan today.
          </p>
        </header>

        {/* Main Dashboard Grid */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Meal Plan Status Card */}
          <MealPlanStatusCard
            mealPlanStatus={status}
            mealPlanDeliveredAt={mealPlanDeliveredAt}
            packageTier={data?.packageTier ?? null}
            fileUrl={data?.mealPlanFileURL}
            imageUrls={data?.mealPlanImageURLs}
          />

          {/* Plan Delivery Timeline Card */}
          <PlanTimelineCard
            accountCreatedAt={accountCreatedAt}
            purchaseDate={purchaseDate}
            mealPlanStatus={status}
            mealPlanDeliveredAt={mealPlanDeliveredAt}
          />

          {/* Macros Overview Card */}
          <MacrosOverviewCard estimatedMacros={data?.estimatedMacros ?? null} />

          {/* Referrals Card */}
          <ReferralsCard
            referralCode={data?.referralCode ?? null}
            referralCredits={data?.referralCredits ?? 0}
          />

          {/* Recipe Library Preview Card */}
          <RecipesPreviewCard />
        </section>

        {/* Plan Update Request Section (if delivered) */}
        {status === "Delivered" && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">Need an adjustment?</h3>
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
                className="rounded-lg border border-[#D7263D] bg-[#D7263D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90"
              >
                Request Plan Update
              </button>
            </div>
          </div>
        )}

        {/* Plan Update Request Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 px-8 py-8 shadow-lg">
              <h3 className="text-xl font-semibold text-white mb-2">
                Tell us what needs to change
              </h3>
              <p className="text-sm text-neutral-400 mb-5">
                Describe the adjustments you'd like. Your coach will follow up.
              </p>
              <textarea
                value={requestText}
                onChange={(event) => setRequestText(event.target.value)}
                rows={6}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-[#D7263D] focus:outline-none"
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
                  className="rounded-lg border border-neutral-700 bg-neutral-800 px-5 py-2 text-sm font-semibold text-neutral-200 transition hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitPlanUpdateRequest}
                  disabled={requestSubmitting}
                  className="rounded-lg border border-[#D7263D] bg-[#D7263D] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {requestSubmitting ? "Sending..." : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireWizard>
  );
}

