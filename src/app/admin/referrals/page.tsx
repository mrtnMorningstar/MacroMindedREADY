"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { collection, onSnapshot, type QuerySnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminLayout from "@/components/admin/AdminLayout";
import { ReferralStats } from "@/components/admin/ReferralStats";
import { SkeletonTable } from "@/components/common/Skeleton";

type UserRecord = {
  id: string;
  email?: string | null;
  displayName?: string | null;
  referralCode?: string | null;
  referralCredits?: number | null;
  referredBy?: string | null;
};

export default function AdminReferralsPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoadingUsers(true);
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot: QuerySnapshot) => {
        const records: UserRecord[] = snapshot.docs
          .map((docSnapshot) => {
            const data = docSnapshot.data();
            if (data?.role === "admin") {
              return null;
            }
            return {
              id: docSnapshot.id,
              email: data?.email ?? null,
              displayName: data?.displayName ?? null,
              referralCode: data?.referralCode ?? null,
              referralCredits: (data?.referralCredits ?? 0) as number,
              referredBy: data?.referredBy ?? null,
            } as UserRecord | null;
          })
          .filter((record): record is UserRecord => record !== null);

        setUsers(records);
        setLoadingUsers(false);
      },
      (error) => {
        console.error("Failed to load users:", error);
        setLoadingUsers(false);
      }
    );

    return () => unsubscribe();
  }, []);

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
    <AdminLayout>
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
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-800/50 sticky top-0">
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
          </div>
          {filteredUsers.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-neutral-400">No users found.</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
