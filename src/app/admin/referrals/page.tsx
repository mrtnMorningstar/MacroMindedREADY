"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { ReferralStats } from "@/components/admin/ReferralStats";
import { SkeletonTable } from "@/components/common/Skeleton";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import TableContainer from "@/components/admin/TableContainer";
import EmptyState from "@/components/admin/EmptyState";
import { UsersIcon } from "@heroicons/react/24/outline";

type UserRecord = {
  id: string;
  email?: string | null;
  displayName?: string | null;
  referralCode?: string | null;
  referralCredits?: number | null;
  referredBy?: string | null;
};

export default function AdminReferralsPage() {
  const [search, setSearch] = useState("");

  // Memoize filter function to prevent re-renders
  const filterNonAdmins = useMemo(
    () => (doc: any) => {
      // Filter out admins for display purposes only (role field is display-only, NOT used for authorization)
      if (doc.role === "admin") return false;
      return true;
    },
    []
  );

  // Use paginated query instead of full collection listener
  const {
    data: users,
    loading: loadingUsers,
    loadingMore,
    hasMore,
    loadMore,
  } = usePaginatedQuery<UserRecord>({
    db,
    collectionName: "users",
    pageSize: 25,
    orderByField: "createdAt",
    orderByDirection: "desc",
    filterFn: filterNonAdmins,
  });

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const query = search.toLowerCase();
    return users.filter((user) => {
      const name = (user.displayName ?? "").toLowerCase();
      const email = (user.email ?? "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [users, search]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-6"
    >
      {/* Referral Stats */}
      <ReferralStats users={users} />

      {/* Page-specific Search */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-[#D7263D] focus:outline-none"
        />
      </div>

      {/* Users Table */}
      {loadingUsers ? (
        <SkeletonTable rows={10} />
      ) : (
        <TableContainer
          isEmpty={filteredUsers.length === 0}
          emptyTitle="No users found"
          emptyDescription="No users match your search criteria. Try adjusting your search."
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
          footerContent={
            !hasMore && filteredUsers.length > 0 ? (
              <p className="text-sm text-neutral-400">All users loaded</p>
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
                  Referral Code
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Credits
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Referred By
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
                    <span className="text-sm text-neutral-300 font-mono">
                      {user.referralCode ?? "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-[#D7263D]/20 px-3 py-1 text-xs font-semibold text-[#D7263D]">
                      {user.referralCredits ?? 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-neutral-300">
                      {user.referredBy ? "Yes" : "—"}
                    </span>
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
