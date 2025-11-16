"use client";

import { motion } from "framer-motion";
import { useMemo, type ChangeEvent } from "react";
import { CardUpload } from "./CardUpload";

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
}: UserDetailPanelProps) {
  const profileEntries = useMemo(() => {
    if (!user.profile) return [];

    return Object.entries(user.profile).filter(
      ([, value]) => value && String(value).trim() !== ""
    );
  }, [user.profile]);

  const mealPlanImages = user.mealPlanImageURLs ?? [];

  const renderStatus = (status?: UploadStatus | null) => {
    if (!status) return null;

    if (status.status === "uploading")
      return `Uploading ${status.progress}%`;
    if (status.status === "success") return "Upload complete";
    if (status.status === "error")
      return status.errorMessage ?? "Upload failed";
    return null;
  };

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

