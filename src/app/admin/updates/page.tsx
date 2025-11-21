"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { CheckIcon } from "@heroicons/react/24/outline";
import { db } from "@/lib/firebase";
import AdminLayout from "@/components/admin/AdminLayout";
import { SkeletonTable } from "@/components/common/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { orderBy } from "firebase/firestore";

type PlanUpdateRequest = {
  id: string;
  userId: string;
  requestText: string;
  date: Date | null;
  handled: boolean;
  userName?: string | null;
  userEmail?: string | null;
};

export default function AdminPlanUpdatesPage() {
  const [requests, setRequests] = useState<PlanUpdateRequest[]>([]);
  const [enriching, setEnriching] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const toast = useToast();

  // Use paginated query instead of real-time listener
  // Note: Firestore doesn't support multiple orderBy fields easily in pagination
  // So we'll order by date and filter handled status client-side
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
          const userId = req?.userId ?? "";
          let userName: string | null = null;
          let userEmail: string | null = null;

          if (userId) {
            try {
              const userDoc = await getDoc(doc(db, "users", userId));
              if (userDoc.exists()) {
                userName = (userDoc.data()?.displayName as string) ?? null;
                userEmail = (userDoc.data()?.email as string) ?? null;
              }
            } catch (error) {
              console.error("Failed to fetch user:", error);
            }
          }

          return {
            ...req,
            date: req.date?.toDate ? req.date.toDate() : null,
            userName,
            userEmail,
          } as PlanUpdateRequest;
        })
      );

      // Sort: unhandled first, then by date descending
      enriched.sort((a, b) => {
        if (a.handled !== b.handled) {
          return a.handled ? 1 : -1;
        }
        if (a.date && b.date) {
          return b.date.getTime() - a.date.getTime();
        }
        return 0;
      });

      setRequests(enriched);
      setEnriching(false);
    };

    enrichRequests();
  }, [rawRequests]);

  const handleMarkHandled = useCallback(
    async (requestId: string) => {
      setCompletingId(requestId);
      try {
        await updateDoc(doc(db, "planUpdateRequests", requestId), {
          handled: true,
          handledAt: serverTimestamp(),
        });
        toast.success("Request marked as handled");
        // Refresh to show updated state
        await refresh();
      } catch (error) {
        console.error("Failed to mark as handled:", error);
        toast.error("Failed to update request");
      } finally {
        setCompletingId(null);
      }
    },
    [toast, refresh]
  );

  const unhandledRequests = requests.filter((r) => !r.handled);
  const handledRequests = requests.filter((r) => r.handled);

  return (
    <AdminLayout>
      {loading || enriching ? (
        <SkeletonTable rows={5} />
      ) : (
        <div className="space-y-4">
          {/* Unhandled Requests */}
          {unhandledRequests.length > 0 && (
            <div>
              <p className="uppercase text-xs text-neutral-500 tracking-wide mb-4">
                Unhandled Requests
              </p>
              <div className="space-y-3">
                {unhandledRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <p className="text-sm font-semibold text-white">
                            {request.userName ?? "Unknown User"}
                          </p>
                          <p className="text-xs text-neutral-400">{request.userEmail}</p>
                          {request.date && (
                            <p className="text-xs text-neutral-500">
                              {request.date.toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <p className="text-sm text-neutral-300 whitespace-pre-wrap">
                          {request.requestText}
                        </p>
                      </div>
                      <button
                        onClick={() => handleMarkHandled(request.id)}
                        disabled={completingId === request.id}
                        className="ml-4 rounded-lg border border-[#D7263D] bg-[#D7263D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90 disabled:opacity-50 flex items-center gap-2"
                      >
                        <CheckIcon className="h-4 w-4" />
                        {completingId === request.id ? "Marking..." : "Mark Handled"}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Handled Requests */}
          {handledRequests.length > 0 && (
            <div>
              <p className="uppercase text-xs text-neutral-500 tracking-wide mb-4">
                Handled Requests
              </p>
              <div className="space-y-3">
                {handledRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 opacity-60"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <p className="text-sm font-semibold text-white">
                            {request.userName ?? "Unknown User"}
                          </p>
                          <p className="text-xs text-neutral-400">{request.userEmail}</p>
                          {request.date && (
                            <p className="text-xs text-neutral-500">
                              {request.date.toLocaleDateString()}
                            </p>
                          )}
                          <span className="inline-flex items-center rounded-full border border-green-500/50 bg-green-500/20 px-2 py-1 text-xs font-semibold text-green-500">
                            Handled
                          </span>
                        </div>
                        <p className="text-sm text-neutral-300 whitespace-pre-wrap">
                          {request.requestText}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {requests.length === 0 && (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-12 text-center">
              <p className="text-sm text-neutral-400">No plan update requests found.</p>
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-6">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full rounded-lg border border-[#D7263D] bg-[#D7263D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? "Loading..." : "Load More Updates"}
              </button>
            </div>
          )}

          {!hasMore && requests.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-400">All updates loaded</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
