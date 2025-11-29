"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChartBarIcon,
  DocumentTextIcon,
  BeakerIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import { DashboardCardPreview } from "./DashboardCardPreview";

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Locked Dashboard Preview Component
 * Shows a premium locked dashboard preview when user hasn't purchased a package.
 */
export default function LockedDashboard() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex flex-col gap-8"
    >
      {/* Header */}
      <motion.header
        variants={itemVariants}
        className="flex flex-col gap-4 text-center sm:text-left"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.45em] text-foreground/70">
            Dashboard Preview
          </p>
          <h1 className="mt-2 text-3xl font-bold uppercase tracking-[0.22em] text-foreground sm:text-4xl">
            Your Dashboard Is Locked
          </h1>
          <p className="mt-3 text-sm font-medium uppercase tracking-[0.3em] text-foreground/60 sm:text-base">
            Purchase a plan to unlock your personalized meal plan, progress tracking,
            recipes, and more.
          </p>
        </div>
      </motion.header>

      {/* Preview Cards Grid */}
      <motion.div
        variants={itemVariants}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2"
      >
        {/* Meal Plan Status Card Preview */}
        <DashboardCardPreview
          title="Meal Plan Status"
          subtitle="Track your custom meal plan delivery"
          icon={<DocumentTextIcon className="h-8 w-8" />}
        >
          <div className="mt-4 space-y-2">
            <div className="h-4 w-3/4 rounded bg-foreground/20"></div>
            <div className="h-4 w-1/2 rounded bg-foreground/20"></div>
            <div className="mt-4 h-8 w-full rounded border border-border/50"></div>
          </div>
        </DashboardCardPreview>

        {/* Macro Targets Card Preview */}
        <DashboardCardPreview
          title="Macro Targets"
          subtitle="Your personalized nutrition goals"
          icon={<BeakerIcon className="h-8 w-8" />}
        >
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border/50 bg-muted/40 p-3">
              <div className="h-3 w-16 rounded bg-foreground/20"></div>
              <div className="mt-2 h-6 w-20 rounded bg-foreground/20"></div>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/40 p-3">
              <div className="h-3 w-16 rounded bg-foreground/20"></div>
              <div className="mt-2 h-6 w-20 rounded bg-foreground/20"></div>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/40 p-3">
              <div className="h-3 w-16 rounded bg-foreground/20"></div>
              <div className="mt-2 h-6 w-20 rounded bg-foreground/20"></div>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/40 p-3">
              <div className="h-3 w-16 rounded bg-foreground/20"></div>
              <div className="mt-2 h-6 w-20 rounded bg-foreground/20"></div>
            </div>
          </div>
        </DashboardCardPreview>

        {/* Progress Chart Preview */}
        <DashboardCardPreview
          title="Progress Tracker"
          subtitle="Visualize your journey"
          icon={<ChartBarIcon className="h-8 w-8" />}
        >
          <div className="mt-4 space-y-3">
            <div className="flex items-end gap-2">
              <div className="h-12 w-full rounded-t bg-foreground/20"></div>
              <div className="h-20 w-full rounded-t bg-foreground/20"></div>
              <div className="h-16 w-full rounded-t bg-foreground/20"></div>
              <div className="h-24 w-full rounded-t bg-foreground/20"></div>
              <div className="h-18 w-full rounded-t bg-foreground/20"></div>
            </div>
            <div className="h-3 w-full rounded bg-foreground/10"></div>
          </div>
        </DashboardCardPreview>

        {/* Recipe Library Preview */}
        <DashboardCardPreview
          title="Recipe Library"
          subtitle="Access exclusive meal recipes"
          icon={<BookOpenIcon className="h-8 w-8" />}
        >
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-lg border border-border/50 bg-muted/40"
              ></div>
            ))}
          </div>
        </DashboardCardPreview>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col items-center gap-6 rounded-3xl border border-accent/40 bg-gradient-to-br from-muted/60 to-muted/40 px-8 py-12 text-center shadow-[0_0_80px_-30px_rgba(215,38,61,0.6)] backdrop-blur"
      >
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold uppercase tracking-[0.28em] text-foreground">
            Unlock All Features
          </h2>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-foreground/60">
            Choose a plan that fits your goals
          </p>
        </div>

        <Link
          href="/packages"
          className="group relative overflow-hidden rounded-full border-2 border-accent bg-accent px-8 py-4 text-sm font-bold uppercase tracking-[0.32em] text-background transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(215,38,61,0.8)]"
        >
          <span className="relative z-10">Choose Your Plan</span>
        </Link>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-6 text-xs font-medium uppercase tracking-[0.25em] text-foreground/50">
          <span>✓ Custom Meal Plans</span>
          <span>✓ Progress Tracking</span>
          <span>✓ Recipe Library</span>
          <span>✓ Coach Support</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

