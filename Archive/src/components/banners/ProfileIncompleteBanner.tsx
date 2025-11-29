"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

type ProfileIncompleteBannerProps = {
  missingFields: string[];
  onComplete: () => void;
};

export default function ProfileIncompleteBanner({
  missingFields,
  onComplete,
}: ProfileIncompleteBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const fieldLabels: Record<string, string> = {
    age: "Age",
    height: "Height",
    weight: "Weight",
    goal: "Goal",
    gender: "Gender",
    activityLevel: "Activity Level",
    allergies: "Allergies",
    preferences: "Preferences",
  };

  const missingLabels = missingFields
    .map((field) => fieldLabels[field] || field)
    .join(", ");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative z-50 mx-auto w-full max-w-5xl px-6 pt-6"
      >
        <div className="rounded-3xl border border-accent/40 bg-accent/10 px-6 py-4 shadow-[0_0_60px_-30px_rgba(215,38,61,0.6)] backdrop-blur">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="mb-1 text-sm font-bold uppercase tracking-[0.28em] text-accent">
                Profile Incomplete
              </h3>
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-foreground/80">
                Finish setting up your profile so your coach can prepare your custom meal plan.
              </p>
              {missingLabels && (
                <p className="mt-2 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-foreground/60">
                  Missing: {missingLabels}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onComplete}
                className="rounded-full border border-accent bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-background transition hover:bg-transparent hover:text-accent"
              >
                Complete Profile
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="rounded-full border border-border/70 p-2 text-foreground/60 transition hover:border-accent hover:text-accent"
                aria-label="Dismiss"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

