"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { CTA_BUTTON_CLASSES } from "@/lib/ui";

const heroEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function PackageSuccess() {
  return (
    <div className="relative isolate min-h-[calc(100vh-5rem)] bg-background text-foreground">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -top-28 left-1/2 h-[580px] w-[580px] -translate-x-1/2 rounded-full bg-accent/35 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#151515_0%,rgba(0,0,0,0.9)_60%,#000_95%)]" />
      </motion.div>

      <section className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-4xl flex-col items-center justify-center gap-10 px-6 text-center">
        <motion.span
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: heroEase }}
          className="font-display text-xs uppercase tracking-[0.5em] text-accent/80"
        >
          Payment Confirmed
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: heroEase, delay: 0.1 }}
          className="max-w-3xl font-display text-4xl uppercase tracking-[0.24em] sm:text-5xl"
        >
          Welcome to MacroMinded Elite Coaching
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: heroEase, delay: 0.2 }}
          className="max-w-2xl text-xs uppercase tracking-[0.3em] text-foreground/60 sm:text-sm"
        >
          Your payment was successful. Our coaching team will email you next
          steps and begin preparing your customized plan. You can review your
          status anytime in the dashboard.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: heroEase, delay: 0.3 }}
          className="flex flex-col gap-4 sm:flex-row"
        >
          <Link
            href="/dashboard"
            className={`${CTA_BUTTON_CLASSES} w-full justify-center sm:w-auto`}
          >
            Go to Dashboard
          </Link>
          <Link
            href="/macro-wizard"
            className={`${CTA_BUTTON_CLASSES} w-full justify-center border-white/50 bg-transparent text-white hover:text-accent sm:w-auto`}
          >
            Complete Macro Intake
          </Link>
        </motion.div>
      </section>
    </div>
  );
}

