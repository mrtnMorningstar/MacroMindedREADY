"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminLayout from "@/components/admin/AdminLayout";
import { SkeletonTable } from "@/components/common/Skeleton";
import { useToast } from "@/components/ui/Toast";

type UserRecord = {
  id: string;
  email?: string | null;
  displayName?: string | null;
  packageTier?: string | null;
  role?: string | null;
};

const USERS_PER_PAGE = 20;

export default function ManageAdminsPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingUids, setUpdatingUids] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "user">("all");
  const toast = useToast();

  useEffect(() => {
    setLoadingUsers(true);
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const records: UserRecord[] = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          email: data?.email ?? null,
          displayName: data?.displayName ?? null,
          packageTier: data?.packageTier ?? null,
          role: data?.role ?? null,
        } as UserRecord;
      });

      records.sort((a, b) => {
        const aIsAdmin = a.role === "admin";
        const bIsAdmin = b.role === "admin";
        if (aIsAdmin !== bIsAdmin) {
          return aIsAdmin ? -1 : 1;
        }
        const aName = a.displayName ?? a.email ?? "";
        const bName = b.displayName ?? b.email ?? "";
        return aName.localeCompare(bName);
      });

      setUsers(records);
      setLoadingUsers(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = useMemo(() => {
    let filtered = users;

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

    return filtered;
  }, [users, searchQuery, filterRole]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  const handleToggleAdmin = useCallback(
    async (userId: string, currentRole: string | null | undefined) => {
      setUpdatingUids((prev) => new Set(prev).add(userId));
      try {
        const newRole = currentRole === "admin" ? null : "admin";
        await updateDoc(doc(db, "users", userId), {
          role: newRole,
        });
        toast.success(newRole === "admin" ? "User promoted to admin" : "Admin role removed");
      } catch (error) {
        console.error("Failed to update admin role:", error);
        toast.error("Failed to update admin role");
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
    <AdminLayout>
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
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {paginatedUsers.map((user, index) => (
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
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-neutral-800 px-6 py-4">
              <p className="text-sm text-neutral-400">
                Showing {paginatedUsers.length} of {filteredUsers.length} users
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-700 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="flex items-center px-4 py-2 text-sm text-neutral-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
