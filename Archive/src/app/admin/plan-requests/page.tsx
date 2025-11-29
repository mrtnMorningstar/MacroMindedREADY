"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  updateDoc,
  doc,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import { ChevronDownIcon, ChevronUpIcon, CheckIcon } from "@heroicons/react/24/outline";
import { db } from "@/lib/firebase";
import { SkeletonTable } from "@/components/common/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import EmptyState from "@/components/admin/EmptyState";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";

type PlanRequest = {
  id: string;
  userId: string;
  requestText: string;
  date: Date | null;
  handled: boolean;
  userName?: string;
  userEmail?: string;
};

type FilterType = "all" | "unhandled" | "handled";

export default function PlanRequestsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const toast = useToast();

  // Use paginated query instead of real-time listener
  const {
    data: rawRequests,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
  } = usePaginatedQuery<any>({
    db,
    collectionName: "planUpdateRequests",
    pageSize: 25,
    orderByField: "date",
    orderByDirection: "desc",
  });

  const [requests, setRequests] = useState<PlanRequest[]>([]);
  const [enriching, setEnriching] = useState(false);

  // Enrich requests with user data asynchronously
  useEffect(() => {
    if (rawRequests.length === 0) {
      setRequests([]);
      return;
    }

    setEnriching(true);
    const enrichRequests = async () => {
      const enriched = await Promise.all(
        rawRequests.map(async (req: any) => {
          let userName = "Unknown User";
          let userEmail = "No email";

          try {
            const userDoc = await getDoc(doc(db, "users", req.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              userName = userData.displayName ?? "Unknown User";
              userEmail = userData.email ?? "No email";
            }
          } catch (error) {
            console.error("Failed to fetch user:", error);
          }

          return {
            ...req,
            date: req.date?.toDate ? req.date.toDate() : null,
            userName,
            userEmail,
          } as PlanRequest;
        })
      );
      setRequests(enriched);
      setEnriching(false);
    };

    enrichRequests();
  }, [rawRequests]);

  const handleMarkHandled = useCallback(
    async (requestId: string) => {
      try {
        await updateDoc(doc(db, "planUpdateRequests", requestId), {
          handled: true,
        });
        toast.success("Request marked as handled");
        await refresh();
      } catch (error) {
        console.error("Failed to mark as handled:", error);
        toast.error("Failed to update request");
      }
    },
    [toast, refresh]
  );

  const handleMarkAllHandled = useCallback(async () => {
    const unhandledRequests = requests.filter((r) => !r.handled);
    if (unhandledRequests.length === 0) {
      toast.info("No unhandled requests");
      return;
    }

    try {
      const batch = writeBatch(db);
      unhandledRequests.forEach((req) => {
        const ref = doc(db, "planUpdateRequests", req.id);
        batch.update(ref, { handled: true });
      });
      await batch.commit();
      toast.success(`Marked ${unhandledRequests.length} requests as handled`);
      await refresh();
    } catch (error) {
      console.error("Failed to mark all as handled:", error);
      toast.error("Failed to update requests");
    }
  }, [requests, toast, refresh]);

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return "Unknown";
    const now = Date.now();
    const diff = now - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days} day${days !== 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    return "Just now";
  };

  const filteredRequests = useMemo(() => {
    if (filter === "unhandled") return requests.filter((r) => !r.handled);
    if (filter === "handled") return requests.filter((r) => r.handled);
    return requests;
  }, [requests, filter]);

  const unhandledRequests = filteredRequests.filter((r) => !r.handled);
  const handledRequests = filteredRequests.filter((r) => r.handled);

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
          Plan Requests
        </h2>
        <p className="text-sm text-neutral-400">
          Review and manage plan update requests from clients
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-neutral-800/50 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 shadow-xl"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-neutral-300">
            {unhandledRequests.length} unhandled request{unhandledRequests.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {(["all", "unhandled", "handled"] as FilterType[]).map((f) => (
                <motion.button
                  key={f}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilter(f)}
                  className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    filter === f
                      ? "bg-[#D7263D] text-white shadow-[0_0_20px_-10px_rgba(215,38,61,0.5)]"
                      : "bg-neutral-800/50 text-neutral-300 hover:bg-neutral-800 hover:text-white border border-neutral-800"
                  }`}
                >
                  {f === "all" ? "All" : f === "unhandled" ? "Unhandled" : "Handled"}
                </motion.button>
              ))}
            </div>
            {unhandledRequests.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleMarkAllHandled}
                className="rounded-xl border border-[#D7263D] bg-[#D7263D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90 hover:shadow-[0_0_20px_-10px_rgba(215,38,61,0.5)]"
              >
                Mark All as Handled
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      {loading || enriching ? (
        <SkeletonTable rows={5} />
      ) : (
        <div className="space-y-6">
          {/* Unhandled Requests */}
          {unhandledRequests.length > 0 && (
            <div>
              <p className="uppercase text-xs font-bold text-neutral-500 tracking-[0.2em] mb-4">
                Unhandled Requests
              </p>
              <div className="space-y-4">
                {unhandledRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    className="rounded-2xl border border-neutral-800/50 bg-gradient-to-br from-neutral-900 to-neutral-950 overflow-hidden shadow-xl"
                  >
                    <div
                      className="flex items-center justify-between p-6 cursor-pointer hover:bg-neutral-800/30 transition-all duration-200"
                      onClick={() =>
                        setExpandedId(expandedId === request.id ? null : request.id)
                      }
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2 flex-wrap">
                          <p className="text-sm font-semibold text-white">{request.userName}</p>
                          <p className="text-xs text-neutral-400">{request.userEmail}</p>
                          {request.date && (
                            <p className="text-xs text-neutral-500">
                              {formatTimeAgo(request.date)}
                            </p>
                          )}
                        </div>
                        <p className="text-sm text-neutral-300 line-clamp-2">
                          {request.requestText}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkHandled(request.id);
                          }}
                          className="rounded-xl border border-[#D7263D] bg-[#D7263D] p-2.5 text-white transition hover:bg-[#D7263D]/90 hover:shadow-[0_0_15px_-8px_rgba(215,38,61,0.6)]"
                        >
                          <CheckIcon className="h-5 w-5" />
                        </motion.button>
                        {expandedId === request.id ? (
                          <ChevronUpIcon className="h-5 w-5 text-neutral-400" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5 text-neutral-400" />
                        )}
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedId === request.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-neutral-800/50 bg-neutral-800/20 p-6"
                        >
                          <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">
                            {request.requestText}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Handled Requests */}
          {handledRequests.length > 0 && (
            <div>
              <p className="uppercase text-xs font-bold text-neutral-500 tracking-[0.2em] mb-4">
                Handled Requests
              </p>
              <div className="space-y-4">
                {handledRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-2xl border border-neutral-800/50 bg-gradient-to-br from-neutral-900 to-neutral-950 overflow-hidden opacity-60"
                  >
                    <div
                      className="flex items-center justify-between p-6 cursor-pointer hover:bg-neutral-800/20 transition-all duration-200"
                      onClick={() =>
                        setExpandedId(expandedId === request.id ? null : request.id)
                      }
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2 flex-wrap">
                          <p className="text-sm font-semibold text-white">{request.userName}</p>
                          <p className="text-xs text-neutral-400">{request.userEmail}</p>
                          {request.date && (
                            <p className="text-xs text-neutral-500">
                              {formatTimeAgo(request.date)}
                            </p>
                          )}
                          <span className="inline-flex items-center rounded-full border border-green-500/30 bg-green-500/20 px-2.5 py-1 text-xs font-bold text-green-400">
                            Handled
                          </span>
                        </div>
                        <p className="text-sm text-neutral-300 line-clamp-2">
                          {request.requestText}
                        </p>
                      </div>
                      {expandedId === request.id ? (
                        <ChevronUpIcon className="h-5 w-5 text-neutral-400" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5 text-neutral-400" />
                      )}
                    </div>
                    <AnimatePresence>
                      {expandedId === request.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-neutral-800/50 bg-neutral-800/20 p-6"
                        >
                          <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">
                            {request.requestText}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {requests.length === 0 && !loading && !enriching && (
            <EmptyState
              icon={<ClipboardDocumentListIcon className="h-16 w-16" />}
              title="No plan update requests"
              description="There are no plan update requests at this time."
            />
          )}

          {/* Load More Button */}
          {hasMore && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full rounded-xl border border-[#D7263D] bg-[#D7263D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90 hover:shadow-[0_0_20px_-10px_rgba(215,38,61,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? "Loading..." : "Load More Requests"}
              </button>
            </motion.div>
          )}

          {!hasMore && requests.length > 0 && (
            <div className="text-center">
              <p className="text-sm text-neutral-400">All requests loaded</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
