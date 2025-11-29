"use client";

import { motion } from "framer-motion";

const heroEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function TermsPage() {
  return (
    <div className="relative isolate min-h-[calc(100vh-5rem)] bg-background text-foreground">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -top-24 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#151515_0%,rgba(0,0,0,0.92)_60%,#000000_95%)]" />
      </motion.div>

      <section className="relative mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-24">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: heroEase }}
          className="font-display text-xs uppercase tracking-[0.48em] text-accent/80"
        >
          Terms of Service
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: heroEase, delay: 0.1 }}
          className="font-display text-4xl uppercase tracking-[0.22em] text-foreground"
        >
          Placeholder Legal Copy
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: heroEase, delay: 0.2 }}
          className="text-xs uppercase tracking-[0.3em] text-foreground/60 sm:text-sm"
        >
          This is placeholder content for the MacroMinded Terms of Service. When
          ready, replace with real policy language outlining user obligations,
          payment terms, and coaching disclaimers.
        </motion.p>
      </section>
    </div>
  );
}

