"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { collection, onSnapshot } from "firebase/firestore";
import { EyeIcon } from "@heroicons/react/24/outline";
import { db } from "@/lib/firebase";
import AdminLayout from "@/components/admin/AdminLayout";
import { SkeletonTable } from "@/components/common/Skeleton";
import ClientDetailSlideover from "@/components/admin/ClientDetailSlideover";

type Client = {
  id: string;
  name: string;
  email: string;
  packageTier: string | null;
  mealPlanStatus: string;
  referralCredits: number;
  purchaseDate: Date | null;
  daysSincePurchase: number;
  mealPlanFileURL?: string | null;
  mealPlanImageURLs?: string[] | null;
  adminNotes?: string | null;
  role?: string;
};

type FilterType = "all" | "needs-plan" | "delivered" | "in-progress";

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [slideoverOpen, setSlideoverOpen] = useState(false);

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
              daysSincePurchase = Math.floor(
                (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
              );
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
            mealPlanFileURL: data?.mealPlanFileURL ?? null,
            mealPlanImageURLs: data?.mealPlanImageURLs ?? null,
            adminNotes: data?.adminNotes ?? null,
            role: data?.role ?? null,
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
      filtered = filtered.filter(
        (c) => !c.packageTier || c.mealPlanStatus === "Not Started"
      );
    } else if (filter === "delivered") {
      filtered = filtered.filter((c) => c.mealPlanStatus === "Delivered");
    } else if (filter === "in-progress") {
      filtered = filtered.filter((c) => c.mealPlanStatus === "In Progress");
    }

    return filtered;
  }, [clients, filter]);

  const handleViewClient = useCallback((client: Client) => {
    setSelectedClient(client);
    setSlideoverOpen(true);
  }, []);

  const handleRefresh = useCallback(() => {
    setClients([...clients]);
  }, [clients]);

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
      <div className="px-6 py-8 space-y-8">
        {/* Section 2: Filters */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
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

        {/* Section 3: Main Table */}
        {loading ? (
          <SkeletonTable rows={8} />
        ) : (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800/50 sticky top-0">
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
                      className={`hover:bg-neutral-800/30 transition ${
                        index % 2 === 0 ? "bg-neutral-900/50" : "bg-neutral-900"
                      }`}
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-white">
                        {client.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-300">{client.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-300">
                          {client.packageTier ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-300">
                          {client.daysSincePurchase > 0
                            ? `${client.daysSincePurchase} days`
                            : "—"}
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
                        <button
                          onClick={() => handleViewClient(client)}
                          className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition hover:bg-neutral-700 flex items-center gap-2"
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

            {filteredClients.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-neutral-400">
                  No clients found matching your filters.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Client Detail Slideover */}
      <ClientDetailSlideover
        client={selectedClient}
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
