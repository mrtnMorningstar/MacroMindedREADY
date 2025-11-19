"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { collection, onSnapshot, doc, getDoc, type DocumentData } from "firebase/firestore";
import { EyeIcon } from "@heroicons/react/24/outline";
import { db } from "@/lib/firebase";
import AdminLayout from "@/components/admin/AdminLayout";
import { SkeletonTable } from "@/components/common/Skeleton";
import ClientDetailSlideover from "@/components/admin/ClientDetailSlideover";

type PendingUser = {
  id: string;
  name: string;
  email: string;
  packageTier: string | null;
  mealPlanStatus: string;
  createdAt?: Date | null;
  mealPlanFileURL?: string | null;
  mealPlanImageURLs?: string[] | null;
  adminNotes?: string | null;
  role?: string | null;
  referralCredits?: number;
};

export default function AdminRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [selectedClient, setSelectedClient] = useState<PendingUser | null>(null);
  const [slideoverOpen, setSlideoverOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const pending: PendingUser[] = snapshot.docs
        .map((docSnapshot) => {
          const data = docSnapshot.data() as DocumentData;
          const status = data?.mealPlanStatus ?? "Not Started";
          if (data?.role === "admin") return null;
          if (!status || status === "Delivered") return null;

          const createdAt = data?.createdAt?.toDate
            ? data.createdAt.toDate()
            : data?.createdAt instanceof Date
            ? data.createdAt
            : null;

          return {
            id: docSnapshot.id,
            name: data?.displayName ?? "Unnamed User",
            email: data?.email ?? "No email",
            packageTier: data?.packageTier ?? null,
            mealPlanStatus: status,
            createdAt,
            mealPlanFileURL: data?.mealPlanFileURL ?? null,
            mealPlanImageURLs: data?.mealPlanImageURLs ?? null,
            adminNotes: data?.adminNotes ?? null,
            role: data?.role ?? null,
            referralCredits: data?.referralCredits ?? 0,
          };
        })
        .filter(Boolean) as PendingUser[];

      setUsers(pending);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleViewClient = (user: PendingUser) => {
    setSelectedClient(user);
    setSlideoverOpen(true);
  };

  const handleRefresh = () => {
    setUsers([...users]);
  };

  return (
    <AdminLayout>
      {loading ? (
        <SkeletonTable rows={8} />
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {users.map((user, index) => (
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
                        <span className="text-sm font-semibold text-white">{user.name}</span>
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
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                          user.mealPlanStatus === "In Progress"
                            ? "bg-amber-500/20 text-amber-500 border-amber-500/50"
                            : "bg-neutral-600/20 text-neutral-400 border-neutral-600/50"
                        }`}
                      >
                        {user.mealPlanStatus}
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
          {users.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-neutral-400">No pending requests found.</p>
            </div>
          )}
        </div>
      )}

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
