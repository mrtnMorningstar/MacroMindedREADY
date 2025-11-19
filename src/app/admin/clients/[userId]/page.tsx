"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import {
  ArrowUpTrayIcon,
  CheckIcon,
  ClipboardIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { db, storage } from "@/lib/firebase";
import AdminLayout from "@/components/admin/AdminLayout";
import { SkeletonCard } from "@/components/common/Skeleton";
import { useToast } from "@/components/ui/Toast";

export default function ClientDetailPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const userId = params.userId;
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const loadUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setAdminNotes(data?.adminNotes ?? "");
        } else {
          toast.error("User not found");
          router.push("/admin/clients");
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        toast.error("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    void loadUser();
  }, [userId, router, toast]);

  const handleSaveNotes = useCallback(async () => {
    if (!userId) return;
    setSavingNotes(true);
    try {
      await updateDoc(doc(db, "users", userId), {
        adminNotes,
      });
      toast.success("Admin notes saved");
    } catch (error) {
      console.error("Failed to save notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  }, [userId, adminNotes, toast]);

  const handleMarkDelivered = useCallback(async () => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, "users", userId), {
        mealPlanStatus: "Delivered",
        mealPlanDeliveredAt: serverTimestamp(),
      });
      toast.success("Meal plan marked as delivered");
      // Reload user data
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error("Failed to mark as delivered:", error);
      toast.error("Failed to update status");
    }
  }, [userId, toast]);

  const handleUploadPDF = useCallback(async (file: File) => {
    if (!userId) return;
    setUploading(true);
    setUploadProgress(0);

    try {
      const storageRef = ref(storage, `mealPlans/${userId}/plan.pdf`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          toast.error("Failed to upload PDF");
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await updateDoc(doc(db, "users", userId), {
            mealPlanFileURL: downloadURL,
          });
          toast.success("PDF uploaded successfully");
          setUploading(false);
          setUploadProgress(0);
          // Reload user data
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        }
      );
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload PDF");
      setUploading(false);
    }
  }, [userId, toast]);

  const handleUploadImages = useCallback(async (files: FileList) => {
    if (!userId) return;
    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const storageRef = ref(storage, `mealPlans/${userId}/images/${file.name}`);
        await uploadBytesResumable(storageRef, file);
        return getDownloadURL(storageRef);
      });

      const urls = await Promise.all(uploadPromises);
      const existingUrls = userData?.mealPlanImageURLs ?? [];
      await updateDoc(doc(db, "users", userId), {
        mealPlanImageURLs: [...existingUrls, ...urls],
      });
      toast.success("Images uploaded successfully");
      setUploading(false);
      // Reload user data
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload images");
      setUploading(false);
    }
  }, [userId, userData, toast]);

  const handleCopyEmail = useCallback(async () => {
    if (!userData?.email) return;
    try {
      await navigator.clipboard.writeText(userData.email);
      toast.success("Email copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy email");
    }
  }, [userData, toast]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  if (!userData) {
    return (
      <AdminLayout>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center">
          <p className="text-neutral-400">User not found</p>
        </div>
      </AdminLayout>
    );
  }

  const purchaseDate = userData.purchaseDate?.toDate
    ? userData.purchaseDate.toDate()
    : userData.purchaseDate instanceof Date
    ? userData.purchaseDate
    : null;

  const daysSincePurchase = purchaseDate
    ? Math.floor((Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="mb-4 text-sm text-neutral-400 hover:text-white transition"
            >
              ← Back to Clients
            </button>
            <h1 className="text-xl font-semibold text-white mb-2">
              {userData.displayName ?? "Unnamed User"}
            </h1>
            <p className="text-sm text-neutral-400">{userData.email}</p>
          </div>
        </div>

        {/* Client Info Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-xs uppercase tracking-wide text-neutral-400 mb-2">Package</p>
            <p className="text-lg font-semibold text-white">
              {userData.packageTier ?? "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-xs uppercase tracking-wide text-neutral-400 mb-2">
              Days Since Purchase
            </p>
            <p className="text-lg font-semibold text-white">
              {daysSincePurchase !== null ? `${daysSincePurchase} days` : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-xs uppercase tracking-wide text-neutral-400 mb-2">Plan Status</p>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                userData.mealPlanStatus === "Delivered"
                  ? "bg-green-500/20 text-green-500 border-green-500/50"
                  : userData.mealPlanStatus === "In Progress"
                  ? "bg-amber-500/20 text-amber-500 border-amber-500/50"
                  : "bg-neutral-600/20 text-neutral-400 border-neutral-600/50"
              }`}
            >
              {userData.mealPlanStatus ?? "Not Started"}
            </span>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-xs uppercase tracking-wide text-neutral-400 mb-2">
              Referral Credits
            </p>
            <p className="text-lg font-semibold text-[#D7263D]">
              {userData.referralCredits ?? 0}
            </p>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Admin Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => e.target.files?.[0] && handleUploadPDF(e.target.files[0])}
                className="hidden"
                disabled={uploading}
              />
              <div className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-700">
                <ArrowUpTrayIcon className="h-5 w-5" />
                Upload PDF
              </div>
            </label>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && handleUploadImages(e.target.files)}
                className="hidden"
                disabled={uploading}
              />
              <div className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-700">
                <ArrowUpTrayIcon className="h-5 w-5" />
                Upload Images
              </div>
            </label>
            <button
              onClick={handleMarkDelivered}
              disabled={userData.mealPlanStatus === "Delivered"}
              className="flex items-center gap-2 rounded-lg border border-[#D7263D] bg-[#D7263D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckIcon className="h-5 w-5" />
              Mark Delivered
            </button>
            <button
              onClick={handleCopyEmail}
              className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-700"
            >
              <ClipboardIcon className="h-5 w-5" />
              Copy Email
            </button>
          </div>
          {uploading && (
            <div className="mt-4">
              <div className="h-2 w-full rounded-full bg-neutral-800">
                <div
                  className="h-full rounded-full bg-[#D7263D] transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-neutral-400">Uploading... {Math.round(uploadProgress)}%</p>
            </div>
          )}
        </div>

        {/* Admin Notes */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Admin Notes</h2>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-[#D7263D] focus:outline-none"
            placeholder="Add internal notes about this client..."
          />
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="mt-4 rounded-lg border border-[#D7263D] bg-[#D7263D] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90 disabled:opacity-50"
          >
            {savingNotes ? "Saving..." : "Save Notes"}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

