"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { getIdToken } from "firebase/auth";

import { auth, db } from "@/lib/firebase";
import { AdminSidebar } from "@/components/admin";

type UserRecord = {
  id: string;
  email?: string | null;
  displayName?: string | null;
  packageTier?: string | null;
  role?: string | null;
};

const USERS_PER_PAGE = 20;

export default function ManageAdminsPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingUids, setUpdatingUids] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Verify admin access
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        setCheckingAuth(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const role = userDoc.data()?.role;

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

  // Load all users (including admins)
  useEffect(() => {
    if (!isAdmin) return;

    setLoadingUsers(true);
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const records: UserRecord[] = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data();
          return {
            id: docSnapshot.id,
            email: data?.email ?? null,
            displayName: data?.displayName ?? null,
            packageTier: data?.packageTier ?? null,
            role: data?.role ?? null,
          } as UserRecord;
        });

        // Sort: admins first, then by displayName/email
        records.sort((a, b) => {
          const aIsAdmin = a.role === "admin";
          const bIsAdmin = b.role === "admin";
          if (aIsAdmin !== bIsAdmin) {
            return aIsAdmin ? -1 : 1;
          }
          const aName = a.displayName ?? a.email ?? "";
          const bName = b.displayName ?? b.email ?? "";
          return aName.localeCompare(bName);
        });

        setUsers(records);
        setLoadingUsers(false);
      },
      (error) => {
        console.error("Failed to load users:", error);
        setLoadingUsers(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  // Show toast notification
  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Update admin role
  const updateAdminRole = useCallback(
    async (uid: string, makeAdmin: boolean) => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showToast("You must be logged in to perform this action.", "error");
        return;
      }

      setUpdatingUids((prev) => new Set(prev).add(uid));

      try {
        // Get ID token for authentication
        const idToken = await getIdToken(currentUser);

        const response = await fetch("/api/admin/setAdminRole", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ uid, makeAdmin }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to update admin role");
        }

        showToast(
          makeAdmin
            ? "User has been granted admin access."
            : "Admin access has been removed.",
          "success"
        );
      } catch (error) {
        console.error("Failed to update admin role:", error);
        showToast(
          error instanceof Error
            ? error.message
            : "Failed to update admin role. Please try again.",
          "error"
        );
      } finally {
        setUpdatingUids((prev) => {
          const next = new Set(prev);
          next.delete(uid);
          return next;
        });
      }
    },
    [showToast]
  );

  // Pagination
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    const endIndex = startIndex + USERS_PER_PAGE;
    return users.slice(startIndex, endIndex);
  }, [users, currentPage]);

  const totalPages = Math.ceil(users.length / USERS_PER_PAGE);

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
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminSidebar />

      <div className="relative isolate flex-1 lg:ml-64">
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
          <header className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-muted/60 px-6 py-6 shadow-[0_0_70px_-35px_rgba(215,38,61,0.6)] backdrop-blur sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <h1 className="font-bold text-2xl uppercase tracking-[0.32em] text-foreground sm:text-3xl">
                Admin Management
              </h1>
              <p className="mt-2 text-[0.7rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
                Manage admin roles and permissions
              </p>
            </div>
          </header>

          {/* Toast Notification */}
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`rounded-3xl border px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.28em] ${
                toast.type === "success"
                  ? "border-accent/40 bg-muted/70 text-accent"
                  : "border-red-500/40 bg-red-500/10 text-red-500"
              }`}
            >
              {toast.message}
            </motion.div>
          )}

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-muted/50 px-6 py-4 text-center">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-foreground/60">
                Total Users
              </p>
              <p className="mt-2 text-2xl font-bold uppercase tracking-[0.2em] text-foreground">
                {users.length}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/50 px-6 py-4 text-center">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-foreground/60">
                Admins
              </p>
              <p className="mt-2 text-2xl font-bold uppercase tracking-[0.2em] text-accent">
                {users.filter((u) => u.role === "admin").length}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/50 px-6 py-4 text-center">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-foreground/60">
                Regular Users
              </p>
              <p className="mt-2 text-2xl font-bold uppercase tracking-[0.2em] text-foreground">
                {users.filter((u) => u.role !== "admin").length}
              </p>
            </div>
          </div>

          {/* User List */}
          <div className="rounded-3xl border border-border/70 bg-muted/60 px-6 py-6 shadow-[0_0_60px_-30px_rgba(215,38,61,0.6)] backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold uppercase tracking-[0.32em] text-foreground">
                All Users
              </h2>
              {totalPages > 1 && (
                <p className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
                  Page {currentPage} of {totalPages}
                </p>
              )}
            </div>

            {loadingUsers ? (
              <div className="rounded-2xl border border-border/70 bg-background/20 px-4 py-6 text-center text-xs uppercase tracking-[0.3em] text-foreground/50">
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="rounded-2xl border border-border/70 bg-background/20 px-4 py-6 text-center text-xs uppercase tracking-[0.3em] text-foreground/50">
                No users found.
              </div>
            ) : (
              <>
                <div className="max-h-[600px] overflow-y-auto">
                  <div className="space-y-3">
                    {paginatedUsers.map((user) => {
                      const isAdminUser = user.role === "admin";
                      const isUpdating = updatingUids.has(user.id);

                      return (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`rounded-2xl border px-4 py-4 ${
                            isAdminUser
                              ? "border-accent/60 bg-accent/10"
                              : "border-border/70 bg-background/5"
                          }`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-semibold uppercase tracking-[0.2em] text-foreground">
                                  {user.displayName ?? user.email ?? "Unnamed User"}
                                </h3>
                                {isAdminUser && (
                                  <span className="rounded-full border border-accent/60 bg-accent/20 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-accent">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-3 text-[0.65rem] uppercase tracking-[0.25em] text-foreground/60">
                                <span>UID: {user.id}</span>
                                {user.email && <span>Email: {user.email}</span>}
                                {user.packageTier && (
                                  <span>Tier: {user.packageTier}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {isAdminUser ? (
                                <button
                                  onClick={() => updateAdminRole(user.id, false)}
                                  disabled={isUpdating}
                                  className="rounded-full border border-red-500/70 bg-red-500/10 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-red-500 transition hover:border-red-500 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isUpdating ? "Removing..." : "Remove Admin"}
                                </button>
                              ) : (
                                <button
                                  onClick={() => updateAdminRole(user.id, true)}
                                  disabled={isUpdating}
                                  className="rounded-full border border-accent bg-accent px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-background transition hover:bg-transparent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isUpdating ? "Adding..." : "Make Admin"}
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-full border border-border/70 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-foreground/70 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-4 text-[0.65rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="rounded-full border border-border/70 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-foreground/70 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

