"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { collection, onSnapshot, query, where, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { CheckIcon, EyeIcon, ArrowUpTrayIcon, ClipboardIcon } from "@heroicons/react/24/outline";
import { db } from "@/lib/firebase";
import AdminLayout from "@/components/admin/AdminLayout";
import { SkeletonTable } from "@/components/common/Skeleton";
import { useToast } from "@/components/ui/Toast";

type Client = {
  id: string;
  name: string;
  email: string;
  packageTier: string | null;
  mealPlanStatus: string;
  referralCredits: number;
  purchaseDate: Date | null;
  daysSincePurchase: number;
};

type FilterType = "all" | "needs-plan" | "delivered" | "in-progress";

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      async (snapshot) => {
        const records: Client[] = [];

        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          if (data?.role === "admin") continue;

          // Calculate days since purchase
          let purchaseDate: Date | null = null;
          let daysSincePurchase = 0;

          if (data?.purchaseDate) {
            if (data.purchaseDate.toDate) {
              purchaseDate = data.purchaseDate.toDate();
            } else if (data.purchaseDate instanceof Date) {
              purchaseDate = data.purchaseDate;
            } else if (data.purchaseDate.seconds) {
              purchaseDate = new Date(data.purchaseDate.seconds * 1000);
            }

            if (purchaseDate) {
              daysSincePurchase = Math.floor((Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
            }
          }

          records.push({
            id: docSnapshot.id,
            name: data?.displayName ?? "Unnamed User",
            email: data?.email ?? "No email",
            packageTier: data?.packageTier ?? null,
            mealPlanStatus: data?.mealPlanStatus ?? "Not Started",
            referralCredits: data?.referralCredits ?? 0,
            purchaseDate,
            daysSincePurchase,
          });
        }

        setClients(records);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load clients:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredClients = useMemo(() => {
    let filtered = clients;

    // Apply status filter
    if (filter === "needs-plan") {
      filtered = filtered.filter((c) => !c.packageTier || c.mealPlanStatus === "Not Started");
    } else if (filter === "delivered") {
      filtered = filtered.filter((c) => c.mealPlanStatus === "Delivered");
    } else if (filter === "in-progress") {
      filtered = filtered.filter((c) => c.mealPlanStatus === "In Progress");
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          (c.packageTier && c.packageTier.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [clients, filter, searchQuery]);

  const handleMarkDelivered = useCallback(async (clientId: string) => {
    try {
      await updateDoc(doc(db, "users", clientId), {
        mealPlanStatus: "Delivered",
        mealPlanDeliveredAt: serverTimestamp(),
      });
      toast.success("Meal plan marked as delivered");
    } catch (error) {
      console.error("Failed to mark as delivered:", error);
      toast.error("Failed to update status");
    }
  }, [toast]);

  const handleCopyEmail = useCallback(async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      toast.success("Email copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy email");
    }
  }, [toast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-green-500/20 text-green-500 border-green-500/50";
      case "In Progress":
        return "bg-amber-500/20 text-amber-500 border-amber-500/50";
      default:
        return "bg-neutral-600/20 text-neutral-400 border-neutral-600/50";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-white mb-2">Clients</h1>
          <p className="text-sm text-neutral-400">Manage all client accounts and meal plans</p>
        </div>

        {/* Filters and Search */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or package..."
                className="w-full rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-[#D7263D] focus:outline-none"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {(["all", "needs-plan", "in-progress", "delivered"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    filter === f
                      ? "bg-[#D7263D] text-white"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  {f === "all"
                    ? "All Clients"
                    : f === "needs-plan"
                    ? "Needs Plan"
                    : f === "in-progress"
                    ? "In Progress"
                    : "Delivered"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <SkeletonTable rows={8} />
        ) : (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Package
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Days Since Purchase
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Plan Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Referral Credits
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filteredClients.map((client, index) => (
                    <motion.tr
                      key={client.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-neutral-800/30 transition"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-white">
                        {client.name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-neutral-300">{client.email}</span>
                          <button
                            onClick={() => handleCopyEmail(client.email)}
                            className="text-neutral-500 hover:text-[#D7263D] transition"
                          >
                            <ClipboardIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-300">
                          {client.packageTier ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-300">
                          {client.daysSincePurchase > 0 ? `${client.daysSincePurchase} days` : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadge(
                            client.mealPlanStatus
                          )}`}
                        >
                          {client.mealPlanStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-[#D7263D]/20 px-3 py-1 text-xs font-semibold text-[#D7263D]">
                          {client.referralCredits}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/clients/${client.id}`}
                            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition hover:bg-neutral-700"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                          {client.mealPlanStatus !== "Delivered" && (
                            <button
                              onClick={() => handleMarkDelivered(client.id)}
                              className="rounded-lg border border-[#D7263D] bg-[#D7263D] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#D7263D]/90"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredClients.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-neutral-400">No clients found matching your filters.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

