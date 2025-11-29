"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EnvelopeIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { useAppContext } from "@/context";
import {
  LockedDashboardScreen,
} from "@/components/dashboard/client-components";
import { DashboardCardSkeleton } from "@/components/skeletons";
import DashboardCard from "@/components/dashboard/DashboardCard";

const faqs = [
  {
    question: "How do I request a plan update?",
    answer: "Navigate to your Meal Plan page and click 'Request Plan Update'. Describe the changes you need, and your coach will follow up within 24 hours on weekdays.",
  },
  {
    question: "How long does it take to receive my meal plan?",
    answer: "Elite plans: 1 business day. Pro plans: 2-3 business days. Basic plans: 3-5 business days. Your coach will notify you when your plan is ready.",
  },
  {
    question: "Can I use referral credits for plan revisions?",
    answer: "Yes! Each successful referral earns you credits that can be used for plan revisions. Credits are automatically applied when you submit an update request.",
  },
  {
    question: "What if I have an urgent question?",
    answer: "For urgent matters, email support@macrominded.net with 'PRIORITY' in the subject line. Your coach will prioritize your request and respond as quickly as possible.",
  },
  {
    question: "How do I update my macro targets?",
    answer: "Complete the Macro Wizard anytime your goals or biometrics change. This ensures your coach has the latest information to adjust your plan accordingly.",
  },
];

export default function SupportPage() {
  const { loading, error, isUnlocked } = useAppContext();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

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

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <h1 className="text-3xl font-bold text-white font-display tracking-tight">
          Support
        </h1>
        <p className="text-sm text-neutral-400">
          Get help and connect with your coach
        </p>
      </motion.header>

      {/* Contact Information */}
      <div className="grid gap-6 sm:grid-cols-2">
        <DashboardCard delay={0.1}>
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-xl font-bold text-white font-display">Contact Coach</h2>
            <EnvelopeIcon className="h-6 w-6 text-[#D7263D]" />
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-1">
                Email
              </p>
              <a
                href="mailto:support@macrominded.net"
                className="text-[#D7263D] hover:text-[#D7263D]/80 transition-colors font-semibold"
              >
                support@macrominded.net
              </a>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-1">
                Response Time
              </p>
              <p className="text-sm text-neutral-300">24 hours on weekdays</p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard delay={0.2}>
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-xl font-bold text-white font-display">Emergency Contact</h2>
            <ExclamationTriangleIcon className="h-6 w-6 text-[#D7263D]" />
          </div>
          <div className="space-y-4">
            <p className="text-sm text-neutral-300 leading-relaxed">
              For urgent matters, include <span className="font-bold text-[#D7263D]">"PRIORITY"</span> in your email subject line.
            </p>
            <p className="text-xs text-neutral-500">
              Your coach will prioritize and respond as quickly as possible.
            </p>
          </div>
        </DashboardCard>
      </div>

      {/* FAQ Section */}
      <DashboardCard delay={0.3}>
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-xl font-bold text-white font-display">Frequently Asked Questions</h2>
          <ChatBubbleLeftRightIcon className="h-6 w-6 text-[#D7263D]" />
        </div>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl border border-neutral-800 bg-neutral-800/30 overflow-hidden"
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-800/50 transition-colors"
              >
                <span className="text-sm font-semibold text-white pr-4">
                  {faq.question}
                </span>
                {expandedFaq === index ? (
                  <ChevronUpIcon className="h-5 w-5 text-neutral-400 flex-shrink-0" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-neutral-400 flex-shrink-0" />
                )}
              </button>
              <AnimatePresence>
                {expandedFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-neutral-800 bg-neutral-800/20"
                  >
                    <p className="p-4 text-sm text-neutral-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* Quick Actions */}
      <DashboardCard delay={0.4}>
        <h2 className="text-xl font-bold text-white mb-6 font-display">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/macro-wizard"
            className="rounded-xl border border-[#D7263D] bg-[#D7263D]/10 px-6 py-4 text-center transition hover:bg-[#D7263D]/20 hover:border-[#D7263D]/50 group"
          >
            <p className="text-sm font-semibold text-[#D7263D] group-hover:text-[#D7263D]/90">
              Update Macro Wizard
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              Refresh your goals and biometrics
            </p>
          </Link>
          <Link
            href="/dashboard/plan"
            className="rounded-xl border border-neutral-800 bg-neutral-800/30 px-6 py-4 text-center transition hover:bg-neutral-800/50 group"
          >
            <p className="text-sm font-semibold text-white">
              Request Plan Update
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              Submit changes to your meal plan
            </p>
          </Link>
        </div>
      </DashboardCard>
    </div>
  );
}
