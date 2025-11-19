"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { ChevronDownIcon, ChevronUpIcon, CheckIcon } from "@heroicons/react/24/outline";
import { db } from "@/lib/firebase";
import AdminLayout from "@/components/admin/AdminLayout";
import { SkeletonTable } from "@/components/common/Skeleton";
import { useToast } from "@/components/ui/Toast";

type PlanRequest = {
  id: string;
  userId: string;
  requestText: string;
  date: Date | null;
  handled: boolean;
  userName?: string;
  userEmail?: string;
};

export default function PlanRequestsPage() {
  const [requests, setRequests] = useState<PlanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "planUpdateRequests"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const requestsData: PlanRequest[] = [];

        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          let userName = "Unknown User";
          let userEmail = "No email";

          // Fetch user data
          try {
            const userDoc = await getDoc(doc(db, "users", data.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              userName = userData.displayName ?? "Unknown User";
              userEmail = userData.email ?? "No email";
            }
          } catch (error) {
            console.error("Failed to fetch user:", error);
          }

          requestsData.push({
            id: docSnapshot.id,
            userId: data.userId,
            requestText: data.requestText ?? "",
            date: data.date?.toDate ? data.date.toDate() : null,
            handled: data.handled ?? false,
            userName,
            userEmail,
          });
        }

        setRequests(requestsData);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load requests:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleMarkHandled = useCallback(async (requestId: string) => {
    try {
      await updateDoc(doc(db, "planUpdateRequests", requestId), {
        handled: true,
      });
      toast.success("Request marked as handled");
    } catch (error) {
      console.error("Failed to mark as handled:", error);
      toast.error("Failed to update request");
    }
  }, [toast]);

  const unhandledRequests = requests.filter((r) => !r.handled);
  const handledRequests = requests.filter((r) => r.handled);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-white mb-2">Plan Update Requests</h1>
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
                <h2 className="text-lg font-semibold text-white mb-4">Unhandled Requests</h2>
                <div className="space-y-3">
                  {unhandledRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden"
                    >
                      <div
                        className="flex items-center justify-between p-6 cursor-pointer hover:bg-neutral-800/50 transition"
                        onClick={() =>
                          setExpandedId(expandedId === request.id ? null : request.id)
                        }
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <p className="text-sm font-semibold text-white">{request.userName}</p>
                            <p className="text-xs text-neutral-400">{request.userEmail}</p>
                            {request.date && (
                              <p className="text-xs text-neutral-500">
                                {request.date.toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <p className="text-sm text-neutral-300 line-clamp-2">
                            {request.requestText}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkHandled(request.id);
                            }}
                            className="rounded-lg border border-[#D7263D] bg-[#D7263D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
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
                            className="border-t border-neutral-800 bg-neutral-800/30 p-6"
                          >
                            <p className="text-sm text-neutral-300 whitespace-pre-wrap">
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
                <h2 className="text-lg font-semibold text-white mb-4">Handled Requests</h2>
                <div className="space-y-3">
                  {handledRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-neutral-800 bg-neutral-900/50 overflow-hidden opacity-60"
                    >
                      <div
                        className="flex items-center justify-between p-6 cursor-pointer hover:bg-neutral-800/30 transition"
                        onClick={() =>
                          setExpandedId(expandedId === request.id ? null : request.id)
                        }
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <p className="text-sm font-semibold text-white">{request.userName}</p>
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
                            className="border-t border-neutral-800 bg-neutral-800/30 p-6"
                          >
                            <p className="text-sm text-neutral-300 whitespace-pre-wrap">
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

