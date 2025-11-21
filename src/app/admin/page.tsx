"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { EyeIcon } from "@heroicons/react/24/outline";
import { db } from "@/lib/firebase";
import AdminLayout from "@/components/admin/AdminLayout";
import DashboardSummary from "@/components/admin/DashboardSummary";
import { SkeletonTable } from "@/components/common/Skeleton";
import ClientDetailSlideover from "@/components/admin/ClientDetailSlideover";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { MealPlanStatus } from "@/types/status";

type UserRecord = {
  id: string;
  displayName?: string | null;
  email?: string | null;
  packageTier?: string | null;
  mealPlanStatus?: string | null;
  referralCredits?: number | null;
  mealPlanFileURL?: string | null;
  mealPlanImageURLs?: string[] | null;
  adminNotes?: string | null;
  role?: string | null;
};

type FilterStatus = "all" | "needs-plan" | "delivered" | "overdue" | "inactive";

export default function AdminPage() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedClient, setSelectedClient] = useState<UserRecord | null>(null);
  const [slideoverOpen, setSlideoverOpen] = useState(false);

  // Use paginated query instead of full collection listener
  const {
    data: users,
    loading: loadingUsers,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
  } = usePaginatedQuery<UserRecord>({
    db,
    collectionName: "users",
    pageSize: 25,
    orderByField: "createdAt",
    orderByDirection: "desc",
    filterFn: (doc) => doc.role !== "admin", // Filter out admins for display purposes only
  });

  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (filterStatus === "delivered") {
      filtered = filtered.filter((u) => u.mealPlanStatus === MealPlanStatus.DELIVERED);
    } else if (filterStatus === "needs-plan") {
      filtered = filtered.filter((u) => {
        const hasPackage = !!u.packageTier;
        const needsPlan =
          !u.mealPlanStatus ||
          u.mealPlanStatus === MealPlanStatus.NOT_STARTED ||
          u.mealPlanStatus === MealPlanStatus.IN_PROGRESS;
        return hasPackage && needsPlan;
      });
    } else if (filterStatus === "overdue") {
      filtered = filtered.filter((u) => u.mealPlanStatus === MealPlanStatus.DELIVERED);
    } else if (filterStatus === "inactive") {
      filtered = filtered.filter(
        (u) =>
          !u.packageTier ||
          (!u.mealPlanStatus || u.mealPlanStatus === MealPlanStatus.NOT_STARTED)
      );
    }

    return filtered;
  }, [users, filterStatus]);

  const handleViewClient = useCallback((user: UserRecord) => {
    setSelectedClient({
      ...user,
      name: user.displayName ?? "Unnamed User",
      email: user.email ?? "No email",
      packageTier: user.packageTier ?? null,
      mealPlanStatus: user.mealPlanStatus ?? MealPlanStatus.NOT_STARTED,
      referralCredits: user.referralCredits ?? 0,
      purchaseDate: null,
      daysSincePurchase: 0,
    } as any);
    setSlideoverOpen(true);
  }, []);

  const badgeStyles = (user: UserRecord) => {
    if (user.mealPlanStatus === MealPlanStatus.DELIVERED)
      return "text-green-500 bg-green-500/10 border-green-500/30";
    if (user.mealPlanStatus === MealPlanStatus.IN_PROGRESS)
      return "text-amber-500 bg-amber-500/10 border-amber-500/30";
    if (!user.packageTier || !user.mealPlanStatus)
      return "text-neutral-400 bg-neutral-600/10 border-neutral-600/30";
    return "text-neutral-400 bg-neutral-600/10 border-neutral-600/30";
  };

  return (
    <AdminLayout>

      {/* Metrics (NO duplicate headers) */}
      <DashboardSummary />

      {/* Filters */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="flex flex-wrap gap-2">
          {(["all", "needs-plan", "delivered", "overdue", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                filterStatus === f
                  ? "bg-[#D7263D] text-white"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              {{
                all: "All",
                "needs-plan": "Needs Plan",
                delivered: "Delivered",
                overdue: "Overdue",
                inactive: "Inactive",
              }[f]}
            </button>
          ))}
        </div>
      </div>

      {/* User Table */}
      {loadingUsers ? (
        <SkeletonTable rows={10} />
      ) : (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-800/50 sticky top-0">
                <tr>
                  {["User", "Package", "Status", "Meal Plan", "Referrals", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`hover:bg-neutral-800/30 transition ${
                      index % 2 === 0
                        ? "bg-neutral-900/50"
                        : "bg-neutral-900"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">
                          {user.displayName ?? user.email ?? "Unnamed User"}
                        </span>
                        {user.email && (
                          <span className="text-xs text-neutral-400">{user.email}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-neutral-300">
                        {user.packageTier ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeStyles(
                          user
                        )}`}
                      >
                        {user.mealPlanStatus ?? "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.mealPlanFileURL ? (
                        <a
                          href={user.mealPlanFileURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#D7263D] hover:underline"
                        >
                          View PDF
                        </a>
                      ) : (
                        <span className="text-sm text-neutral-500">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-[#D7263D]/20 px-3 py-1 text-xs font-semibold text-[#D7263D]">
                        {user.referralCredits ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewClient(user)}
                        className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-700 flex items-center gap-2"
                      >
                        <EyeIcon className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="border-t border-neutral-800 px-6 py-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full rounded-lg border border-[#D7263D] bg-[#D7263D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}

          {!hasMore && filteredUsers.length > 0 && (
            <div className="border-t border-neutral-800 px-6 py-4 text-center">
              <p className="text-sm text-neutral-400">All users loaded</p>
            </div>
          )}
        </div>
      )}

      <ClientDetailSlideover
        client={selectedClient as any}
        isOpen={slideoverOpen}
        onClose={() => {
          setSlideoverOpen(false);
          setSelectedClient(null);
        }}
        onUpdate={refresh}
      />
    </AdminLayout>
  );
}
