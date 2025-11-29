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
import { ShieldCheckIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

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

    // Filter by role for display purposes only
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
        
        const { auth } = await import("@/lib/firebase");
        const { currentUser } = auth;
        if (!currentUser) {
          toast.error("You must be logged in to perform this action");
          return;
        }

        const idToken = await currentUser.getIdToken();

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
        await refresh();
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
    [toast, refresh]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-8"
    >
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <h2 className="text-3xl font-bold text-white font-display tracking-tight">
          Manage Admins
        </h2>
        <p className="text-sm text-neutral-400">
          Grant or revoke admin access to users
        </p>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-neutral-800/50 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 shadow-xl"
      >
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 pointer-events-none" />
            <input
              id="adminSearch"
              name="adminSearch"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-800/50 border border-neutral-800 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#D7263D] focus:ring-2 focus:ring-[#D7263D]/20 transition-all duration-200"
            />
          </div>
          
          {/* Role Filter */}
          <div className="flex flex-wrap gap-2">
            {(["all", "admin", "user"] as const).map((f) => (
              <motion.button
                key={f}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterRole(f)}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  filterRole === f
                    ? "bg-[#D7263D] text-white shadow-[0_0_20px_-10px_rgba(215,38,61,0.5)]"
                    : "bg-neutral-800/50 text-neutral-300 hover:bg-neutral-800 hover:text-white border border-neutral-800"
                }`}
              >
                {f === "all" ? "All" : f === "admin" ? "Admins" : "Users"}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

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
            <thead className="bg-neutral-800/50 border-b border-neutral-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">
                  Package
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ x: 4 }}
                  className={`hover:bg-neutral-800/30 transition-all duration-200 ${
                    index % 2 === 0 ? "bg-neutral-900/30" : "bg-neutral-900/50"
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
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${
                        user.role === "admin"
                          ? "bg-[#D7263D]/20 text-[#D7263D] border-[#D7263D]/30"
                          : "bg-neutral-600/20 text-neutral-400 border-neutral-600/30"
                      }`}
                    >
                      {user.role === "admin" ? "Admin" : "User"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggleAdmin(user.id, user.role)}
                      disabled={updatingUids.has(user.id)}
                      className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                        user.role === "admin"
                          ? "border border-red-500/50 bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          : "border border-[#D7263D] bg-[#D7263D] text-white hover:bg-[#D7263D]/90 hover:shadow-[0_0_15px_-8px_rgba(215,38,61,0.5)]"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {updatingUids.has(user.id)
                        ? "Updating..."
                        : user.role === "admin"
                        ? "Remove Admin"
                        : "Make Admin"}
                    </motion.button>
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
