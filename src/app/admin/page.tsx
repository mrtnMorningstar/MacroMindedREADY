"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { collection, doc, getDoc, onSnapshot, updateDoc, serverTimestamp, type DocumentData } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable, deleteObject } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

import { auth, db, storage } from "@/lib/firebase";
import { AdminSidebar, UserDetailPanel } from "@/components/admin";

type UserRecord = {
  id: string;
  email?: string | null;
  displayName?: string | null;
  packageTier?: string | null;
  mealPlanStatus?: string | null;
  mealPlanFileURL?: string | null;
  mealPlanImageURLs?: string[] | null;
  profile?: Record<string, string | null> | null;
  groceryListURL?: string | null;
  referralCode?: string | null;
  referralCredits?: number | null;
  referredBy?: string | null;
};

type UploadStatus = {
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
  errorMessage?: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "delivered" | "pending" | "not-started">("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [uploadStates, setUploadStates] = useState<Record<string, Record<string, UploadStatus>>>({});

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

  // Show toast notification
  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }, []);

  // Subscribe to users collection (exclude admins)
  useEffect(() => {
    if (!isAdmin) return;

    setLoadingUsers(true);
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const records: UserRecord[] = snapshot.docs
          .map((docSnapshot) => {
            const data = docSnapshot.data();
            if (data?.role === "admin") return null;
            return { id: docSnapshot.id, ...data } as UserRecord;
          })
          .filter((r): r is UserRecord => r !== null);

        setUsers(records);
        setSelectedUserId((prev) => (prev && records.some((u) => u.id === prev) ? prev : records[0]?.id ?? null));
        setLoadingUsers(false);
      },
      (error) => {
        console.error("Failed to load users:", error);
        showToast("Error fetching users. Please refresh the page.", "error");
        setLoadingUsers(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin, showToast]);

  // Generic upload handler
  const uploadFileForUser = useCallback(
    async (user: UserRecord, file: File, type: "mealPlan" | "images" | "grocery") => {
      const key = type === "images" ? file.name : type;
      setUploadStates((prev) => ({
        ...prev,
        [user.id]: { ...prev[user.id], [key]: { status: "uploading", progress: 0 } },
      }));

      try {
        const path =
          type === "mealPlan"
            ? `mealPlans/${user.id}/plan.pdf`
            : type === "images"
            ? `mealPlans/${user.id}/images/${file.name}`
            : `mealPlans/${user.id}/grocery-list.pdf`;

        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type });

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              setUploadStates((prev) => ({
                ...prev,
                [user.id]: { ...prev[user.id], [key]: { status: "uploading", progress } },
              }));
            },
            reject,
            resolve
          );
        });

        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        const updateData: DocumentData = {};
        if (type === "mealPlan") updateData.mealPlanFileURL = downloadURL;
        else if (type === "images") {
          updateData.mealPlanImageURLs = [...(user.mealPlanImageURLs ?? []), downloadURL];
        } else updateData.groceryListURL = downloadURL;

        updateData.mealPlanStatus = "Delivered";
        if (!user.mealPlanFileURL && type === "mealPlan") updateData.mealPlanDeliveredAt = serverTimestamp();

        await updateDoc(doc(db, "users", user.id), updateData);

        setUploadStates((prev) => ({
          ...prev,
          [user.id]: { ...prev[user.id], [key]: { status: "success", progress: 100 } },
        }));
        showToast(`${type === "mealPlan" ? "Meal Plan PDF" : type === "images" ? "Images" : "Grocery List"} uploaded successfully.`, "success");
      } catch (err) {
        console.error(`${type} upload failed`, err);
        setUploadStates((prev) => ({
          ...prev,
          [user.id]: { ...prev[user.id], [key]: { status: "error", progress: 0, errorMessage: "Upload failed" } },
        }));
        showToast(`Failed to upload ${type}. Please try again.`, "error");
      }
    },
    [showToast]
  );

  // Delete file handler
  const deleteFileForUser = useCallback(async (user: UserRecord, url: string, type: "mealPlan" | "images" | "grocery") => {
    if (!confirm("Are you sure you want to delete?")) return;
    try {
      const refPath = type === "images" ? url.split("/o/")[1].split("?")[0] : type === "mealPlan" ? `mealPlans/${user.id}/plan.pdf` : `mealPlans/${user.id}/grocery-list.pdf`;
      await deleteObject(ref(storage, decodeURIComponent(refPath)));
      const updateData: DocumentData = {};
      if (type === "mealPlan") updateData.mealPlanFileURL = null;
      else if (type === "images") updateData.mealPlanImageURLs = (user.mealPlanImageURLs ?? []).filter((u) => u !== url);
      else updateData.groceryListURL = null;

      await updateDoc(doc(db, "users", user.id), updateData);
      showToast(`${type === "mealPlan" ? "Meal Plan PDF" : type === "images" ? "Image" : "Grocery List"} deleted successfully.`, "success");
    } catch (err) {
      console.error("Deletion failed:", err);
      showToast("Failed to delete file. Please try again.", "error");
    }
  }, [showToast]);

  // Filter and search users
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filter by status
    if (filterStatus === "delivered") {
      filtered = filtered.filter((u) => u.mealPlanStatus === "Delivered");
    } else if (filterStatus === "pending") {
      filtered = filtered.filter((u) => u.mealPlanStatus && u.mealPlanStatus !== "Delivered" && u.mealPlanStatus !== "Not Started");
    } else if (filterStatus === "not-started") {
      filtered = filtered.filter((u) => !u.mealPlanStatus || u.mealPlanStatus === "Not Started");
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((user) => {
        const name = (user.displayName ?? "").toLowerCase();
        const email = (user.email ?? "").toLowerCase();
        return name.includes(query) || email.includes(query);
      });
    }

    return filtered;
  }, [users, searchQuery, filterStatus]);

  const selectedUser = useMemo(() => users.find((u) => u.id === selectedUserId) ?? null, [users, selectedUserId]);

  // Handlers for UserDetailPanel
  const handlePdfInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!selectedUser) return;
      const files = event.target.files;
      if (!files || files.length === 0) return;
      uploadFileForUser(selectedUser, files[0], "mealPlan");
      event.target.value = "";
    },
    [selectedUser, uploadFileForUser]
  );

  const handleImagesInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!selectedUser) return;
      const files = event.target.files;
      if (!files || files.length === 0) return;
      Array.from(files).forEach((file) => uploadFileForUser(selectedUser, file, "images"));
      event.target.value = "";
    },
    [selectedUser, uploadFileForUser]
  );

  const handleGroceryInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!selectedUser) return;
      const files = event.target.files;
      if (!files || files.length === 0) return;
      uploadFileForUser(selectedUser, files[0], "grocery");
      event.target.value = "";
    },
    [selectedUser, uploadFileForUser]
  );

  const handleDeleteMealPlan = useCallback(() => {
    if (!selectedUser || !selectedUser.mealPlanFileURL) return;
    if (!confirm("Are you sure you want to delete the meal plan PDF?")) return;
    deleteFileForUser(selectedUser, selectedUser.mealPlanFileURL, "mealPlan");
  }, [selectedUser, deleteFileForUser]);

  const handleDeleteGroceryList = useCallback(() => {
    if (!selectedUser || !selectedUser.groceryListURL) return;
    if (!confirm("Are you sure you want to delete the grocery list?")) return;
    deleteFileForUser(selectedUser, selectedUser.groceryListURL, "grocery");
  }, [selectedUser, deleteFileForUser]);

  const handleDeleteImage = useCallback(
    (url: string) => {
      if (!selectedUser) return;
      if (!confirm("Are you sure you want to delete this image?")) return;
      deleteFileForUser(selectedUser, url, "images");
    },
    [selectedUser, deleteFileForUser]
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
          <header className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-muted/60 px-6 py-6 shadow-[0_0_70px_-35px_rgba(215,38,61,0.6)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-bold text-2xl uppercase tracking-[0.32em] text-foreground sm:text-3xl">
                User Management
              </h1>
              <p className="mt-2 text-[0.7rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
                Manage users and meal plans
              </p>
            </div>
            <button
              onClick={() => auth.signOut().then(() => router.replace("/login"))}
              className="rounded-full border border-accent bg-accent px-4 py-2 text-[0.6rem] font-medium uppercase tracking-[0.3em] text-background transition hover:bg-transparent hover:text-accent"
            >
              Logout
            </button>
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
          <div className="grid gap-4 sm:grid-cols-4">
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
                Delivered
              </p>
              <p className="mt-2 text-2xl font-bold uppercase tracking-[0.2em] text-accent">
                {users.filter((u) => u.mealPlanStatus === "Delivered").length}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/50 px-6 py-4 text-center">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-foreground/60">
                Pending
              </p>
              <p className="mt-2 text-2xl font-bold uppercase tracking-[0.2em] text-foreground">
                {users.filter((u) => u.mealPlanStatus && u.mealPlanStatus !== "Delivered" && u.mealPlanStatus !== "Not Started").length}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/50 px-6 py-4 text-center">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-foreground/60">
                Not Started
              </p>
              <p className="mt-2 text-2xl font-bold uppercase tracking-[0.2em] text-foreground">
                {users.filter((u) => !u.mealPlanStatus || u.mealPlanStatus === "Not Started").length}
              </p>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-muted/60 px-6 py-6 shadow-[0_0_60px_-30px_rgba(215,38,61,0.6)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-border/70 bg-background/40 px-4 py-2.5 text-[0.65rem] uppercase tracking-[0.2em] text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus("all")}
                className={`rounded-full border px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] transition ${
                  filterStatus === "all"
                    ? "border-accent bg-accent/20 text-accent"
                    : "border-border/70 bg-background/40 text-foreground/70 hover:border-accent hover:text-accent"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus("delivered")}
                className={`rounded-full border px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] transition ${
                  filterStatus === "delivered"
                    ? "border-accent bg-accent/20 text-accent"
                    : "border-border/70 bg-background/40 text-foreground/70 hover:border-accent hover:text-accent"
                }`}
              >
                Delivered
              </button>
              <button
                onClick={() => setFilterStatus("pending")}
                className={`rounded-full border px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] transition ${
                  filterStatus === "pending"
                    ? "border-accent bg-accent/20 text-accent"
                    : "border-border/70 bg-background/40 text-foreground/70 hover:border-accent hover:text-accent"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilterStatus("not-started")}
                className={`rounded-full border px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] transition ${
                  filterStatus === "not-started"
                    ? "border-accent bg-accent/20 text-accent"
                    : "border-border/70 bg-background/40 text-foreground/70 hover:border-accent hover:text-accent"
                }`}
              >
                Not Started
              </button>
            </div>
          </div>

          {/* Users Table */}
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
                  {searchQuery || filterStatus !== "all"
                    ? "No users match your filters."
                    : "No users found."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="max-h-[600px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-border/60">
                    <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                      <tr>
                        <th className="px-4 py-3 text-left text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-foreground/60">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-foreground/60">
                          Package
                        </th>
                        <th className="px-4 py-3 text-left text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-foreground/60">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-foreground/60">
                          Meal Plan
                        </th>
                        <th className="px-4 py-3 text-left text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-foreground/60">
                          Referrals
                        </th>
                        <th className="px-4 py-3 text-right text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-foreground/60">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 bg-background/5">
                      {filteredUsers.map((user) => {
                        const isSelected = selectedUserId === user.id;
                        return (
                          <motion.tr
                            key={user.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`transition hover:bg-background/10 cursor-pointer ${
                              isSelected ? "bg-accent/10 border-l-4 border-l-accent" : ""
                            }`}
                            onClick={() => setSelectedUserId(user.id)}
                          >
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
                                  {user.displayName ?? user.email ?? "Unnamed User"}
                                </span>
                                {user.email && (
                                  <span className="mt-1 text-[0.65rem] uppercase tracking-[0.25em] text-foreground/60">
                                    {user.email}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-foreground/70">
                                {user.packageTier ?? "—"}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`text-[0.65rem] font-semibold uppercase tracking-[0.25em] ${
                                  user.mealPlanStatus === "Delivered"
                                    ? "text-accent"
                                    : user.mealPlanStatus && user.mealPlanStatus !== "Not Started"
                                    ? "text-yellow-500"
                                    : "text-foreground/60"
                                }`}
                              >
                                {user.mealPlanStatus ?? "Not Started"}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              {user.mealPlanFileURL ? (
                                <a
                                  href={user.mealPlanFileURL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-accent underline transition hover:text-accent/80"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View PDF
                                </a>
                              ) : (
                                <span className="text-[0.65rem] uppercase tracking-[0.25em] text-foreground/50">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-foreground/70">
                                {user.referralCredits ?? 0}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUserId(user.id);
                                }}
                                className="rounded-full border border-border/70 bg-background/40 px-4 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-foreground/70 transition hover:border-accent hover:bg-accent/20 hover:text-accent"
                              >
                                Manage
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* User Detail Panel */}
          {selectedUser && (
            <UserDetailPanel
              user={selectedUser}
              onPdfInputChange={handlePdfInputChange}
              onImagesInputChange={handleImagesInputChange}
              onGroceryInputChange={handleGroceryInputChange}
              pdfStatus={uploadStates[selectedUser.id]?.mealPlan ?? null}
              imageStatus={
                (() => {
                  const userStates = uploadStates[selectedUser.id];
                  if (!userStates) return null;
                  const imageKey = Object.keys(userStates).find((k) => k !== "mealPlan" && k !== "grocery");
                  return imageKey ? userStates[imageKey] : null;
                })()
              }
              groceryStatus={uploadStates[selectedUser.id]?.grocery ?? null}
              onDeleteMealPlan={selectedUser.mealPlanFileURL ? handleDeleteMealPlan : undefined}
              onDeleteGroceryList={selectedUser.groceryListURL ? handleDeleteGroceryList : undefined}
              onDeleteImage={handleDeleteImage}
            />
          )}
        </div>
      </div>
    </div>
  );
}

