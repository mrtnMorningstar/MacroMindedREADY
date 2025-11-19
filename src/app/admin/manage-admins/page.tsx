"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { getIdToken } from "firebase/auth";

import { auth, db } from "@/lib/firebase";
import { AdminSidebar, useSidebar } from "@/components/admin";
import FullScreenLoader from "@/components/FullScreenLoader";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "user">("all");
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
    setTimeout(() => setToast(null), 5000);
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

  // Filter and search users
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filter by role
    if (filterRole === "admin") {
      filtered = filtered.filter((u) => u.role === "admin");
    } else if (filterRole === "user") {
      filtered = filtered.filter((u) => u.role !== "admin");
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((user) => {
        const name = (user.displayName ?? "").toLowerCase();
        const email = (user.email ?? "").toLowerCase();
        const uid = user.id.toLowerCase();
        return name.includes(query) || email.includes(query) || uid.includes(query);
      });
    }

    return filtered;
  }, [users, searchQuery, filterRole]);

  // Pagination
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    const endIndex = startIndex + USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterRole]);

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
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-3xl border px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.28em] shadow-lg backdrop-blur sm:top-24 ${
                  toast.type === "success"
                    ? "border-accent/40 bg-muted/90 text-accent"
                    : "border-red-500/40 bg-red-500/20 text-red-500"
                }`}
              >
                {toast.message}
              </motion.div>
            )}
          </AnimatePresence>

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

          {/* Search and Filter Bar */}
          <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-muted/60 px-6 py-6 shadow-[0_0_60px_-30px_rgba(215,38,61,0.6)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, email, or UID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-border/70 bg-background/40 px-4 py-2.5 text-[0.65rem] uppercase tracking-[0.2em] text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterRole("all")}
                className={`rounded-full border px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] transition ${
                  filterRole === "all"
                    ? "border-accent bg-accent/20 text-accent"
                    : "border-border/70 bg-background/40 text-foreground/70 hover:border-accent hover:text-accent"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterRole("admin")}
                className={`rounded-full border px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] transition ${
                  filterRole === "admin"
                    ? "border-accent bg-accent/20 text-accent"
                    : "border-border/70 bg-background/40 text-foreground/70 hover:border-accent hover:text-accent"
                }`}
              >
                Admins
              </button>
              <button
                onClick={() => setFilterRole("user")}
                className={`rounded-full border px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] transition ${
                  filterRole === "user"
                    ? "border-accent bg-accent/20 text-accent"
                    : "border-border/70 bg-background/40 text-foreground/70 hover:border-accent hover:text-accent"
                }`}
              >
                Users
              </button>
            </div>
          </div>

          {/* User List */}
          <div className="rounded-3xl border border-border/70 bg-muted/60 px-4 py-6 shadow-[0_0_60px_-30px_rgba(215,38,61,0.6)] backdrop-blur sm:px-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-[0.32em] text-foreground">
                  Users
                </h2>
                <p className="mt-1 text-[0.65rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
                  Showing {filteredUsers.length} of {users.length} users
                </p>
              </div>
              {totalPages > 1 && (
                <p className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
                  Page {currentPage} of {totalPages}
                </p>
              )}
            </div>

            {loadingUsers ? (
              <div className="rounded-2xl border border-border/70 bg-background/20 px-4 py-12 text-center">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent"></div>
                <p className="mt-3 text-xs uppercase tracking-[0.3em] text-foreground/60">
                  Loading users...
                </p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-2xl border border-border/70 bg-background/20 px-4 py-12 text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-foreground/50">
                  {searchQuery || filterRole !== "all"
                    ? "No users match your filters."
                    : "No users found."}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden overflow-hidden lg:block">
                  <div className="max-h-[600px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-border/60">
                      <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                        <tr>
                          <th className="px-4 py-3 text-left text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-foreground/60">
                            User
                          </th>
                          <th className="px-4 py-3 text-left text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-foreground/60">
                            UID
                          </th>
                          <th className="px-4 py-3 text-left text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-foreground/60">
                            Package Tier
                          </th>
                          <th className="px-4 py-3 text-left text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-foreground/60">
                            Role
                          </th>
                          <th className="px-4 py-3 text-right text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-foreground/60">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50 bg-background/5">
                        {paginatedUsers.map((user) => {
                          const isAdminUser = user.role === "admin";
                          const isUpdating = updatingUids.has(user.id);

                          return (
                            <motion.tr
                              key={user.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className={`transition hover:bg-background/10 ${
                                isAdminUser ? "bg-accent/5" : ""
                              }`}
                            >
                              <td className="px-4 py-4">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
                                      {user.displayName ?? user.email ?? "Unnamed User"}
                                    </span>
                                    {isAdminUser && (
                                      <span className="rounded-full border border-accent/60 bg-accent/20 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-accent">
                                        Admin
                                      </span>
                                    )}
                                  </div>
                                  {user.email && (
                                    <span className="mt-1 text-[0.65rem] uppercase tracking-[0.25em] text-foreground/60">
                                      {user.email}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <code className="text-[0.65rem] font-mono uppercase tracking-[0.2em] text-foreground/70">
                                  {user.id.substring(0, 12)}...
                                </code>
                              </td>
                              <td className="px-4 py-4">
                                <span className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-foreground/70">
                                  {user.packageTier ?? "—"}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <span
                                  className={`text-[0.65rem] font-semibold uppercase tracking-[0.25em] ${
                                    isAdminUser ? "text-accent" : "text-foreground/60"
                                  }`}
                                >
                                  {isAdminUser ? "Admin" : "User"}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                {isAdminUser ? (
                                  <button
                                    onClick={() => updateAdminRole(user.id, false)}
                                    disabled={isUpdating}
                                    className="rounded-full border border-red-500/70 bg-red-500/10 px-4 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-red-500 transition hover:border-red-500 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isUpdating ? (
                                      <span className="flex items-center gap-2">
                                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></span>
                                        Removing...
                                      </span>
                                    ) : (
                                      "Remove Admin"
                                    )}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => updateAdminRole(user.id, true)}
                                    disabled={isUpdating}
                                    className="rounded-full border border-accent bg-accent px-4 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-background transition hover:bg-transparent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isUpdating ? (
                                      <span className="flex items-center gap-2">
                                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
                                        Adding...
                                      </span>
                                    ) : (
                                      "Make Admin"
                                    )}
                                  </button>
                                )}
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile/Tablet Card View */}
                <div className="lg:hidden">
                  <div className="max-h-[600px] space-y-3 overflow-y-auto">
                    {paginatedUsers.map((user) => {
                      const isAdminUser = user.role === "admin";
                      const isUpdating = updatingUids.has(user.id);

                      return (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`rounded-2xl border px-4 py-4 transition ${
                            isAdminUser
                              ? "border-accent/60 bg-accent/10"
                              : "border-border/70 bg-background/5"
                          }`}
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
                                    {user.displayName ?? user.email ?? "Unnamed User"}
                                  </h3>
                                  {isAdminUser && (
                                    <span className="rounded-full border border-accent/60 bg-accent/20 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-accent">
                                      Admin
                                    </span>
                                  )}
                                </div>
                                {user.email && (
                                  <p className="mt-1 text-[0.65rem] uppercase tracking-[0.25em] text-foreground/60">
                                    {user.email}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[0.65rem] uppercase tracking-[0.25em] text-foreground/60">
                              <div>
                                <span className="font-semibold">UID:</span>{" "}
                                <code className="font-mono">
                                  {user.id.substring(0, 16)}...
                                </code>
                              </div>
                              {user.packageTier && (
                                <div>
                                  <span className="font-semibold">Tier:</span>{" "}
                                  {user.packageTier}
                                </div>
                              )}
                            </div>

                            <div className="pt-2">
                              {isAdminUser ? (
                                <button
                                  onClick={() => updateAdminRole(user.id, false)}
                                  disabled={isUpdating}
                                  className="w-full rounded-full border border-red-500/70 bg-red-500/10 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-red-500 transition hover:border-red-500 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isUpdating ? (
                                    <span className="flex items-center justify-center gap-2">
                                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></span>
                                      Removing...
                                    </span>
                                  ) : (
                                    "Remove Admin"
                                  )}
                                </button>
                              ) : (
                                <button
                                  onClick={() => updateAdminRole(user.id, true)}
                                  disabled={isUpdating}
                                  className="w-full rounded-full border border-accent bg-accent px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-background transition hover:bg-transparent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isUpdating ? (
                                    <span className="flex items-center justify-center gap-2">
                                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
                                      Adding...
                                    </span>
                                  ) : (
                                    "Make Admin"
                                  )}
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

