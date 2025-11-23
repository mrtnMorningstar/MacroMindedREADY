"use client";

import { useState, useCallback, useEffect } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
  ArrowUpTrayIcon,
  CheckIcon,
  TrashIcon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { db, storage } from "@/lib/firebase";
import Slideover from "@/components/ui/Slideover";
import AppModal from "@/components/ui/AppModal";
import { useToast } from "@/components/ui/Toast";
import { MealPlanStatus } from "@/types/status";

type Client = {
  id: string;
  name?: string;
  displayName?: string | null;
  email?: string;
  packageTier?: string | null;
  mealPlanStatus?: string;
  referralCredits?: number;
  purchaseDate?: Date | null;
  mealPlanFileURL?: string | null;
  mealPlanImageURLs?: string[] | null;
  adminNotes?: string | null;
  role?: string;
};

type ClientDetailSlideoverProps = {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
};

export default function ClientDetailSlideover({
  client,
  isOpen,
  onClose,
  onUpdate,
}: ClientDetailSlideoverProps) {
  const toast = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    packageTier: "",
    referralCredits: 0,
    mealPlanStatus: "",
    adminNotes: "",
    role: "",
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        name: (client.name || client.displayName || ""),
        email: (client.email || ""),
        packageTier: (client.packageTier || ""),
        referralCredits: (client.referralCredits ?? 0),
        mealPlanStatus: (client.mealPlanStatus || MealPlanStatus.NOT_STARTED),
        adminNotes: client.adminNotes || "",
        role: client.role || "",
      });
    }
  }, [client]);

  const handleSave = useCallback(
    async (field: string) => {
      if (!client) return;

      try {
        const updates: any = {};
        if (field === "name") updates.displayName = formData.name;
        if (field === "email") updates.email = formData.email;
        if (field === "packageTier") updates.packageTier = formData.packageTier || null;
        if (field === "referralCredits") updates.referralCredits = Number(formData.referralCredits);
        if (field === "mealPlanStatus") updates.mealPlanStatus = formData.mealPlanStatus;
        if (field === "adminNotes") updates.adminNotes = formData.adminNotes;
        
        // Handle role changes via API route (which updates custom claims AND Firestore)
        if (field === "role") {
          const makeAdmin = formData.role === "admin";
          
          // Get the current user's ID token for authorization
          const { auth } = await import("@/lib/firebase");
          const { currentUser } = auth;
          if (!currentUser) {
            toast.error("You must be logged in to perform this action");
            return;
          }

          const idToken = await currentUser.getIdToken();

          // Use the API route which handles custom claims AND Firestore role field
          const response = await fetch("/api/admin/setAdminRole", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              uid: client.id,
              makeAdmin,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to update admin role");
          }

          toast.success(`${field} updated successfully`);
          setEditing(null);
          onUpdate();
          return;
        }

        await updateDoc(doc(db, "users", client.id), updates);
        toast.success(`${field} updated successfully`);
        setEditing(null);
        onUpdate();
      } catch (error) {
        console.error(`Failed to update ${field}:`, error);
        toast.error(`Failed to update ${field}`);
      }
    },
    [client, formData, toast, onUpdate]
  );

  const handleUploadPDF = useCallback(
    async (file: File) => {
      if (!client) return;
      setUploading(true);
      setUploadProgress(0);

      try {
        const storageRef = ref(storage, `mealPlans/${client.id}/plan.pdf`);
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
            await updateDoc(doc(db, "users", client.id), {
              mealPlanFileURL: downloadURL,
            });
            toast.success("PDF uploaded successfully");
            setUploading(false);
            setUploadProgress(0);
            onUpdate();
          }
        );
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload PDF");
        setUploading(false);
      }
    },
    [client, toast, onUpdate]
  );

  const handleUploadImages = useCallback(
    async (files: FileList) => {
      if (!client) return;
      setUploading(true);

      try {
        const { uploadImageWithThumbnail } = await import("@/lib/image-utils");
        const uploadPromises = Array.from(files).map(async (file) => {
          const storagePath = `mealPlans/${client.id}/images/${file.name}`;
          const { fullUrl } = await uploadImageWithThumbnail(file, storagePath);
          return fullUrl; // Store only full URL, thumbnails are generated automatically
        });

        const urls = await Promise.all(uploadPromises);
        const existingUrls = client.mealPlanImageURLs ?? [];
        await updateDoc(doc(db, "users", client.id), {
          mealPlanImageURLs: [...existingUrls, ...urls],
        });
        toast.success("Images uploaded successfully");
        setUploading(false);
        onUpdate();
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload images");
        setUploading(false);
      }
    },
    [client, toast, onUpdate]
  );

  const handleMarkDelivered = useCallback(async () => {
    if (!client) return;
    try {
      await updateDoc(doc(db, "users", client.id), {
        mealPlanStatus: MealPlanStatus.DELIVERED,
        mealPlanDeliveredAt: serverTimestamp(),
      });
      toast.success("Meal plan marked as delivered");
      onUpdate();
    } catch (error) {
      console.error("Failed to mark as delivered:", error);
      toast.error("Failed to update status");
    }
  }, [client, toast, onUpdate]);

  const handleDeleteUser = useCallback(async () => {
    if (!client) return;
    try {
      // Note: This would require Firebase Admin SDK on server
      // For now, just mark as deleted in Firestore
      await updateDoc(doc(db, "users", client.id), {
        deleted: true,
        deletedAt: serverTimestamp(),
      });
      toast.success("User marked as deleted");
      onClose();
      onUpdate();
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user");
    }
  }, [client, toast, onClose, onUpdate]);

  const handleImpersonate = useCallback(async () => {
    if (!client) return;
    
    try {
      // Get current user's ID token for authorization
      const { auth } = await import("@/lib/firebase");
      const { currentUser } = auth;
      
      if (!currentUser) {
        toast.error("You must be logged in to impersonate users");
        return;
      }

      const idToken = await currentUser.getIdToken();

      // Generate impersonation token via API
      const response = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          targetUserId: client.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate impersonation token");
      }

      // Redirect to dashboard with impersonation token
      const dashboardUrl = new URL("/dashboard", window.location.origin);
      dashboardUrl.searchParams.set("impersonate", data.token);
      window.location.href = dashboardUrl.toString();
    } catch (error) {
      console.error("Failed to impersonate user:", error);
      toast.error(error instanceof Error ? error.message : "Failed to impersonate user");
    }
  }, [client, toast]);

  const handleExitImpersonation = useCallback(() => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("exit-impersonation", "true");
    window.location.href = currentUrl.toString();
  }, []);

  if (!client) return null;

  return (
    <>
      <Slideover
        isOpen={isOpen}
        onClose={onClose}
        title={(client.name || client.displayName || "Client Details")}
      >
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="text-sm uppercase tracking-wide text-neutral-500 mb-4">
              Basic Information
            </h3>
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="clientName" className="block text-xs uppercase tracking-wide text-neutral-500 mb-2">
                  Name
                </label>
                {editing === "name" ? (
                  <div className="flex gap-2">
                    <input
                      id="clientName"
                      name="clientName"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="flex-1 rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-2 text-sm text-white focus:border-[#D7263D] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSave("name")}
                      className="rounded-lg bg-[#D7263D] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-neutral-300">{formData.name}</p>
                    <button
                      type="button"
                      onClick={() => setEditing("name")}
                      className="text-xs text-[#D7263D] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="clientEmail" className="block text-xs uppercase tracking-wide text-neutral-500 mb-2">
                  Email
                </label>
                {editing === "email" ? (
                  <div className="flex gap-2">
                    <input
                      id="clientEmail"
                      name="clientEmail"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="flex-1 rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-2 text-sm text-white focus:border-[#D7263D] focus:outline-none"
                    />
                    <button
                      onClick={() => handleSave("email")}
                      className="rounded-lg bg-[#D7263D] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-neutral-300">{formData.email}</p>
                    <button
                      onClick={() => setEditing("email")}
                      className="text-xs text-[#D7263D] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Package Tier */}
              <div>
                <label htmlFor="clientPackageTier" className="block text-xs uppercase tracking-wide text-neutral-500 mb-2">
                  Package Tier
                </label>
                {editing === "packageTier" ? (
                  <div className="flex gap-2">
                    <select
                      id="clientPackageTier"
                      name="clientPackageTier"
                      value={formData.packageTier}
                      onChange={(e) => setFormData({ ...formData, packageTier: e.target.value })}
                      className="flex-1 rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-2 text-sm text-white focus:border-[#D7263D] focus:outline-none"
                    >
                      <option value="">None</option>
                      <option value="Basic">Basic</option>
                      <option value="Pro">Pro</option>
                      <option value="Elite">Elite</option>
                    </select>
                    <button
                      onClick={() => handleSave("packageTier")}
                      className="rounded-lg bg-[#D7263D] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-neutral-300">{formData.packageTier || "None"}</p>
                    <button
                      onClick={() => setEditing("packageTier")}
                      className="text-xs text-[#D7263D] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Meal Plan Status */}
              <div>
                <label htmlFor="clientMealPlanStatus" className="block text-xs uppercase tracking-wide text-neutral-500 mb-2">
                  Meal Plan Status
                </label>
                {editing === "mealPlanStatus" ? (
                  <div className="flex gap-2">
                    <select
                      id="clientMealPlanStatus"
                      name="clientMealPlanStatus"
                      value={formData.mealPlanStatus}
                      onChange={(e) => setFormData({ ...formData, mealPlanStatus: e.target.value })}
                      className="flex-1 rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-2 text-sm text-white focus:border-[#D7263D] focus:outline-none"
                    >
                      <option value={MealPlanStatus.NOT_STARTED}>{MealPlanStatus.NOT_STARTED}</option>
                      <option value={MealPlanStatus.IN_PROGRESS}>{MealPlanStatus.IN_PROGRESS}</option>
                      <option value={MealPlanStatus.DELIVERED}>{MealPlanStatus.DELIVERED}</option>
                    </select>
                    <button
                      onClick={() => handleSave("mealPlanStatus")}
                      className="rounded-lg bg-[#D7263D] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                        formData.mealPlanStatus === MealPlanStatus.DELIVERED
                          ? "bg-green-500/20 text-green-500 border-green-500/50"
                          : formData.mealPlanStatus === MealPlanStatus.IN_PROGRESS
                          ? "bg-amber-500/20 text-amber-500 border-amber-500/50"
                          : "bg-neutral-600/20 text-neutral-400 border-neutral-600/50"
                      }`}
                    >
                      {formData.mealPlanStatus}
                    </span>
                    <button
                      onClick={() => setEditing("mealPlanStatus")}
                      className="text-xs text-[#D7263D] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Referral Credits */}
              <div>
                <label htmlFor="clientReferralCredits" className="block text-xs uppercase tracking-wide text-neutral-500 mb-2">
                  Referral Credits
                </label>
                {editing === "referralCredits" ? (
                  <div className="flex gap-2">
                    <input
                      id="clientReferralCredits"
                      name="clientReferralCredits"
                      type="number"
                      value={formData.referralCredits}
                      onChange={(e) =>
                        setFormData({ ...formData, referralCredits: Number(e.target.value) })
                      }
                      className="flex-1 rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-2 text-sm text-white focus:border-[#D7263D] focus:outline-none"
                    />
                    <button
                      onClick={() => handleSave("referralCredits")}
                      className="rounded-lg bg-[#D7263D] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-neutral-300">{formData.referralCredits}</p>
                    <button
                      onClick={() => setEditing("referralCredits")}
                      className="text-xs text-[#D7263D] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Admin Role Toggle */}
              <div>
                <div className="block text-xs uppercase tracking-wide text-neutral-500 mb-2">
                  Admin Role
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      id="adminRoleToggle"
                      aria-label={formData.role === "admin" ? "Remove admin role" : "Grant admin role"}
                      onClick={() => {
                        const newRole = formData.role === "admin" ? "" : "admin";
                        setFormData({ ...formData, role: newRole });
                        handleSave("role");
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.role === "admin" ? "bg-[#D7263D]" : "bg-neutral-700"
                      }`}
                      role="switch"
                      aria-checked={formData.role === "admin"}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.role === "admin" ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span className="text-sm text-neutral-300">
                      {formData.role === "admin" ? "Admin" : "User"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <label htmlFor="adminNotes" className="block text-sm uppercase tracking-wide text-neutral-500 mb-4">
              Admin Notes
            </label>
            <textarea
              id="adminNotes"
              name="adminNotes"
              value={formData.adminNotes}
              onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
              onBlur={() => handleSave("adminNotes")}
              rows={6}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-[#D7263D] focus:outline-none"
              placeholder="Add internal notes about this client..."
            />
          </div>

          {/* Actions */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="text-sm uppercase tracking-wide text-neutral-500 mb-4">Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <label htmlFor="uploadPDF" className="cursor-pointer">
                <input
                  id="uploadPDF"
                  name="uploadPDF"
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
              <label htmlFor="uploadImages" className="cursor-pointer">
                <input
                  id="uploadImages"
                  name="uploadImages"
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
                type="button"
                onClick={handleMarkDelivered}
                disabled={formData.mealPlanStatus === MealPlanStatus.DELIVERED}
                className="flex items-center gap-2 rounded-lg border border-[#D7263D] bg-[#D7263D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90 disabled:opacity-50"
              >
                <CheckIcon className="h-5 w-5" />
                Mark Delivered
              </button>
              <button
                type="button"
                onClick={handleImpersonate}
                className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-700"
              >
                <UserCircleIcon className="h-5 w-5" />
                Impersonate
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/20 px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-500/30"
              >
                <TrashIcon className="h-5 w-5" />
                Delete User
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
                <p className="mt-2 text-xs text-neutral-400">
                  Uploading... {Math.round(uploadProgress)}%
                </p>
              </div>
            )}
          </div>

          {/* Meal Plan Links */}
          {client.mealPlanFileURL && (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <h3 className="text-sm uppercase tracking-wide text-neutral-500 mb-4">
                Meal Plan Files
              </h3>
              <div className="space-y-2">
                <a
                  href={client.mealPlanFileURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-[#D7263D] hover:underline"
                >
                  View PDF
                </a>
                {client.mealPlanImageURLs && client.mealPlanImageURLs.length > 0 && (
                  <div className="space-y-2">
                    {client.mealPlanImageURLs.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-[#D7263D] hover:underline"
                      >
                        View Image {idx + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Slideover>

      {/* Delete Confirmation Modal */}
      <AppModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-neutral-300">
            Are you sure you want to delete {client.name || client.displayName || "this user"}? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                handleDeleteUser();
                setShowDeleteModal(false);
              }}
              className="rounded-lg border border-red-500/50 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500/30"
            >
              Delete User
            </button>
          </div>
        </div>
      </AppModal>
    </>
  );
}

