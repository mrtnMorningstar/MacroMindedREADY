"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRightIcon, EyeIcon } from "@heroicons/react/24/outline";
import { db } from "@/lib/firebase";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { MealPlanStatus } from "@/types/status";
import EmptyState from "./EmptyState";
import { UsersIcon } from "@heroicons/react/24/outline";
import ClientDetailSlideover from "./ClientDetailSlideover";

type RecentClient = {
  id: string;
  name: string;
  email: string;
  packageTier: string | null;
  mealPlanStatus: string;
  createdAt?: Date | null;
};

export default function RecentClients() {
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [slideoverOpen, setSlideoverOpen] = useState(false);

  // Memoize filter function to prevent re-renders
  const filterNonAdmins = useMemo(
    () => (doc: any) => doc.role !== "admin",
    []
  );

  const {
    data: rawClients,
    loading,
    refresh,
  } = usePaginatedQuery<any>({
    db,
    collectionName: "users",
    pageSize: 5, // Only show 5 most recent
    orderByField: "createdAt",
    orderByDirection: "desc",
    filterFn: filterNonAdmins,
  });

  // Transform and get recent clients
  const recentClients = useMemo(() => {
    return rawClients.slice(0, 5).map((client: any) => {
      let createdAt: Date | null = null;
      if (client.createdAt) {
        if (client.createdAt.toDate) {
          createdAt = client.createdAt.toDate();
        } else if (client.createdAt instanceof Date) {
          createdAt = client.createdAt;
        }
      }

      return {
        id: client.id,
        name: client.displayName ?? "Unnamed User",
        email: client.email ?? "No email",
        packageTier: client.packageTier ?? null,
        mealPlanStatus: client.mealPlanStatus ?? MealPlanStatus.NOT_STARTED,
        createdAt,
      } as RecentClient;
    });
  }, [rawClients]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case MealPlanStatus.DELIVERED:
        return "bg-green-500/20 text-green-500 border-green-500/50";
      case MealPlanStatus.IN_PROGRESS:
        return "bg-amber-500/20 text-amber-500 border-amber-500/50";
      default:
        return "bg-neutral-600/20 text-neutral-400 border-neutral-600/50";
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="h-6 w-32 animate-pulse rounded bg-neutral-800 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-neutral-800" />
          ))}
        </div>
      </div>
    );
  }

  if (recentClients.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Recent Clients</h3>
          <Link
            href="/admin/clients"
            className="text-sm text-[#D7263D] hover:text-[#D7263D]/80 transition-colors"
          >
            View all
          </Link>
        </div>
        <EmptyState
          icon={<UsersIcon className="h-12 w-12" />}
          title="No clients yet"
          description="New clients will appear here once they register."
          className="rounded-xl border-0 m-0 p-8"
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Recent Clients</h3>
        <Link
          href="/admin/clients"
          className="flex items-center gap-1 text-sm text-[#D7263D] hover:text-[#D7263D]/80 transition-colors"
        >
          View all
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
      <div className="space-y-3">
        {recentClients.map((client, index) => (
          <motion.div
            key={client.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-4 rounded-lg border border-neutral-800 bg-neutral-800/30 hover:bg-neutral-800/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-white truncate">
                  {client.name}
                </p>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold flex-shrink-0 ${getStatusColor(
                    client.mealPlanStatus
                  )}`}
                >
                  {client.mealPlanStatus}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 truncate">
                {client.email}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedClient(client);
                setSlideoverOpen(true);
              }}
              className="ml-4 p-2 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 transition-colors flex-shrink-0"
            >
              <EyeIcon className="h-4 w-4 text-neutral-300" />
            </button>
          </motion.div>
        ))}
      </div>

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
    </div>
  );
}

