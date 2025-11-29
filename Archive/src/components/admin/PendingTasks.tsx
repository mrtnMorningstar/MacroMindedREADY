"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { db } from "@/lib/firebase";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { MealPlanStatus } from "@/types/status";
import EmptyState from "./EmptyState";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";

export default function PendingTasks() {
  // Memoize filter function to prevent re-renders
  const filterNonAdmins = useMemo(
    () => (doc: any) => doc.role !== "admin",
    []
  );

  const {
    data: rawUsers,
    loading: loadingUsers,
  } = usePaginatedQuery<any>({
    db,
    collectionName: "users",
    pageSize: 100,
    orderByField: "createdAt",
    orderByDirection: "desc",
    filterFn: filterNonAdmins,
  });

  const {
    data: rawRequests,
    loading: loadingRequests,
  } = usePaginatedQuery<any>({
    db,
    collectionName: "planUpdateRequests",
    pageSize: 10,
    orderByField: "date",
    orderByDirection: "desc",
  });

  const pendingTasks = useMemo(() => {
    const tasks: Array<{
      id: string;
      type: "plan_needed" | "plan_request";
      title: string;
      description: string;
      count: number;
      href: string;
    }> = [];

    // Count users needing plans
    const needsPlan = rawUsers.filter(
      (u: any) =>
        !u.mealPlanStatus ||
        u.mealPlanStatus === MealPlanStatus.NOT_STARTED
    ).length;

    if (needsPlan > 0) {
      tasks.push({
        id: "plan_needed",
        type: "plan_needed",
        title: "Clients Need Plans",
        description: `${needsPlan} client${needsPlan !== 1 ? "s" : ""} waiting for meal plans`,
        count: needsPlan,
        href: "/admin/clients",
      });
    }

    // Count unhandled plan requests
    const unhandledRequests = rawRequests.filter(
      (r: any) => !r.handled
    ).length;

    if (unhandledRequests > 0) {
      tasks.push({
        id: "plan_requests",
        type: "plan_request",
        title: "Plan Update Requests",
        description: `${unhandledRequests} unhandled request${unhandledRequests !== 1 ? "s" : ""}`,
        count: unhandledRequests,
        href: "/admin/plan-requests",
      });
    }

    return tasks;
  }, [rawUsers, rawRequests]);

  const loading = loadingUsers || loadingRequests;

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="h-6 w-32 animate-pulse rounded bg-neutral-800 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded bg-neutral-800" />
          ))}
        </div>
      </div>
    );
  }

  if (pendingTasks.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Pending Tasks</h3>
        <EmptyState
          icon={<ClipboardDocumentListIcon className="h-12 w-12" />}
          title="All caught up!"
          description="No pending tasks at the moment."
          className="rounded-xl border-0 m-0 p-8"
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Pending Tasks</h3>
      <div className="space-y-3">
        {pendingTasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              href={task.href}
              className="block p-4 rounded-lg border border-[#D7263D]/50 bg-[#D7263D]/10 hover:bg-[#D7263D]/20 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-sm font-semibold text-white">
                      {task.title}
                    </p>
                    <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-[#D7263D] text-xs font-bold text-white">
                      {task.count}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">{task.description}</p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-[#D7263D] ml-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

