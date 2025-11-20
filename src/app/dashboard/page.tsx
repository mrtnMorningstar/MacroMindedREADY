"use client";

import { useUser } from "@/hooks/useUser";
import dayjs from "dayjs";
import Skeleton from "@/components/Skeleton";
import RequirePackage from "@/components/RequirePackage";

export default function DashboardPage() {
  const { userDoc, loading } = useUser();

  if (loading || !userDoc) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const status = userDoc.mealPlanStatus || "Not Started";
  const deliveredAt = userDoc.mealPlanDeliveredAt
    ? dayjs(userDoc.mealPlanDeliveredAt.toDate())
    : null;
  const daysSinceDelivery = deliveredAt
    ? dayjs().diff(deliveredAt, "day")
    : null;

  return (
    <RequirePackage>
      <main className="p-6 space-y-6">
        <section>
          <h1 className="text-2xl font-bold">Welcome back, {userDoc.displayName || "Athlete"}</h1>
          <p className="text-gray-400 text-sm">
            Your plan is tailored manually to your body, goal, and lifestyle.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
            <h2 className="text-sm font-semibold mb-2">Meal Plan Status</h2>
            <p className="text-lg font-bold">
              {status === "Delivered" ? "Delivered" : status}
            </p>
            {daysSinceDelivery !== null && (
              <p className="mt-1 text-xs text-gray-400">
                Delivered {daysSinceDelivery} day{daysSinceDelivery === 1 ? "" : "s"} ago
              </p>
            )}
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
            <h2 className="text-sm font-semibold mb-2">Plan Type</h2>
            <p className="text-lg font-bold">{userDoc.packageTier || "None"}</p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
            <h2 className="text-sm font-semibold mb-2">Next step</h2>
            {status !== "Delivered" ? (
              <p className="text-sm text-gray-300">
                Your coach is preparing your plan. You'll get an email and see your
                PDF here once it's ready.
              </p>
            ) : (
              <p className="text-sm text-gray-300">
                Follow your plan and log your progress. You can request an update if something changes.
              </p>
            )}
          </div>
        </section>
      </main>
    </RequirePackage>
  );
}
