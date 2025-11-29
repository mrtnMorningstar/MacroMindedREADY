"use client";

import { motion } from "framer-motion";
import { LockClosedIcon } from "@heroicons/react/24/solid";

type DashboardCardPreviewProps = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
};

/**
 * Reusable preview card component for locked dashboard.
 * Shows a blurred/locked preview of dashboard features.
 */
export function DashboardCardPreview({
  title,
  subtitle,
  icon,
  children,
}: DashboardCardPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-3xl border border-border/70 bg-muted/60 p-6 shadow-[0_0_60px_-35px_rgba(215,38,61,0.3)] backdrop-blur"
    >
      {/* Locked Badge */}
      <div className="absolute right-4 top-4 z-10 rounded-full border border-accent/40 bg-accent/20 px-3 py-1">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-accent">
          Locked
        </p>
      </div>

      {/* Blurred Content */}
      <div className="blur-sm opacity-50 grayscale pointer-events-none select-none">
        {icon && <div className="mb-4 text-accent/50">{icon}</div>}
        <h3 className="text-lg font-bold uppercase tracking-[0.28em] text-foreground">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.25em] text-foreground/60">
            {subtitle}
          </p>
        )}
        {children}
      </div>

      {/* Overlay with Lock Icon */}
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-gradient-to-b from-black/80 via-black/70 to-black/80">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="rounded-full border-2 border-accent/50 bg-accent/10 p-4">
            <LockClosedIcon className="h-8 w-8 text-accent" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/90">
            Unlock with any plan
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

