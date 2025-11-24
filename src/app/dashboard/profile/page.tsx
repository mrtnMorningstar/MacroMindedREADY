"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { UserCircleIcon, PencilIcon } from "@heroicons/react/24/outline";
import {
  LockedDashboardScreen,
  ProfileSummary,
} from "@/components/dashboard/client-components";
import { useAppContext } from "@/context/AppContext";
import { CTA_BUTTON_CLASSES } from "@/lib/ui";
import ProfileSkeleton from "@/components/skeletons/ProfileSkeleton";
import DashboardCard from "@/components/dashboard/DashboardCard";

export default function ProfilePage() {
  const { data, loading, error, isUnlocked } = useAppContext();

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <DashboardCard>
        <div className="text-center py-8">
          <h3 className="text-xl font-bold text-white mb-2">Error</h3>
          <p className="text-sm text-neutral-400">{error}</p>
        </div>
      </DashboardCard>
    );
  }

  if (!isUnlocked) {
    return <LockedDashboardScreen />;
  }

  const profile = data?.profile ?? {};

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <h1 className="text-3xl font-bold text-white font-display tracking-tight">
          Profile
        </h1>
        <p className="text-sm text-neutral-400">
          Manage your goals and progress metrics
        </p>
      </motion.header>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Profile Info */}
        <DashboardCard delay={0.1}>
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-xl font-bold text-white font-display">Profile Information</h2>
            <UserCircleIcon className="h-6 w-6 text-[#D7263D]" />
          </div>
          
          <ProfileSummary profile={profile} />
        </DashboardCard>

        {/* Goals & Progress */}
        <DashboardCard delay={0.2}>
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-xl font-bold text-white font-display">Goals & Progress</h2>
            <PencilIcon className="h-6 w-6 text-[#D7263D]" />
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-2">
                Current Goal
              </p>
              <p className="text-lg font-bold text-white">
                {profile.goal || "Not set"}
              </p>
            </div>
            
            {/* BMI and Macro Charts placeholder - would integrate Recharts here */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-800/30 p-6 text-center">
              <p className="text-xs text-neutral-500 mb-2">BMI Calculator</p>
              <p className="text-2xl font-bold text-[#D7263D]">
                {profile.bmi ? profile.bmi.toFixed(1) : "—"}
              </p>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Update Wizard CTA */}
      <DashboardCard delay={0.3}>
        <div className="text-center py-6">
          <p className="text-sm text-neutral-400 mb-4">
            Need to refresh your stats? Complete the macro wizard to keep your coaching precise.
          </p>
          <Link
            href="/macro-wizard"
            className="inline-flex items-center gap-2 rounded-xl border border-[#D7263D] bg-[#D7263D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90 hover:shadow-[0_0_20px_-10px_rgba(215,38,61,0.5)]"
          >
            Update Macro Wizard
          </Link>
        </div>
      </DashboardCard>
    </div>
  );
}
