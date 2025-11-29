"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
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
      className="flex flex-col gap-8"
    >
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <h2 className="text-3xl font-bold text-white font-display tracking-tight">
          Referrals
        </h2>
        <p className="text-sm text-neutral-400">
          View and manage referral codes and credits
        </p>
      </motion.div>

      {/* Referral Stats */}
      <ReferralStats users={users} />

      {/* Page-specific Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-neutral-800/50 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 shadow-xl"
      >
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 pointer-events-none" />
          <input
            id="referralsSearch"
            name="referralsSearch"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            aria-label="Search referrals by name or email"
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-800/50 border border-neutral-800 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#D7263D] focus:ring-2 focus:ring-[#D7263D]/20 transition-all duration-200"
          />
        </div>
      </motion.div>

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
            <thead className="bg-neutral-800/50 border-b border-neutral-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">
                  Referral Code
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">
                  Credits
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">
                  Referred By
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
                    <span className="text-sm text-neutral-300 font-mono">
                      {user.referralCode ?? "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-[#D7263D]/20 border border-[#D7263D]/30 px-3 py-1 text-xs font-bold text-[#D7263D]">
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
