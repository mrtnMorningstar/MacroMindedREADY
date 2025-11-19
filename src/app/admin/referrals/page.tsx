"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  type QuerySnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

import { auth, db } from "@/lib/firebase";
import { AdminSidebar, ReferralStats, useSidebar } from "@/components/admin";
import FullScreenLoader from "@/components/FullScreenLoader";

type UserRecord = {
  id: string;
  email?: string | null;
  displayName?: string | null;
  referralCode?: string | null;
  referralCredits?: number | null;
  referredBy?: string | null;
};

const baseBackground = "bg-[radial-gradient(circle_at_top,#161616_0%,rgba(0,0,0,0.92)_60%,#000_98%)]";

export default function AdminReferralsPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        setCheckingAuth(false);
        return;
      }
      try {
        const docRef = doc(db, "users", currentUser.uid);
        const currentSnapshot = await getDoc(docRef);
        const role = currentSnapshot.data()?.role;

        if (role !== "admin") {
          router.replace("/dashboard");
          setCheckingAuth(false);
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Failed to verify admin role:", error);
        router.replace("/dashboard");
        setCheckingAuth(false);
        return;
      } finally {
        setCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!isAdmin) return;

    setLoadingUsers(true);
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot: QuerySnapshot) => {
        const records: UserRecord[] = snapshot.docs
          .map((docSnapshot) => {
            const data = docSnapshot.data();
            // Filter out admin users
            if (data?.role === "admin") {
              return null;
            }
            return {
              id: docSnapshot.id,
              email: data?.email ?? null,
              displayName: data?.displayName ?? null,
              referralCode: data?.referralCode ?? null,
              referralCredits: (data?.referralCredits ?? 0) as number,
              referredBy: data?.referredBy ?? null,
            } as UserRecord | null;
          })
          .filter((record): record is UserRecord => record !== null);

        setUsers(records);
        setLoadingUsers(false);
      },
      (error) => {
        console.error("Failed to subscribe to users:", error);
        setFeedback("Unable to load user data. Please refresh the page.");
        setLoadingUsers(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  const adjustCredits = useCallback(
    async (userId: string, currentCredits: number, adjustment: number) => {
      const newCredits = Math.max(0, currentCredits + adjustment);

      try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          referralCredits: newCredits,
        });
        setFeedback(
          `Credits ${adjustment > 0 ? "added" : "deducted"}. New total: ${newCredits}.`
        );
        setTimeout(() => setFeedback(null), 3000);
      } catch (error) {
        console.error("Failed to update referral credits:", error);
        setFeedback("Failed to update referral credits.");
        setTimeout(() => setFeedback(null), 3000);
      }
    },
    []
  );

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

  const filteredUsers = users.filter((user) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      user.displayName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.referralCode?.toLowerCase().includes(searchLower)
    );
  });

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
          <div className={`absolute inset-0 ${baseBackground}`} />
        </motion.div>

        <div className="relative flex flex-col gap-10 px-6 py-10 sm:py-16 lg:px-10">
          <header className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-muted/60 px-6 py-6 shadow-[0_0_70px_-35px_rgba(215,38,61,0.6)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-bold text-2xl uppercase tracking-[0.32em] text-foreground sm:text-3xl">
                Referral Management
              </h1>
              <p className="mt-2 text-[0.7rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
                Manage referral credits
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={async () => {
                  await auth.signOut();
                  router.replace("/login");
                }}
                className="rounded-full border border-accent bg-accent px-4 py-2 text-[0.6rem] font-medium uppercase tracking-[0.3em] text-background transition hover:bg-transparent hover:text-accent"
              >
                Logout
              </button>
            </div>
          </header>

          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-accent/40 bg-muted/70 px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.28em] text-accent"
            >
              {feedback}
            </motion.div>
          )}

          <ReferralStats users={users} />

          {/* Search */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="text"
              placeholder="Search by name, email, or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-full border border-border/70 bg-background/40 px-4 py-2 text-[0.65rem] uppercase tracking-[0.2em] text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none"
            />
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
              {loadingUsers
                ? "Loading..."
                : `${filteredUsers.length} user${filteredUsers.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Users Table */}
          <div className="overflow-hidden rounded-3xl border border-border/80 bg-muted/60 shadow-[0_0_90px_-45px_rgba(215,38,61,0.6)] backdrop-blur">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border/60 text-left">
                <thead className="uppercase tracking-[0.3em] text-foreground/60 text-[0.6rem]">
                  <tr>
                    <th className="px-5 py-4 font-medium">User</th>
                    <th className="px-5 py-4 font-medium">Referral Code</th>
                    <th className="px-5 py-4 font-medium">Credits</th>
                    <th className="px-5 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70 text-[0.7rem] uppercase tracking-[0.24em] text-foreground/80">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-6 text-center">
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-6 text-center">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const credits = user.referralCredits ?? 0;
                      return (
                        <tr key={user.id} className="hover:bg-background/20">
                          <td className="px-5 py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold">
                                {user.displayName ?? "Unnamed"}
                              </span>
                              <span className="text-[0.65rem] text-foreground/60">
                                {user.email}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {user.referralCode ? (
                              <code className="rounded border border-border/60 bg-background/40 px-2 py-1 text-[0.65rem] font-mono">
                                {user.referralCode}
                              </code>
                            ) : (
                              <span className="text-foreground/40">No code</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-bold text-lg text-accent">{credits}</span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => adjustCredits(user.id, credits, -1)}
                                className="rounded border border-border/70 bg-background/40 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-foreground/70 transition hover:border-accent hover:bg-accent/20 hover:text-accent"
                              >
                                -1
                              </button>
                              <button
                                type="button"
                                onClick={() => adjustCredits(user.id, credits, 1)}
                                className="rounded border border-accent bg-accent px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-background transition hover:bg-accent/80"
                              >
                                +1
                              </button>
                              <Link
                                href={`/admin/users/${user.id}`}
                                className="rounded-full border border-border/70 px-3 py-1 text-[0.6rem] uppercase tracking-[0.2em] text-foreground/70 transition hover:border-accent hover:text-accent"
                              >
                                View
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

