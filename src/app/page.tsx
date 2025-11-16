"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";

const heroEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const heroTextVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (custom: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: "tween",
      duration: 0.7,
      delay: custom,
      ease: heroEase,
    },
  }),
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (custom: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: 0.4 + custom * 0.1,
      ease: "easeOut",
    },
  }),
};

const features = [
  {
    title: "Custom Meal Plans",
    description: "Tailored to your goals, body, and lifestyle by real human experts.",
    icon: "📋",
  },
  {
    title: "Recipe Library",
    description: "Access to hundreds of recipes designed to fit your macros.",
    icon: "🍽️",
  },
  {
    title: "Dashboard Access",
    description: "Track your progress and manage your nutrition plan in one place.",
    icon: "📊",
  },
  {
    title: "Expert Support",
    description: "Get personalized guidance from certified nutrition coaches.",
    icon: "💬",
  },
];

export default function Home() {
  return (
    <div className="relative isolate overflow-hidden bg-background">
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

      {/* HERO */}
      <section className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col items-center justify-center px-6 py-24 text-center">
        <motion.h1
          initial="hidden"
          animate="visible"
          custom={0.2}
          variants={heroTextVariants}
          className="text-4xl font-bold uppercase tracking-[0.2em] text-foreground sm:text-6xl"
        >
          Your Body. Your Goals. Your Custom Meal Plan.
        </motion.h1>
        <motion.p
          initial="hidden"
          animate="visible"
          custom={0.3}
          variants={heroTextVariants}
          className="mt-6 max-w-3xl text-base uppercase tracking-[0.28em] text-foreground/70 sm:text-lg"
        >
          No AI. No generic templates. Just human expertise tuned to your goals,
          lifestyle, and biology.
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
            Start My Custom Plan
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-accent px-8 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-accent transition hover:bg-accent hover:text-background"
          >
            Preview Dashboard
          </Link>
        </motion.div>
      </section>

      {/* FEATURE CARDS */}
      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={heroTextVariants}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl font-bold uppercase tracking-[0.2em] text-foreground sm:text-4xl">
              Everything You Need
            </h2>
            <p className="mt-4 text-sm uppercase tracking-[0.32em] text-foreground/60">
              A complete nutrition solution built around your unique needs
            </p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={cardVariants}
                custom={index}
                whileHover={{ scale: 1.03, y: -4 }}
                className="rounded-3xl border border-border/70 bg-muted/50 px-6 py-8 text-left shadow-[0_0_60px_-35px_rgba(215,38,61,0.6)] backdrop-blur"
              >
                <div className="mb-4 text-4xl">{feature.icon}</div>
                <h3 className="text-xl font-semibold uppercase tracking-[0.2em] text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm uppercase tracking-[0.28em] text-foreground/60">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={heroTextVariants}
            className="text-3xl font-bold uppercase tracking-[0.2em] text-foreground sm:text-4xl"
          >
            Ready to Transform Your Nutrition?
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={heroTextVariants}
            custom={0.1}
            className="mt-4 text-sm uppercase tracking-[0.3em] text-foreground/60"
          >
            Start your transformation with a meal plan built for your life — not downloaded from a template.
          </motion.p>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={heroTextVariants}
            custom={0.2}
            className="mt-10 flex justify-center"
          >
            <Link
              href="/packages"
              className="rounded-full bg-accent px-10 py-4 text-sm font-semibold uppercase tracking-[0.32em] text-background transition hover:bg-transparent hover:text-accent"
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
