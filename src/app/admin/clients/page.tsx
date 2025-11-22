"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { EyeIcon } from "@heroicons/react/24/outline";
import { db } from "@/lib/firebase";
import { SkeletonTable } from "@/components/common/Skeleton";
import ClientDetailSlideover from "@/components/admin/ClientDetailSlideover";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { MealPlanStatus } from "@/types/status";
import TableContainer from "@/components/admin/TableContainer";
import EmptyState from "@/components/admin/EmptyState";
import { UsersIcon } from "@heroicons/react/24/outline";

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
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [slideoverOpen, setSlideoverOpen] = useState(false);

  // Memoize filter function to prevent re-renders
  const filterNonAdmins = useMemo(
    () => (doc: any) => doc.role !== "admin",
    []
  );

  // Use paginated query instead of full collection listener
  const {
    data: rawClients,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
  } = usePaginatedQuery<any>({
    db,
    collectionName: "users",
    pageSize: 25,
    orderByField: "createdAt",
    orderByDirection: "desc",
    filterFn: filterNonAdmins, // Filter out admins for display purposes only
  });

  // Transform data to calculate purchase dates
  const clients = useMemo(() => {
    return rawClients.map((client: any) => {
      let purchaseDate: Date | null = null;
      let daysSincePurchase = 0;

      if (client.purchaseDate) {
        if (client.purchaseDate.toDate) {
          purchaseDate = client.purchaseDate.toDate();
        } else if (client.purchaseDate instanceof Date) {
          purchaseDate = client.purchaseDate;
        } else if (client.purchaseDate.seconds) {
          purchaseDate = new Date(client.purchaseDate.seconds * 1000);
        }

        if (purchaseDate) {
          daysSincePurchase = Math.floor(
            (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
          );
        }
      }

      return {
        ...client,
        name: client.displayName ?? "Unnamed User",
        purchaseDate,
        daysSincePurchase,
      } as Client;
    });
  }, [rawClients]);

  const filteredClients = useMemo(() => {
    let filtered = clients;

    if (filter === "needs-plan") {
      filtered = filtered.filter(
        (c) => !c.packageTier || c.mealPlanStatus === MealPlanStatus.NOT_STARTED
      );
    } else if (filter === "delivered") {
      filtered = filtered.filter((c) => c.mealPlanStatus === MealPlanStatus.DELIVERED);
    } else if (filter === "in-progress") {
      filtered = filtered.filter((c) => c.mealPlanStatus === MealPlanStatus.IN_PROGRESS);
    }

    return filtered;
  }, [clients, filter]);

  const handleViewClient = useCallback((client: Client) => {
    setSelectedClient(client);
    setSlideoverOpen(true);
  }, []);


  const getStatusBadge = (status: string) => {
    switch (status) {
      case MealPlanStatus.DELIVERED:
        return "bg-green-500/20 text-green-500 border-green-500/50";
      case MealPlanStatus.IN_PROGRESS:
        return "bg-amber-500/20 text-amber-500 border-amber-500/50";
      default:
        return "bg-neutral-600/20 text-neutral-400 border-neutral-600/50";
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-6"
      >
        {/* Filters */}
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

        {/* Main Table */}
        {loading ? (
          <SkeletonTable rows={8} />
        ) : (
          <TableContainer
            isEmpty={filteredClients.length === 0}
            emptyTitle="No clients found"
            emptyDescription="No clients match your current filters. Try adjusting your search criteria."
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
            footerContent={
              !hasMore && filteredClients.length > 0 ? (
                <p className="text-sm text-neutral-400">All clients loaded</p>
              ) : undefined
            }
          >
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
          </TableContainer>
        )}
      </motion.div>

      {/* Client Detail Slideover */}
      <ClientDetailSlideover
        client={selectedClient}
        isOpen={slideoverOpen}
        onClose={() => {
          setSlideoverOpen(false);
          setSelectedClient(null);
        }}
        onUpdate={refresh}
      />
    </>
  );
}
