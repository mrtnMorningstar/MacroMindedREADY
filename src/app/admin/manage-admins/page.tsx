"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SkeletonTable } from "@/components/common/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import TableContainer from "@/components/admin/TableContainer";
import EmptyState from "@/components/admin/EmptyState";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

type UserRecord = {
  id: string;
  email?: string | null;
  displayName?: string | null;
  packageTier?: string | null;
  role?: string | null;
};

export default function ManageAdminsPage() {
  const [updatingUids, setUpdatingUids] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "user">("all");
  const toast = useToast();

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
    orderByField: "displayName",
    orderByDirection: "asc",
  });

  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filter by role for display purposes only (role field is display-only, NOT used for authorization)
    if (filterRole === "admin") {
      filtered = filtered.filter((u) => u.role === "admin");
    } else if (filterRole === "user") {
      filtered = filtered.filter((u) => u.role !== "admin");
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((user) => {
        const name = (user.displayName ?? "").toLowerCase();
        const email = (user.email ?? "").toLowerCase();
        return name.includes(query) || email.includes(query);
      });
    }

    // Sort by admin status (admins first)
    filtered.sort((a, b) => {
      const aIsAdmin = a.role === "admin";
      const bIsAdmin = b.role === "admin";
      if (aIsAdmin !== bIsAdmin) {
        return aIsAdmin ? -1 : 1;
      }
      const aName = a.displayName ?? a.email ?? "";
      const bName = b.displayName ?? b.email ?? "";
      return aName.localeCompare(bName);
    });

    return filtered;
  }, [users, searchQuery, filterRole]);

  const handleToggleAdmin = useCallback(
    async (userId: string, currentRole: string | null | undefined) => {
      setUpdatingUids((prev) => new Set(prev).add(userId));
      try {
        const makeAdmin = currentRole !== "admin";
        
        // Get the current user's ID token for authorization
        const { auth } = await import("@/lib/firebase");
        const { currentUser } = auth;
        if (!currentUser) {
          toast.error("You must be logged in to perform this action");
          return;
        }

        const idToken = await currentUser.getIdToken();

        // Use the API route which handles custom claims AND Firestore role field
        const response = await fetch("/api/admin/setAdminRole", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            uid: userId,
            makeAdmin,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to update admin role");
        }

        toast.success(makeAdmin ? "User promoted to admin" : "Admin role removed");
      } catch (error) {
        console.error("Failed to update admin role:", error);
        toast.error(error instanceof Error ? error.message : "Failed to update admin role");
      } finally {
        setUpdatingUids((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }
    },
    [toast]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-6"
    >
      {/* Filters */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["all", "admin", "user"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterRole(f)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  filterRole === f
                    ? "bg-[#D7263D] text-white"
                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                }`}
              >
                {f === "all" ? "All" : f === "admin" ? "Admins" : "Users"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loadingUsers ? (
        <SkeletonTable rows={10} />
      ) : (
        <TableContainer
          isEmpty={filteredUsers.length === 0}
          emptyTitle="No users found"
          emptyDescription="No users match your current filters. Try adjusting your search criteria."
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
          footerContent={
            !hasMore && filteredUsers.length > 0 ? (
              <p className="text-sm text-neutral-400">
                Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
              </p>
            ) : undefined
          }
        >
          <table className="w-full">
            <thead className="bg-neutral-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Package
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Actions
                </th>
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
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                        user.role === "admin"
                          ? "bg-[#D7263D]/20 text-[#D7263D] border-[#D7263D]/50"
                          : "bg-neutral-600/20 text-neutral-400 border-neutral-600/50"
                      }`}
                    >
                      {user.role === "admin" ? "Admin" : "User"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleAdmin(user.id, user.role)}
                      disabled={updatingUids.has(user.id)}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                        user.role === "admin"
                          ? "border border-red-500/50 bg-red-500/20 text-red-500 hover:bg-red-500/30"
                          : "border border-[#D7263D] bg-[#D7263D] text-white hover:bg-[#D7263D]/90"
                      } disabled:opacity-50`}
                    >
                      {updatingUids.has(user.id)
                        ? "Updating..."
                        : user.role === "admin"
                        ? "Remove Admin"
                        : "Make Admin"}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </TableContainer>
      )}
    </motion.div>
  );
}
