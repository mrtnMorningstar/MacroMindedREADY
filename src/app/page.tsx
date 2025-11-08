"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const heroTextVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const featureVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: 0.5 + i * 0.1,
      ease: "easeOut",
    },
  }),
};

const features = [
  "Meticulous macro splits engineered for your training block and metabolism.",
  "Weekly one-on-one adjustments from certified nutrition coaches.",
  "Seamless sync with your trackers — MyFitnessPal, Apple Health, and more.",
];

export default function Home() {
  return (
    <div className="relative isolate overflow-hidden bg-background text-foreground">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -top-24 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1a1a1a_0%,rgba(0,0,0,0.85)_55%,#000000_95%)]" />
        <motion.div
          initial={{ opacity: 0, rotate: 15 }}
          animate={{ opacity: 0.5, rotate: 0 }}
          transition={{ duration: 1.8, ease: "easeOut" }}
          className="absolute inset-y-0 left-1/4 w-1/2 bg-gradient-to-b from-transparent via-accent/10 to-transparent blur-3xl"
        />
      </motion.div>

      <section className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col items-center justify-center px-6 py-24 text-center">
        <motion.span
          initial="hidden"
          animate="visible"
          custom={0.1}
          variants={heroTextVariants}
          className="font-display text-xs uppercase tracking-[0.5em] text-accent/90"
        >
          Elite Performance Nutrition
        </motion.span>

        <motion.h1
          initial="hidden"
          animate="visible"
          custom={0.2}
          variants={heroTextVariants}
          className="mt-8 font-display text-4xl uppercase tracking-[0.25em] text-foreground sm:text-6xl"
        >
          Custom Meal Plans Made{" "}
          <span className="text-accent">For Your Body.</span>
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="visible"
          custom={0.3}
          variants={heroTextVariants}
          className="mt-6 max-w-2xl text-sm uppercase tracking-[0.32em] text-foreground/70 sm:text-base"
        >
          No AI. No Templates. Just human expertise dialed into your physique,
          goals, and schedule.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          custom={0.4}
          variants={heroTextVariants}
          className="mt-12 flex flex-col gap-4 sm:flex-row"
        >
          <Link
            href="/packages"
            className="rounded-full bg-accent px-8 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-background transition hover:bg-transparent hover:text-accent"
          >
            Explore Packages
          </Link>
          <Link
            href="/register"
            className="rounded-full border border-foreground/30 px-8 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-foreground transition hover:border-accent hover:text-accent"
          >
            Start Your Plan
          </Link>
        </motion.div>

        <motion.ul
          initial="hidden"
          animate="visible"
          className="mt-16 grid gap-6 text-left sm:grid-cols-3 sm:gap-8"
        >
          {features.map((feature, index) => (
            <motion.li
              key={feature}
              custom={index}
              variants={featureVariants}
              className="rounded-3xl border border-border/70 bg-muted/50 px-6 py-8 text-xs font-semibold uppercase tracking-[0.28em] text-foreground/80 backdrop-blur"
            >
              {feature}
            </motion.li>
          ))}
        </motion.ul>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="mt-20 flex items-center gap-3 text-[0.65rem] uppercase tracking-[0.4em] text-foreground/60"
        >
          <span className="inline-flex h-2 w-2 rounded-full bg-accent" />
          Trusted by competitive athletes, trainers, and transformation teams
        </motion.div>
      </section>
    </div>
  );
}
