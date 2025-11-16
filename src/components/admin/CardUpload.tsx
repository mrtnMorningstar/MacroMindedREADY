"use client";

import { motion } from "framer-motion";
import { type ChangeEvent } from "react";

type UploadStatus = {
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
  errorMessage?: string;
};

type CardUploadProps = {
  title: string;
  description: string;
  accept: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  multiple?: boolean;
  status?: string | null;
  currentUrl?: string | null | undefined;
  ctaLabel?: string;
  onDelete?: () => void;
};

export function CardUpload({
  title,
  description,
  accept,
  onChange,
  multiple,
  status,
  currentUrl,
  ctaLabel = "Select File",
  onDelete,
}: CardUploadProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="rounded-2xl border border-border/70 bg-background/5 px-6 py-5 shadow-[0_0_40px_-20px_rgba(215,38,61,0.4)]"
    >
      <h4 className="text-base font-semibold uppercase tracking-[0.2em] text-foreground">
        {title}
      </h4>
      <p className="mt-2 text-[0.7rem] font-medium uppercase tracking-[0.25em] text-foreground/60">
        {description}
      </p>

      <label className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-full border border-border/70 bg-muted/40 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-foreground/70 transition hover:border-accent hover:bg-accent/20 hover:text-accent">
        {ctaLabel}
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={onChange}
          className="hidden"
        />
      </label>

      {status && (
        <p className="mt-3 text-[0.65rem] font-medium uppercase tracking-[0.25em] text-foreground/60">
          {status}
        </p>
      )}

      {currentUrl && (
        <div className="mt-4 flex items-center gap-3">
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-accent underline transition hover:text-accent/80"
          >
            View current file
          </a>
          {onDelete && (
            <button
              onClick={onDelete}
              className="rounded-full border border-red-500/70 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-red-500/70 transition hover:border-red-500 hover:bg-red-500/10 hover:text-red-500"
              title="Delete file"
            >
              ×
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

