"use client";

import { motion } from "framer-motion";
import { useMemo, useState, useEffect, useRef, type ChangeEvent } from "react";
import { CardUpload } from "./CardUpload";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

type UserRecord = {
  id: string;
  displayName?: string | null;
  email?: string | null;
  packageTier?: string | null;
  mealPlanStatus?: string | null;
  mealPlanFileURL?: string | null;
  mealPlanImageURLs?: string[] | null;
  groceryListURL?: string | null;
  profile?: Record<string, string | null | undefined> | null;
  mealPlanDeliveredAt?: { toDate?: () => Date; seconds?: number } | Date | null;
  purchaseDate?: { toDate?: () => Date; seconds?: number } | Date | null;
  referralCredits?: number | null;
  adminNotes?: string | null;
  purchaseAmount?: number | null;
};

type UploadStatus = {
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
  errorMessage?: string;
};

type UserDetailPanelProps = {
  user: UserRecord;
  onPdfInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onImagesInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onGroceryInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  pdfStatus?: UploadStatus | null;
  imageStatus?: UploadStatus | null;
  groceryStatus?: UploadStatus | null;
  onDeleteMealPlan?: () => void;
  onDeleteGroceryList?: () => void;
  onDeleteImage?: (url: string) => void;
  onNotesSaved?: () => void;
  onStatusUpdated?: () => void;
};

export function UserDetailPanel({
  user,
  onPdfInputChange,
  onImagesInputChange,
  onGroceryInputChange,
  pdfStatus,
  imageStatus,
  groceryStatus,
  onDeleteMealPlan,
  onDeleteGroceryList,
  onDeleteImage,
  onNotesSaved,
  onStatusUpdated,
}: UserDetailPanelProps) {
  const [adminNotes, setAdminNotes] = useState(user.adminNotes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSavedToast, setNotesSavedToast] = useState(false);
  const [markingDelivered, setMarkingDelivered] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  // Update notes when user changes
  useEffect(() => {
    setAdminNotes(user.adminNotes ?? "");
  }, [user.adminNotes]);

  const profileEntries = useMemo(() => {
    if (!user.profile) return [];

    return Object.entries(user.profile).filter(
      ([, value]) => value && String(value).trim() !== ""
    );
  }, [user.profile]);

  const mealPlanImages = user.mealPlanImageURLs ?? [];

  // Parse Firestore dates
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

  // Calculate days since purchase
  const daysSincePurchase = useMemo(() => {
    const purchaseDate = parseFirestoreDate(user.purchaseDate);
    if (!purchaseDate) return null;
    const days = Math.floor((Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  }, [user.purchaseDate]);

  // Calculate days since delivery
  const daysSinceDelivery = useMemo(() => {
    const deliveredDate = parseFirestoreDate(user.mealPlanDeliveredAt);
    if (!deliveredDate) return null;
    const days = Math.floor((Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  }, [user.mealPlanDeliveredAt]);

  const handleSaveNotes = async () => {
    if (savingNotes) return;

    setSavingNotes(true);
    try {
      const userDocRef = doc(db, "users", user.id);
      await updateDoc(userDocRef, {
        adminNotes: adminNotes.trim() || null,
      });

      setNotesSavedToast(true);
      setTimeout(() => setNotesSavedToast(false), 3000);

      if (onNotesSaved) {
        onNotesSaved();
      }
    } catch (error) {
      console.error("Failed to save notes:", error);
      alert("Failed to save notes. Please try again.");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleMarkAsDelivered = async () => {
    if (markingDelivered || user.mealPlanStatus === "Delivered") return;

    if (!confirm("Mark this meal plan as delivered? This will update the status and send a notification to the client.")) {
      return;
    }

    setMarkingDelivered(true);
    try {
      const userDocRef = doc(db, "users", user.id);
      await updateDoc(userDocRef, {
        mealPlanStatus: "Delivered",
        mealPlanDeliveredAt: serverTimestamp(),
      });

      // Call API to send email notification
      if (user.email) {
        try {
          await fetch("/api/mark-plan-delivered", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              mealPlanUrl: user.mealPlanFileURL,
              name: user.displayName,
              email: user.email,
            }),
          });
        } catch (emailError) {
          console.error("Failed to send delivery email:", emailError);
          // Don't fail the whole operation if email fails
        }
      }

      if (onStatusUpdated) {
        onStatusUpdated();
      }

      alert("Meal plan marked as delivered successfully!");
    } catch (error) {
      console.error("Failed to mark as delivered:", error);
      alert("Failed to mark as delivered. Please try again.");
    } finally {
      setMarkingDelivered(false);
    }
  };

  const handleSendReminderEmail = async () => {
    if (sendingEmail || !user.email) return;

    setSendingEmail(true);
    try {
      const response = await fetch("/api/admin/send-reminder-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          name: user.displayName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reminder email");
      }

      alert("Reminder email sent successfully!");
    } catch (error) {
      console.error("Failed to send reminder email:", error);
      alert("Failed to send reminder email. Please try again.");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleUploadPdf = () => {
    pdfInputRef.current?.click();
  };

  const handleUploadImages = () => {
    imagesInputRef.current?.click();
  };

  const handleOpenClientDashboard = () => {
    if (user.id) {
      window.open(`/dashboard?preview=${user.id}`, "_blank");
    }
  };

  const renderStatus = (status?: UploadStatus | null) => {
    if (!status) return null;

    if (status.status === "uploading")
      return `Uploading ${status.progress}%`;
    if (status.status === "success") return "Upload complete";
    if (status.status === "error")
      return status.errorMessage ?? "Upload failed";
    return null;
  };

  const InfoField = ({ icon, label, value }: { icon: string; label: string; value: string | number | null | undefined }) => (
    <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/5 px-4 py-3">
      <span className="text-xl">{icon}</span>
      <div className="flex-1">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-foreground/50">
          {label}
        </p>
        <p className="mt-1 text-sm font-bold text-foreground">
          {value ?? "—"}
        </p>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl border border-border/70 bg-muted/60 px-6 py-8 shadow-[0_0_60px_-30px_rgba(215,38,61,0.6)] backdrop-blur"
    >
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold uppercase tracking-[0.2em] text-foreground">
            {user.displayName ?? user.email ?? "Unnamed User"}
          </h3>
          <p className="mt-1 text-[0.7rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
            Tier: {user.packageTier ?? "Not assigned"} · Status:{" "}
            {user.mealPlanStatus ?? "Not Started"}
          </p>
        </div>
      </header>

      {/* Client Information Section */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <InfoField icon="👤" label="Name" value={user.displayName ?? "Unnamed User"} />
        <InfoField icon="📧" label="Email" value={user.email ?? "—"} />
        <InfoField icon="📦" label="Package Tier" value={user.packageTier ?? "Not assigned"} />
        <InfoField
          icon="📅"
          label="Days Since Purchase"
          value={daysSincePurchase !== null ? `${daysSincePurchase} days` : "—"}
        />
        <InfoField icon="📋" label="Meal Plan Status" value={user.mealPlanStatus ?? "Not Started"} />
        {daysSinceDelivery !== null && (
          <InfoField
            icon="✅"
            label="Plan Delivered"
            value={`${daysSinceDelivery} days ago`}
          />
        )}
        <InfoField
          icon="💰"
          label="Payment / Purchase Amount"
          value={user.purchaseAmount ? `$${user.purchaseAmount.toFixed(2)}` : "—"}
        />
        <InfoField
          icon="🎁"
          label="Referral Credits"
          value={user.referralCredits ?? 0}
        />
      </div>

      {/* Admin Actions Panel */}
      <div className="mb-6 rounded-3xl border border-border/70 bg-muted/60 px-6 py-6 shadow-[0_0_60px_-30px_rgba(215,38,61,0.6)]">
        <h4 className="mb-4 text-lg font-bold uppercase tracking-[0.2em] text-foreground">
          Admin Actions
        </h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={handleMarkAsDelivered}
            disabled={markingDelivered || user.mealPlanStatus === "Delivered" || !user.packageTier}
            className={`flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] transition ${
              markingDelivered || user.mealPlanStatus === "Delivered" || !user.packageTier
                ? "cursor-not-allowed border-border/40 bg-background/20 text-foreground/40"
                : "border-accent bg-accent text-background hover:bg-transparent hover:text-accent"
            }`}
          >
            {markingDelivered ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                Marking...
              </>
            ) : (
              <>
                <span>✅</span>
                Mark as Delivered
              </>
            )}
          </button>

          <button
            onClick={handleUploadPdf}
            disabled={!user.packageTier}
            className={`flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] transition ${
              !user.packageTier
                ? "cursor-not-allowed border-border/40 bg-background/20 text-foreground/40"
                : "border-border/70 bg-background/40 text-foreground/70 hover:border-accent hover:bg-accent/20 hover:text-accent"
            }`}
          >
            <span>📄</span>
            Upload Meal Plan PDF
          </button>

          <button
            onClick={handleUploadImages}
            disabled={!user.packageTier}
            className={`flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] transition ${
              !user.packageTier
                ? "cursor-not-allowed border-border/40 bg-background/20 text-foreground/40"
                : "border-border/70 bg-background/40 text-foreground/70 hover:border-accent hover:bg-accent/20 hover:text-accent"
            }`}
          >
            <span>🖼️</span>
            Upload Meal Plan Images
          </button>

          <button
            onClick={handleSendReminderEmail}
            disabled={sendingEmail || !user.email}
            className={`flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] transition ${
              sendingEmail || !user.email
                ? "cursor-not-allowed border-border/40 bg-background/20 text-foreground/40"
                : "border-border/70 bg-background/40 text-foreground/70 hover:border-accent hover:bg-accent/20 hover:text-accent"
            }`}
          >
            {sendingEmail ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/70 border-t-transparent"></div>
                Sending...
              </>
            ) : (
              <>
                <span>📧</span>
                Send Reminder Email
              </>
            )}
          </button>

          <button
            onClick={handleOpenClientDashboard}
            disabled={!user.id}
            className={`flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] transition ${
              !user.id
                ? "cursor-not-allowed border-border/40 bg-background/20 text-foreground/40"
                : "border-border/70 bg-background/40 text-foreground/70 hover:border-accent hover:bg-accent/20 hover:text-accent"
            }`}
          >
            <span>👁️</span>
            Open Client Dashboard
          </button>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf"
          onChange={onPdfInputChange}
          className="hidden"
        />
        <input
          ref={imagesInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onImagesInputChange}
          className="hidden"
        />
      </div>

      {/* Internal Notes Section */}
      <div className="mb-6">
        <label className="mb-3 block text-sm font-bold uppercase tracking-[0.2em] text-foreground">
          <span className="mr-2">📝</span>
          Internal Notes
        </label>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          rows={6}
          placeholder="Add internal notes about this client..."
          className="w-full rounded-2xl border border-border/70 bg-background/40 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-foreground/50">
            Only visible to admins
          </p>
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className={`flex items-center gap-2 rounded-full border border-accent bg-accent px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.3em] text-background transition hover:bg-transparent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60 ${
              savingNotes ? "opacity-60" : ""
            }`}
          >
            {savingNotes ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                Saving...
              </>
            ) : (
              "Save Notes"
            )}
          </button>
        </div>
        {notesSavedToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 rounded-2xl border border-accent/40 bg-muted/90 px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.28em] text-accent"
          >
            Notes saved
          </motion.div>
        )}
      </div>

      {profileEntries.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profileEntries.map(([key, value]) => (
            <div
              key={key}
              className="rounded-2xl border border-border/70 bg-background/5 px-4 py-3 text-sm"
            >
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-foreground/50">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </span>
              <span className="mt-1 block font-bold text-foreground">
                {String(value)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <CardUpload
          title="Upload Meal Plan PDF"
          description="Required — replaces existing file."
          onChange={onPdfInputChange}
          accept="application/pdf"
          status={renderStatus(pdfStatus)}
          currentUrl={user.mealPlanFileURL ?? null}
          ctaLabel="Select PDF"
          onDelete={user.mealPlanFileURL ? onDeleteMealPlan : undefined}
        />

        <CardUpload
          title="Upload Supporting Images"
          description="Optional — upload lifestyle shots or plan visuals."
          onChange={onImagesInputChange}
          accept="image/*"
          multiple
          status={renderStatus(imageStatus)}
        />

        <CardUpload
          title="Upload Grocery List"
          description="Optional PDF for the client."
          onChange={onGroceryInputChange}
          accept="application/pdf"
          status={renderStatus(groceryStatus)}
          currentUrl={user.groceryListURL ?? null}
          ctaLabel="Select PDF"
          onDelete={user.groceryListURL ? onDeleteGroceryList : undefined}
        />
      </div>

      {mealPlanImages.length > 0 && (
        <div className="mt-6">
          <h4 className="mb-4 text-lg font-bold uppercase tracking-[0.2em] text-foreground">
            Meal Plan Gallery
          </h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {mealPlanImages.map((url) => (
              <div
                key={url}
                className="group relative overflow-hidden rounded-2xl border border-border/70 bg-background/5"
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={url}
                    alt="Meal plan"
                    className="h-32 w-full object-cover transition-opacity group-hover:opacity-80"
                  />
                </a>
                {onDeleteImage && (
                  <button
                    onClick={() => onDeleteImage(url)}
                    className="absolute right-2 top-2 rounded-full border border-red-500/70 bg-background/90 px-2 py-1 text-lg font-bold text-red-500 transition hover:border-red-500 hover:bg-red-500/10"
                    title="Delete image"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

