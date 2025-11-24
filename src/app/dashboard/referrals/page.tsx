"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GiftIcon, LinkIcon, CheckIcon, TrophyIcon, QrCodeIcon } from "@heroicons/react/24/outline";
import {
  LockedDashboardScreen,
  ReferralsCard,
} from "@/components/dashboard/client-components";
import { DashboardCardSkeleton } from "@/components/skeletons";
import { useAppContext } from "@/context/AppContext";
import DashboardCard from "@/components/dashboard/DashboardCard";
import StatCard from "@/components/admin/StatCard";

export default function ReferralsPage() {
  const { data, loading, error, isUnlocked } = useAppContext();
  const [copied, setCopied] = useState(false);

  if (loading) {
    return <DashboardCardSkeleton />;
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

  const referralCode = data?.referralCode ?? null;
  const referralCredits = data?.referralCredits ?? 0;
  const referralLink = referralCode
    ? typeof window !== "undefined"
      ? `${window.location.origin}/register?ref=${referralCode}`
      : `/register?ref=${referralCode}`
    : null;

  const handleCopyLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <h1 className="text-3xl font-bold text-white font-display tracking-tight">
          Referrals
        </h1>
        <p className="text-sm text-neutral-400">
          Share your link and earn credits for plan revisions
        </p>
      </motion.header>

      {/* Summary Stats */}
      <div className="grid gap-6 sm:grid-cols-2">
        <StatCard
          title="Total Referrals"
          value={referralCredits}
          delay={0.1}
          icon={<TrophyIcon className="h-6 w-6" />}
        />
        <StatCard
          title="Credits Earned"
          value={referralCredits}
          isHighlight
          delay={0.2}
          icon={<GiftIcon className="h-6 w-6" />}
          description="Available for plan revisions"
        />
      </div>

      {/* Referral Card */}
      <ReferralsCard
        referralCode={referralCode}
        referralCredits={referralCredits}
      />

      {/* Share Section */}
      {referralCode && referralLink && (
        <DashboardCard delay={0.3}>
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-xl font-bold text-white font-display">Share Your Link</h2>
            <GiftIcon className="h-6 w-6 text-[#D7263D]" />
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="referralLinkPage" className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-2 block">
                Referral Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="referralLinkPage"
                  name="referralLinkPage"
                  type="text"
                  readOnly
                  value={referralLink}
                  className="flex-1 rounded-xl border border-neutral-800 bg-neutral-800/50 px-4 py-3 text-sm text-white"
                  aria-label="Referral link"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopyLink}
                  className="rounded-xl border border-[#D7263D] bg-[#D7263D] px-4 py-3 text-white transition hover:bg-[#D7263D]/90 hover:shadow-[0_0_20px_-10px_rgba(215,38,61,0.5)]"
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2"
                      >
                        <CheckIcon className="h-5 w-5" />
                        <span className="text-sm font-semibold">Copied!</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="link"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2"
                      >
                        <LinkIcon className="h-5 w-5" />
                        <span className="text-sm font-semibold">Copy</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>

            {/* QR Code Placeholder */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-800/30 p-6 text-center">
              <QrCodeIcon className="h-16 w-16 text-neutral-600 mx-auto mb-3" />
              <p className="text-sm text-neutral-400">QR Code coming soon</p>
            </div>
          </div>
        </DashboardCard>
      )}
    </div>
  );
}
