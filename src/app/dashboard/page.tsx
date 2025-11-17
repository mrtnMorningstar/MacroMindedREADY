"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { addDoc, collection, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";

import {
  DashboardMetrics,
  LockedDashboardScreen,
  MealPlanSection,
  ProfileSummary,
  ProgressTracker,
  ReferralsCard,
  StatusOverview,
  useDeliveryMeta,
  CustomerJourneyTimeline,
  MacroSummaryPreview,
} from "@/components/dashboard/client-components";
import { DashboardCardSkeleton } from "@/components/skeletons";
import MealPlanStatusCard from "@/components/status/MealPlanStatusCard";
import { useDashboard } from "@/context/dashboard-context";
import { db } from "@/lib/firebase";
import { CTA_BUTTON_CLASSES } from "@/lib/ui";
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

  const statusIndex = progressSteps.indexOf(status);
  const { daysSinceDelivery } = useDeliveryMeta(data?.mealPlanDeliveredAt ?? null);
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

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-accent/40 bg-muted/70 px-6 py-6 text-center text-xs font-semibold uppercase tracking-[0.3em] text-accent">
        {error}
      </div>
    );
  }

  if (!isUnlocked) {
    return <LockedDashboardScreen />;
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

  return (
    <div className="flex flex-col gap-8">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-40 rounded-2xl border border-accent/40 bg-background px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-accent shadow-[0_0_40px_-20px_rgba(215,38,61,0.6)]">
          {toastMessage}
        </div>
      )}

      <header className="flex flex-col gap-4 text-center sm:text-left sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.45em] text-foreground/70">
            Macro Command Center
          </p>
          <h1 className="mt-2 text-3xl font-bold uppercase tracking-[0.22em] text-foreground sm:text-4xl">
            Welcome back, {user?.displayName ?? "Athlete"}
              </h1>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.3em] text-foreground/60 sm:text-sm">
            {user?.email ?? "Stay connected to your coaching team."}
              </p>
            </div>
            <button
              type="button"
          onClick={signOutAndRedirect}
              className="rounded-full border border-border/70 px-5 py-2 text-xs font-medium uppercase tracking-[0.3em] text-foreground/70 transition hover:border-accent hover:text-accent"
            >
              Sign Out
            </button>
        </header>

        <DashboardMetrics
          goal={goal}
          daysSinceDelivery={daysSinceDelivery}
        nextCheckInDate={null}
      />

      <section className="grid gap-6">
        {/* Premium Timeline */}
        <CustomerJourneyTimeline
          accountCreatedAt={accountCreatedAt}
          purchaseDate={purchaseDate}
          mealPlanStatus={status}
          mealPlanDeliveredAt={mealPlanDeliveredAt}
          hasUpdateRequest={hasUpdateRequest}
        />

        {/* Meal Plan Status Card */}
        <MealPlanStatusCard
          status={status}
          packageTier={data?.packageTier ?? null}
          showDownload={status === "Delivered"}
          fileUrl={data?.mealPlanFileURL}
        />

        {/* Macro Summary Preview */}
        <MacroSummaryPreview goal={goal} profile={data?.profile ?? null} />

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-6">
            <MealPlanSection
              status={status}
              fileUrl={data?.mealPlanFileURL}
              imageUrls={data?.mealPlanImageURLs}
              daysSinceDelivery={daysSinceDelivery}
              groceryListUrl={data?.groceryListURL}
              packageTier={data?.packageTier ?? null}
            />

            {(status === "Delivered" || (daysSinceDelivery ?? null) !== null) && (
              <div className="rounded-3xl border border-border/70 bg-muted/60 px-8 py-8 shadow-[0_0_60px_-35px_rgba(215,38,61,0.6)] backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-foreground/60">
                      Need an adjustment?
                    </p>
                    <h3 className="text-xl font-bold uppercase tracking-[0.28em] text-foreground">
                      Request a plan update
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRequestText("");
                      setRequestError(null);
                      setShowRequestModal(true);
                    }}
                    className="rounded-full border border-accent bg-accent px-6 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-background transition hover:bg-transparent hover:text-accent"
                  >
                    Request Plan Update
                  </button>
      </div>
                <p className="mt-2 text-[0.7rem] uppercase tracking-[0.28em] text-foreground/60">
                  This alerts your coach that a tweak is needed—no extra purchase required.
                </p>
              </div>
            )}

            {daysSinceDelivery !== null && daysSinceDelivery > 28 && (
              <div className="rounded-3xl border border-border/70 bg-muted/60 px-8 py-8 shadow-[0_0_60px_-35px_rgba(215,38,61,0.6)] backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-foreground/60">
                      It’s been {daysSinceDelivery} days
                    </p>
                    <h3 className="text-xl font-bold uppercase tracking-[0.28em] text-foreground">
                      Want a fresh update?
                    </h3>
                    <p className="mt-1 text-[0.7rem] uppercase tracking-[0.28em] text-foreground/60">
                      Month-old plans can drift from your routine. Request a refresh to stay dialed in.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRequestText("");
                      setRequestError(null);
                      setShowRequestModal(true);
                    }}
                    className="rounded-full border border-accent bg-accent px-6 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-background transition hover:bg-transparent hover:text-accent"
                  >
                    Request Update
                  </button>
                </div>
              </div>
            )}
          </div>

          <ProgressTracker statusIndex={statusIndex} />
        </div>

        <ProfileSummary profile={data?.profile ?? {}} />

        <ReferralsCard
          referralCode={data?.referralCode ?? null}
          referralCredits={data?.referralCredits ?? 0}
        />

        <div className="rounded-3xl border border-border/70 bg-muted/60 px-8 py-8 text-center text-xs font-medium uppercase tracking-[0.3em] text-foreground/60 backdrop-blur">
          <p>Need a plan adjustment? Update your macro intake form to keep your plan accurate.</p>
          <div className="mt-4 flex justify-center">
            <Link
              href="/macro-form"
              className={`${CTA_BUTTON_CLASSES} w-full justify-center sm:w-auto`}
            >
              Open Macro Intake Form
            </Link>
          </div>
        </div>
      </section>

      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
          <div className="w-full max-w-lg rounded-3xl border border-border/70 bg-background px-8 py-8 text-foreground shadow-[0_0_80px_-30px_rgba(215,38,61,0.7)]">
            <h3 className="text-xl font-bold uppercase tracking-[0.28em]">
              Tell us what needs to change
        </h3>
            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-foreground/60">
              Describe the adjustments you’d like. Your coach will follow up.
            </p>
            <textarea
              value={requestText}
              onChange={(event) => setRequestText(event.target.value)}
              rows={6}
              className="mt-5 w-full rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none"
              placeholder="Example: Increase carbs on training days, swap meal 2 for a quick option..."
            />
            {requestError && (
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.28em] text-accent">
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
                className="rounded-full border border-border/70 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70 transition hover:border-accent hover:text-accent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitPlanUpdateRequest}
                disabled={requestSubmitting}
                className="rounded-full border border-accent bg-accent px-6 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-background transition hover:bg-transparent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                {requestSubmitting ? "Sending..." : "Submit Request"}
              </button>
      </div>
          </div>
        </div>
      )}
      </div>
  );
}

