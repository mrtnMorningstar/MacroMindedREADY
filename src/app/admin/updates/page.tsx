"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { CheckIcon } from "@heroicons/react/24/outline";
import { db } from "@/lib/firebase";
import AdminLayout from "@/components/admin/AdminLayout";
import { SkeletonTable } from "@/components/common/Skeleton";
import { useToast } from "@/components/ui/Toast";

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
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "planUpdateRequests"),
      orderBy("handled", "asc"),
      orderBy("date", "desc")
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const entries: PlanUpdateRequest[] = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data() as DocumentData;
          const userId = data?.userId ?? "";
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
            id: docSnapshot.id,
            userId,
            requestText: data?.requestText ?? "",
            date: data?.date?.toDate ? data.date.toDate() : null,
            handled: data?.handled ?? false,
            userName,
            userEmail,
          };
        })
      );

      setRequests(entries);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleMarkHandled = useCallback(
    async (requestId: string) => {
      setCompletingId(requestId);
      try {
        await updateDoc(doc(db, "planUpdateRequests", requestId), {
          handled: true,
          handledAt: serverTimestamp(),
        });
        toast.success("Request marked as handled");
      } catch (error) {
        console.error("Failed to mark as handled:", error);
        toast.error("Failed to update request");
      } finally {
        setCompletingId(null);
      }
    },
    [toast]
  );

  const unhandledRequests = requests.filter((r) => !r.handled);
  const handledRequests = requests.filter((r) => r.handled);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Plan Updates</h2>
          <p className="text-sm text-neutral-400">
            {unhandledRequests.length} unhandled request{unhandledRequests.length !== 1 ? "s" : ""}
          </p>
        </div>

        {loading ? (
          <SkeletonTable rows={5} />
        ) : (
          <div className="space-y-4">
            {/* Unhandled Requests */}
            {unhandledRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Unhandled Requests</h3>
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
                <h3 className="text-lg font-semibold text-white mb-4">Handled Requests</h3>
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
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
