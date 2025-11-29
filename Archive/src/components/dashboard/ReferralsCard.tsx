"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LinkIcon, CheckIcon, GiftIcon } from "@heroicons/react/24/outline";
import DashboardCard from "./DashboardCard";

type ReferralsCardProps = {
  referralCode: string | null;
  referralCredits: number;
};

export default function ReferralsCard({
  referralCode,
  referralCredits,
}: ReferralsCardProps) {
  const [copied, setCopied] = useState(false);

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
    <DashboardCard delay={0.3} className="border-[#D7263D]/30">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-bold text-white font-display">Referrals Summary</h3>
        <GiftIcon className="h-6 w-6 text-[#D7263D]" />
      </div>

      {referralCode ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="referralCode" className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-2 block">
              Your Referral Code
            </label>
            <div className="flex items-center gap-2">
              <input
                id="referralCode"
                name="referralCode"
                type="text"
                readOnly
                value={referralCode}
                className="flex-1 rounded-xl border border-neutral-800 bg-neutral-800/50 px-4 py-2.5 text-sm font-mono text-white"
                aria-label="Referral code"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-2">
              Credits Earned
            </p>
            <p className="text-3xl font-bold text-[#D7263D]">{referralCredits}</p>
            <p className="text-xs text-neutral-400 mt-1">Available for plan revisions</p>
          </div>

          <div>
            <label htmlFor="referralLink" className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-2 block">
              Share Link
            </label>
            <div className="flex items-center gap-2">
              <input
                id="referralLink"
                name="referralLink"
                type="text"
                readOnly
                value={referralLink || ""}
                className="flex-1 rounded-xl border border-neutral-800 bg-neutral-800/50 px-4 py-2.5 text-sm text-white truncate"
                aria-label="Referral link"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopyLink}
                className="rounded-xl border border-[#D7263D] bg-[#D7263D] p-2.5 text-white transition hover:bg-[#D7263D]/90"
                aria-label="Copy referral link"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.div
                      key="check"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <CheckIcon className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="link"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <LinkIcon className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <GiftIcon className="h-12 w-12 text-neutral-600 mx-auto mb-3" />
          <p className="text-sm text-neutral-400">Referral code coming soon</p>
        </div>
      )}
    </DashboardCard>
  );
}
