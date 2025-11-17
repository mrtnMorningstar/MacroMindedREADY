"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import SuccessConfetti from "@/components/ui/SuccessConfetti";

const heroEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function GlobalSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/macro-wizard");
    }, 1400);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="relative isolate min-h-screen bg-background text-foreground overflow-hidden">
      <SuccessConfetti />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.1 }}
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -top-32 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-accent/35 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#151515_0%,rgba(0,0,0,0.9)_60%,#000000_95%)]" />
      </motion.div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-10 px-6 text-center">
        <motion.span
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: heroEase }}
          className="font-display text-xs uppercase tracking-[0.5em] text-accent/80"
        >
          Payment Received
        </motion.span>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.1,
            type: "spring",
            stiffness: 140,
            damping: 12,
          }}
          className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-5xl font-bold text-background shadow-[0_0_60px_-20px_rgba(215,38,61,0.8)]"
        >
          ✓
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: heroEase, delay: 0.2 }}
          className="max-w-3xl font-display text-4xl uppercase tracking-[0.24em] text-foreground sm:text-5xl"
        >
          Payment Successful 🎉
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: heroEase, delay: 0.3 }}
          className="max-w-2xl text-xs uppercase tracking-[0.3em] text-foreground/60 sm:text-sm"
        >
          Redirecting you to your setup...
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: heroEase, delay: 0.4 }}
          className="flex items-center gap-3"
        >
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70">
            Redirecting...
          </span>
        </motion.div>
      </section>
    </div>
  );
}

