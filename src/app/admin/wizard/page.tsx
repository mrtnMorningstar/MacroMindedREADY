"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import AdminLayout from "@/components/admin/AdminLayout";
import { SkeletonTable } from "@/components/common/Skeleton";
import { useToast } from "@/components/ui/Toast";

type UserWizardData = {
  id: string;
  displayName?: string | null;
  email?: string | null;
  macroWizardCompleted?: boolean | null;
  wizardVerified?: boolean | null;
  profile?: {
    age?: string | null;
    height?: string | null;
    weight?: string | null;
    gender?: string | null;
    activityLevel?: string | null;
    goal?: string | null;
  } | null;
  estimatedMacros?: {
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fats?: number | null;
  } | null;
};

export default function AdminWizardPage() {
  const [users, setUsers] = useState<UserWizardData[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const records: UserWizardData[] = snapshot.docs
        .map((docSnapshot) => {
          const data = docSnapshot.data();
          if (data?.role === "admin") return null;
          return {
            id: docSnapshot.id,
            ...data,
          } as UserWizardData;
        })
        .filter(Boolean) as UserWizardData[];

      setUsers(records);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleVerify = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        wizardVerified: true,
      });
      toast.success("Wizard marked as verified");
    } catch (error) {
      console.error("Failed to verify wizard:", error);
      toast.error("Failed to verify wizard");
    }
  };

  return (
    <AdminLayout>
      {loading ? (
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
                    Completed
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Verified
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Macros
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
                        <span className="text-sm font-semibold text-white">
                          {user.displayName ?? user.email ?? "Unnamed User"}
                        </span>
                        {user.email && (
                          <span className="text-xs text-neutral-400">{user.email}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                          user.macroWizardCompleted
                            ? "bg-green-500/20 text-green-500 border-green-500/50"
                            : "bg-neutral-600/20 text-neutral-400 border-neutral-600/50"
                        }`}
                      >
                        {user.macroWizardCompleted ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                          user.wizardVerified
                            ? "bg-green-500/20 text-green-500 border-green-500/50"
                            : "bg-neutral-600/20 text-neutral-400 border-neutral-600/50"
                        }`}
                      >
                        {user.wizardVerified ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.estimatedMacros ? (
                        <span className="text-sm text-neutral-300">
                          {user.estimatedMacros.calories} cal
                        </span>
                      ) : (
                        <span className="text-sm text-neutral-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {!user.wizardVerified && (
                        <button
                          onClick={() => handleVerify(user.id)}
                          className="rounded-lg border border-[#D7263D] bg-[#D7263D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90"
                        >
                          Mark Verified
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
