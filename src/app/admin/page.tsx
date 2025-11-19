"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { collection, onSnapshot } from "firebase/firestore";
import { EyeIcon } from "@heroicons/react/24/outline";
import { db } from "@/lib/firebase";
import AdminLayout from "@/components/admin/AdminLayout";
import DashboardSummary from "@/components/admin/DashboardSummary";
import { SkeletonTable } from "@/components/common/Skeleton";
import ClientDetailSlideover from "@/components/admin/ClientDetailSlideover";

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
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedClient, setSelectedClient] = useState<UserRecord | null>(null);
  const [slideoverOpen, setSlideoverOpen] = useState(false);

  useEffect(() => {
    setLoadingUsers(true);
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const records: UserRecord[] = snapshot.docs
        .map((docSnapshot) => {
          const data = docSnapshot.data();
          if (data?.role === "admin") return null;
          return {
            id: docSnapshot.id,
            ...data,
          } as UserRecord;
        })
        .filter(Boolean) as UserRecord[];

      setUsers(records);
      setLoadingUsers(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filter by status
    if (filterStatus === "delivered") {
      filtered = filtered.filter((u) => u.mealPlanStatus === "Delivered");
    } else if (filterStatus === "needs-plan") {
      filtered = filtered.filter((u) => {
        const hasPackage = !!u.packageTier;
        const needsPlan =
          !u.mealPlanStatus || u.mealPlanStatus === "Not Started" || u.mealPlanStatus === "In Progress";
        return hasPackage && needsPlan;
      });
    } else if (filterStatus === "overdue") {
      // Simple overdue check - can be enhanced
      filtered = filtered.filter((u) => u.mealPlanStatus === "Delivered");
    } else if (filterStatus === "inactive") {
      filtered = filtered.filter(
        (u) => !u.packageTier || (!u.mealPlanStatus || u.mealPlanStatus === "Not Started")
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((user) => {
        const name = (user.displayName ?? "").toLowerCase();
        const email = (user.email ?? "").toLowerCase();
        return name.includes(query) || email.includes(query);
      });
    }

    return filtered;
  }, [users, searchQuery, filterStatus]);

  const handleViewClient = useCallback((user: UserRecord) => {
    setSelectedClient({
      ...user,
      name: user.displayName ?? "Unnamed User",
      email: user.email ?? "No email",
      packageTier: user.packageTier ?? null,
      mealPlanStatus: user.mealPlanStatus ?? "Not Started",
      referralCredits: user.referralCredits ?? 0,
      purchaseDate: null,
      daysSincePurchase: 0,
    } as any);
    setSlideoverOpen(true);
  }, []);

  const handleRefresh = useCallback(() => {
    setUsers([...users]);
  }, [users]);

  const getUserStatusBadge = (user: UserRecord) => {
    if (user.mealPlanStatus === "Delivered") {
      return {
        label: "Delivered",
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/30",
      };
    }
    if (user.mealPlanStatus === "In Progress") {
      return {
        label: "In Progress",
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/30",
      };
    }
    if (!user.packageTier || user.mealPlanStatus === "Not Started" || !user.mealPlanStatus) {
      return {
        label: "Inactive",
        color: "text-neutral-400",
        bgColor: "bg-neutral-600/10",
        borderColor: "border-neutral-600/30",
      };
    }
    return {
      label: user.mealPlanStatus ?? "Not Started",
      color: "text-neutral-400",
      bgColor: "bg-neutral-600/10",
      borderColor: "border-neutral-600/30",
    };
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Dashboard Summary */}
        <DashboardSummary />

        {/* Search and Filter Bar */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-[#D7263D] focus:outline-none"
              />
            </div>
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
                  {f === "all"
                    ? "All"
                    : f === "needs-plan"
                    ? "Needs Plan"
                    : f === "delivered"
                    ? "Delivered"
                    : f === "overdue"
                    ? "Overdue"
                    : "Inactive"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Users Table */}
        {loadingUsers ? (
          <SkeletonTable rows={10} />
        ) : (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800/50 sticky top-0">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Package
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Meal Plan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Referrals
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filteredUsers.map((user, index) => {
                    const badge = getUserStatusBadge(user);
                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`hover:bg-neutral-800/30 transition ${
                          index % 2 === 0 ? "bg-neutral-900/50" : "bg-neutral-900"
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
                          <span className="text-sm text-neutral-300">{user.packageTier ?? "—"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badge.color} ${badge.bgColor} ${badge.borderColor}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {user.mealPlanFileURL ? (
                            <a
                              href={user.mealPlanFileURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-[#D7263D] hover:underline"
                              onClick={(e) => e.stopPropagation()}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-neutral-400">
                  {searchQuery || filterStatus !== "all"
                    ? "No users match your filters."
                    : "No users found."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Client Detail Slideover */}
      <ClientDetailSlideover
        client={selectedClient as any}
        isOpen={slideoverOpen}
        onClose={() => {
          setSlideoverOpen(false);
          setSelectedClient(null);
        }}
        onUpdate={handleRefresh}
      />
    </AdminLayout>
  );
}
