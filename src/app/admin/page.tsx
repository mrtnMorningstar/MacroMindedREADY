"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { collection, doc, getDoc, onSnapshot, updateDoc, serverTimestamp, query, where, getDocs, type DocumentData } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable, deleteObject } from "firebase/storage";

import { auth, db, storage } from "@/lib/firebase";
import AdminLayout from "@/components/admin/AdminLayout";
import DashboardSummary from "@/components/admin/DashboardSummary";
import { SkeletonTable } from "@/components/common/Skeleton";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

type UserRecord = {
  id: string;
  email?: string | null;
  displayName?: string | null;
  packageTier?: string | null;
  mealPlanStatus?: string | null;
  mealPlanFileURL?: string | null;
  mealPlanImageURLs?: string[] | null;
  mealPlanDeliveredAt?: { toDate?: () => Date; seconds?: number } | Date | null;
  profile?: Record<string, string | null> | null;
  groceryListURL?: string | null;
  referralCode?: string | null;
  referralCredits?: number | null;
  referredBy?: string | null;
  purchaseDate?: { toDate?: () => Date; seconds?: number } | Date | null;
  adminNotes?: string | null;
  purchaseAmount?: number | null;
};

type UploadStatus = {
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
  errorMessage?: string;
};

export default function AdminPage() {
  const router = useRouter();

  // AuthGate handles auth checks, so we can remove these states
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "needs-plan" | "delivered" | "overdue" | "inactive">("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [uploadStates, setUploadStates] = useState<Record<string, Record<string, UploadStatus>>>({});

  // Admin access is verified by AuthGate in admin layout
  // No need for local auth checks

  // Show toast notification
  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }, []);

  // Subscribe to users collection (exclude admins)
  useEffect(() => {
    // AuthGate ensures we're admin, so we can proceed

    setLoadingUsers(true);
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      async (snapshot) => {
        const records: UserRecord[] = [];
        
        // Process users and fetch purchase data
        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          if (data?.role === "admin") continue;

          // Fetch purchase data for this user
          let purchaseAmount: number | null = null;
          try {
            const purchasesQuery = query(
              collection(db, "purchases"),
              where("userId", "==", docSnapshot.id)
            );
            const purchasesSnapshot = await getDocs(purchasesQuery);
            
            if (!purchasesSnapshot.empty) {
              // Get the latest purchase (sorted by createdAt)
              const purchases = purchasesSnapshot.docs.map((doc) => {
                const data = doc.data();
          return {
                  amount: data?.amount ?? null,
                  createdAt: data?.createdAt ?? null,
                };
              });
              
              purchases.sort((a, b) => {
                const aTime = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds ?? 0;
                const bTime = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds ?? 0;
                return bTime - aTime;
              });
              
              purchaseAmount = purchases[0]?.amount ?? null;
            }
          } catch (error) {
            console.error(`Failed to fetch purchase for user ${docSnapshot.id}:`, error);
          }

          records.push({
            id: docSnapshot.id,
            ...data,
            mealPlanDeliveredAt: data?.mealPlanDeliveredAt ?? null,
            purchaseDate: data?.purchaseDate ?? null,
            adminNotes: data?.adminNotes ?? null,
            purchaseAmount,
          } as UserRecord);
        }

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
  }, [showToast]);

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

  // Helper function to parse Firestore dates
  const parseFirestoreDate = (date?: { toDate?: () => Date; seconds?: number } | Date | null): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (typeof (date as { toDate?: () => Date }).toDate === "function") {
      return (date as { toDate: () => Date }).toDate();
    }
    if (typeof (date as { seconds?: number }).seconds === "number") {
      const value = date as { seconds: number; nanoseconds?: number };
      return new Date(value.seconds * 1000 + Math.floor((value.nanoseconds ?? 0) / 1_000_000));
    }
    return null;
  };

  // Helper function to check if a plan is overdue (more than 30 days since delivery)
  const isOverdue = (user: UserRecord): boolean => {
    if (!user.mealPlanDeliveredAt || user.mealPlanStatus !== "Delivered") return false;
    const deliveredDate = parseFirestoreDate(user.mealPlanDeliveredAt);
    if (!deliveredDate) return false;
    const daysSinceDelivery = Math.floor((Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceDelivery > 30; // Consider overdue if more than 30 days old
  };

  // Helper function to check if a plan is expiring soon (25-30 days since delivery)
  const isExpiringSoon = (user: UserRecord): boolean => {
    if (!user.mealPlanDeliveredAt || user.mealPlanStatus !== "Delivered") return false;
    const deliveredDate = parseFirestoreDate(user.mealPlanDeliveredAt);
    if (!deliveredDate) return false;
    const daysSinceDelivery = Math.floor((Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceDelivery >= 25 && daysSinceDelivery <= 30;
  };

  // Helper function to get user status badge info
  const getUserStatusBadge = (user: UserRecord): { label: string; color: string; bgColor: string; borderColor: string } => {
    if (isOverdue(user)) {
      return {
        label: "Overdue",
        color: "text-red-500",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
      };
    }
    if (isExpiringSoon(user)) {
      return {
        label: "Expiring Soon",
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/30",
      };
    }
    if (user.mealPlanStatus === "Delivered") {
      return {
        label: "Delivered",
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/30",
      };
    }
    if (user.mealPlanStatus === "In Progress") {
      return {
        label: "In Progress",
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/30",
      };
    }
    if (!user.packageTier || user.mealPlanStatus === "Not Started" || !user.mealPlanStatus) {
      return {
        label: "Inactive",
        color: "text-foreground/50",
        bgColor: "bg-background/20",
        borderColor: "border-border/40",
      };
    }
    return {
      label: user.mealPlanStatus ?? "Not Started",
      color: "text-foreground/60",
      bgColor: "bg-background/20",
      borderColor: "border-border/40",
    };
  };

  // Filter and search users
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filter by status
    if (filterStatus === "delivered") {
      filtered = filtered.filter((u) => u.mealPlanStatus === "Delivered" && !isOverdue(u) && !isExpiringSoon(u));
    } else if (filterStatus === "needs-plan") {
      filtered = filtered.filter((u) => {
        const hasPackage = !!u.packageTier;
        const needsPlan = !u.mealPlanStatus || u.mealPlanStatus === "Not Started" || u.mealPlanStatus === "In Progress";
        return hasPackage && needsPlan;
      });
    } else if (filterStatus === "overdue") {
      filtered = filtered.filter((u) => isOverdue(u) || isExpiringSoon(u));
    } else if (filterStatus === "inactive") {
      filtered = filtered.filter((u) => !u.packageTier || (!u.mealPlanStatus || u.mealPlanStatus === "Not Started"));
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

  const handleNotesSaved = useCallback(() => {
    // Refresh user data to get updated adminNotes
    if (selectedUserId) {
      getDoc(doc(db, "users", selectedUserId)).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setUsers((prev) =>
            prev.map((u) =>
              u.id === selectedUserId
                ? { ...u, adminNotes: data?.adminNotes ?? null }
                : u
            )
          );
        }
      });
    }
  }, [selectedUserId]);

  const handleStatusUpdated = useCallback(() => {
    // Refresh user data to get updated status
    if (selectedUserId) {
      getDoc(doc(db, "users", selectedUserId)).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setUsers((prev) =>
            prev.map((u) =>
              u.id === selectedUserId
                ? {
                    ...u,
                    mealPlanStatus: data?.mealPlanStatus ?? null,
                    mealPlanDeliveredAt: data?.mealPlanDeliveredAt ?? null,
                  }
                : u
            )
          );
        }
      });
    }
  }, [selectedUserId]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-white mb-2">Dashboard</h1>
          <p className="text-sm text-neutral-400">Overview of all clients and meal plans</p>
        </div>

        {/* Dashboard Summary */}
        <DashboardSummary />

        {/* Search and Filter Bar */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-[#D7263D] focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "needs-plan", "delivered", "overdue", "inactive"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    filterStatus === f
                      ? "bg-[#D7263D] text-white"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  {f === "all"
                    ? "All"
                    : f === "needs-plan"
                    ? "Needs Plan"
                    : f === "delivered"
                    ? "Delivered"
                    : f === "overdue"
                    ? "Overdue"
                    : "Inactive"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Users Table */}
        {loadingUsers ? (
          <SkeletonTable rows={10} />
        ) : (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Package
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Meal Plan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Referrals
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filteredUsers.map((user, index) => {
                    const badge = getUserStatusBadge(user);
                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-neutral-800/30 transition cursor-pointer"
                        onClick={() => setSelectedUserId(user.id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white">
                              {user.displayName ?? user.email ?? "Unnamed User"}
                            </span>
                            {user.email && (
                              <span className="text-xs text-neutral-400">{user.email}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-neutral-300">{user.packageTier ?? "—"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badge.color} ${badge.bgColor} ${badge.borderColor}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {user.mealPlanFileURL ? (
                            <a
                              href={user.mealPlanFileURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-[#D7263D] hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View PDF
                            </a>
                          ) : (
                            <span className="text-sm text-neutral-500">Pending</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-[#D7263D]/20 px-3 py-1 text-xs font-semibold text-[#D7263D]">
                            {user.referralCredits ?? 0}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/clients/${user.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-700"
                          >
                            View
                          </Link>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-neutral-400">
                  {searchQuery || filterStatus !== "all"
                    ? "No users match your filters."
                    : "No users found."}
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </AdminLayout>
  );
}

