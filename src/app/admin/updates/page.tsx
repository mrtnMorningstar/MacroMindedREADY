"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { onAuthStateChanged } from "firebase/auth";

import { auth, db } from "@/lib/firebase";
import { AdminSidebar, useSidebar } from "@/components/admin";
import FullScreenLoader from "@/components/FullScreenLoader";

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
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requests, setRequests] = useState<PlanUpdateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        setCheckingAuth(false);
        return;
      }
      try {
        const docRef = doc(db, "users", currentUser.uid);
        const snapshot = await getDoc(docRef);
        const role = snapshot.data()?.role;

        if (role !== "admin") {
          router.replace("/dashboard");
          setCheckingAuth(false);
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Failed to verify admin role:", error);
        router.replace("/dashboard");
      } finally {
        setCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!isAdmin) return;

    setLoading(true);
    const q = query(
      collection(db, "planUpdateRequests"),
      orderBy("handled", "asc"),
      orderBy("date", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
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
              } catch (userError) {
                console.error("Failed to fetch user info:", userError);
              }
            }

            const dateValue = data?.date?.toDate
              ? data.date.toDate()
              : data?.date instanceof Date
              ? data.date
              : null;

            return {
              id: docSnapshot.id,
              userId,
              requestText: data?.requestText ?? "",
              handled: Boolean(data?.handled),
              date: dateValue,
              userName,
              userEmail,
            };
          })
        );

        setRequests(entries);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to subscribe to plan updates:", error);
        setFeedback("Unable to load plan updates. Please refresh.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  const markHandled = useCallback(async (requestId: string) => {
    setCompletingId(requestId);
    try {
      await updateDoc(doc(db, "planUpdateRequests", requestId), {
        handled: true,
        handledAt: serverTimestamp(),
      });
      setFeedback("Marked as completed.");
      setTimeout(() => setFeedback(null), 2500);
    } catch (error) {
      console.error("Failed to mark request as handled:", error);
      setFeedback("Failed to update request state.");
      setTimeout(() => setFeedback(null), 2500);
    } finally {
      setCompletingId(null);
    }
  }, []);

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">
          Validating access...
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return <FullScreenLoader />;
  }

  const { isOpen, isMobile } = useSidebar();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminSidebar />

      <div className={`relative isolate flex-1 transition-all duration-300 ${!isMobile && isOpen ? "lg:ml-64" : ""}`}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1 }}
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute -top-36 left-1/2 h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#161616_0%,rgba(0,0,0,0.92)_55%,#000000_95%)]" />
        </motion.div>

        <div className="relative flex flex-col gap-10 px-6 py-10 sm:py-16 lg:px-10">
          <header className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-muted/60 px-6 py-6 shadow-[0_0_70px_-35px_rgba(215,38,61,0.6)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-bold text-2xl uppercase tracking-[0.32em] text-foreground sm:text-3xl">
                Plan Update Requests
              </h1>
              <p className="mt-2 text-[0.7rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
                Track optional adjustment requests from delivered plans.
              </p>
            </div>
          </header>

          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-accent/40 bg-muted/70 px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.28em] text-accent"
            >
              {feedback}
            </motion.div>
          )}

          <section className="rounded-3xl border border-border/70 bg-muted/60 px-6 py-6 shadow-[0_0_60px_-35px_rgba(215,38,61,0.6)] backdrop-blur">
            {loading ? (
              <div className="grid gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`update-skeleton-${index}`}
                    className="h-24 animate-pulse rounded-2xl border border-border/70 bg-background/20"
                  />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="rounded-2xl border border-border/70 bg-background/20 px-6 py-10 text-center text-xs font-medium uppercase tracking-[0.3em] text-foreground/60">
                No plan update requests yet.
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border/60">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-foreground">
                        {request.userName ?? "Unknown User"}
                      </p>
                      <p className="text-[0.65rem] uppercase tracking-[0.28em] text-foreground/60">
                        {request.userEmail ?? "No email"}
                      </p>
                      <p className="mt-3 text-sm text-foreground/80">
                        {request.requestText}
                      </p>
                      <p className="mt-2 text-[0.65rem] uppercase tracking-[0.28em] text-foreground/60">
                        {request.date
                          ? request.date.toLocaleString()
                          : "No date"}
                      </p>
                      {request.handled && (
                        <span className="mt-2 inline-flex rounded-full border border-border/70 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-foreground/70">
                          Completed
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-3 sm:w-60">
                      <Link
                        href={`/admin/users/${request.userId}`}
                        className="rounded-full border border-border/70 px-5 py-2 text-center text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-foreground/70 transition hover:border-accent hover:text-accent"
                      >
                        View Profile
                      </Link>
                      <button
                        type="button"
                        onClick={() => markHandled(request.id)}
                        disabled={request.handled || completingId === request.id}
                        className="rounded-full border border-accent px-5 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-accent transition hover:bg-accent/10 disabled:cursor-not-allowed disabled:border-border/60 disabled:text-foreground/40"
                      >
                        {request.handled
                          ? "Completed"
                          : completingId === request.id
                          ? "Marking..."
                          : "Mark Completed"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

