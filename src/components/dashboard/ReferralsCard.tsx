"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LinkIcon, CheckIcon } from "@heroicons/react/24/outline";

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm"
    >
      <h3 className="text-xl font-semibold text-white mb-4">Referrals</h3>

      {referralCode ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-neutral-400 mb-2">
              Your Referral Code
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-3 text-lg font-mono font-bold text-white">
                {referralCode}
              </code>
            </div>
          </div>

          <div>
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm font-semibold text-neutral-200 transition hover:bg-neutral-700"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <CheckIcon className="h-5 w-5 text-[#D7263D]" />
                    <span className="text-[#D7263D]">Copied!</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="link"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <LinkIcon className="h-5 w-5" />
                    <span>Copy Referral Link</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-800/30 p-4">
            <p className="text-xs text-neutral-400 mb-3">
              Every successful referral gives you 1 credit. Credits can be used for plan
              tweaks or discounts.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm uppercase tracking-wide text-neutral-400">
                Your Credits
              </span>
              <span className="rounded-full bg-[#D7263D] px-4 py-2 text-lg font-bold text-white">
                {referralCredits}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-neutral-400">
            Your referral code is being generated...
          </p>
        </div>
      )}
    </motion.div>
  );
}

