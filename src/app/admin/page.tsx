"use client";

import { useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import AdminLayout from "@/components/admin/AdminLayout";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { MealPlanStatus } from "@/types/status";

type UserRecord = {
  id: string;
  displayName?: string | null;
  email?: string | null;
  packageTier?: string | null;
  mealPlanStatus?: string | null;
  role?: string | null;
};

type FilterStatus = "all" | "needs-plan" | "delivered" | "overdue" | "inactive";

export default function AdminPage() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  // Memoize filter function to prevent re-renders
  const filterNonAdmins = useMemo(
    () => (doc: any) => doc.role !== "admin",
    []
  );

  // Use paginated query instead of full collection listener
  const {
    data: users,
    loading: loadingUsers,
  } = usePaginatedQuery<UserRecord>({
    db,
    collectionName: "users",
    pageSize: 25,
    orderByField: "createdAt",
    orderByDirection: "desc",
    filterFn: filterNonAdmins,
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

  return (
    <AdminLayout>
      {/* Stats Cards Placeholder */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
          >
            <div className="h-4 w-24 animate-pulse rounded bg-neutral-700 mb-3" />
            <div className="h-8 w-32 animate-pulse rounded bg-neutral-700" />
          </div>
        ))}
      </div>

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
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center">
          <p className="text-sm text-neutral-400">Loading users...</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-800/50 sticky top-0">
                <tr>
                  {["User", "Package", "Status", "Meal Plan"].map((h) => (
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
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-neutral-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <tr
                      key={user.id}
                      className={`hover:bg-neutral-800/30 transition ${
                        index % 2 === 0 ? "bg-neutral-900/50" : "bg-neutral-900"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-white">
                            {user.displayName ?? user.email ?? "Unnamed User"}
                          </span>
                          {user.email && user.displayName && (
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
                        <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-neutral-300 border-neutral-600">
                          {user.mealPlanStatus ?? "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-400">
                          {user.mealPlanStatus === MealPlanStatus.DELIVERED ? "Delivered" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
