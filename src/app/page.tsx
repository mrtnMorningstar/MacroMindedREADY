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
    title: "Macro-Perfect Plans",
    description: "Precision nutrition for your cut, bulk, or maintenance goals. Every macro calculated for your body.",
    icon: "💪",
  },
  {
    title: "Recipe Library",
    description: "Hundreds of high-protein, macro-friendly recipes to fuel your training and hit your targets.",
    icon: "🔥",
  },
  {
    title: "Progress Tracking",
    description: "Monitor your gains, track macros, and see real results with our fitness-focused dashboard.",
    icon: "📈",
  },
  {
    title: "Expert Coaching",
    description: "Get guidance from certified nutrition coaches who understand training and performance.",
    icon: "🎯",
  },
];

const workflowSteps = [
  {
    title: "1. Pick Your Speed",
    description: "Choose Basic (5 days), Pro (3 days), or Elite (1 day) delivery. The faster you want results, the faster we deliver.",
  },
  {
    title: "2. Share Your Stats",
    description: "Tell us your weight, body fat, training schedule, goals (cut/bulk/recomp), and dietary preferences.",
  },
  {
    title: "3. Get Your Plan",
    description: "A nutrition expert designs your macro-perfect meal plan. Delivered to your dashboard and email.",
  },
];

const deliverables = [
  "Precise daily macro targets (calories, protein, carbs, fats) for your goals",
  "Complete meal plan: breakfast, lunch, dinner, pre/post-workout, snacks",
  "High-protein recipes optimized for muscle growth and recovery",
  "Macro breakdown for every single meal and snack",
  "Meal prep instructions to save time and stay consistent",
  "Access to Recipe Library with 200+ macro-friendly recipes",
  "Private dashboard to track progress and manage your nutrition",
  "Email delivery of your complete transformation plan",
  "Request plan updates as you progress (cut → bulk, etc.)",
  "Progress tracking: weight, body fat, strength gains, photos",
];

const dashboardFeatures = [
  {
    title: "Meal Plan Hub",
    description: "View your complete macro-perfect meal plan with all meals, macros, and prep instructions.",
  },
  {
    title: "Progress Tracker",
    description: "Log weight, body fat, measurements, and strength gains. See your transformation data.",
  },
  {
    title: "Recipe Library",
    description: "Search 200+ high-protein recipes by macros, meal type, and dietary preferences.",
  },
  {
    title: "Profile & Stats",
    description: "Update your body stats, training schedule, and goals (cut/bulk/recomp) anytime.",
  },
  {
    title: "Plan Modifications",
    description: "Request updates when switching goals (e.g., cut to bulk) or adjusting macros.",
  },
  {
    title: "Referral Rewards",
    description: "Earn rewards when you refer friends. Build your fitness community.",
  },
];

const packages = [
  {
    title: "Basic",
    description: "For those ready to commit. Get your macro-perfect plan in 5 business days.",
    delivery: "5 business days",
    highlight: false,
  },
  {
    title: "Pro",
    description: "Faster delivery, priority support, and maximum personalization. Most popular choice.",
    delivery: "3 business days",
    highlight: true,
  },
  {
    title: "Elite",
    description: "Want results yesterday? Get your plan in 24 hours. For serious athletes.",
    delivery: "1 business day",
    highlight: false,
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
          Fuel Your Gains. Hit Your Macros. Transform Your Body.
        </motion.h1>
        <motion.p
          initial="hidden"
          animate="visible"
          custom={0.3}
          variants={heroTextVariants}
          className="mt-6 max-w-3xl text-base uppercase tracking-[0.28em] text-foreground/70 sm:text-lg"
        >
          No AI bullshit. No cookie-cutter plans. Real nutrition experts crafting meal plans for your cut, bulk, or recomp.
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
            className="rounded-full bg-accent px-8 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-background transition hover:bg-transparent hover:text-accent hover:border hover:border-accent"
          >
            Start My Transformation
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-accent px-8 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-accent transition hover:bg-accent hover:text-background"
          >
            See The Dashboard
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
              Built For Athletes. Designed For Results.
            </h2>
            <p className="mt-4 text-sm uppercase tracking-[0.32em] text-foreground/60">
              Everything you need to fuel your training and hit your physique goals
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

      {/* HOW IT WORKS */}
      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={heroTextVariants}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl font-bold uppercase tracking-[0.2em] text-foreground sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-sm uppercase tracking-[0.32em] text-foreground/60">
              Three steps to your macro-perfect meal plan. No fluff, just results.
            </p>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={cardVariants}
                custom={index}
                whileHover={{ scale: 1.03 }}
                className="rounded-3xl border border-border/70 bg-muted/50 px-6 py-8 text-left shadow-[0_0_60px_-35px_rgba(215,38,61,0.6)] backdrop-blur"
              >
                <h3 className="text-xl font-semibold uppercase tracking-[0.2em] text-foreground">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm uppercase tracking-[0.28em] text-foreground/60">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={heroTextVariants}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl font-bold uppercase tracking-[0.2em] text-foreground sm:text-4xl">
              What's In Your Plan
            </h2>
            <p className="mt-4 text-sm uppercase tracking-[0.32em] text-foreground/60">
              Everything you need to fuel your training and transform your physique
            </p>
          </motion.div>
          <div className="grid gap-4 md:grid-cols-2">
            {deliverables.map((item, index) => (
              <motion.div
                key={item}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={cardVariants}
                custom={index}
                className="rounded-2xl border border-border/70 bg-muted/40 px-6 py-5 text-left text-sm uppercase tracking-[0.25em] text-foreground/70"
              >
                • {item}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DASHBOARD FEATURES */}
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
              Your Command Center
            </h2>
            <p className="mt-4 text-sm uppercase tracking-[0.32em] text-foreground/60">
              Track macros, monitor progress, and manage your nutrition like a pro
            </p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {dashboardFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={cardVariants}
                custom={index}
                whileHover={{ scale: 1.02 }}
                className="rounded-3xl border border-border/70 bg-muted/50 px-6 py-6 text-left shadow-[0_0_60px_-35px_rgba(215,38,61,0.6)] backdrop-blur"
              >
                <h3 className="text-lg font-semibold uppercase tracking-[0.2em] text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm uppercase tracking-[0.28em] text-foreground/60">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PACKAGES */}
      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={heroTextVariants}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl font-bold uppercase tracking-[0.2em] text-foreground sm:text-4xl">
              Pick Your Speed
            </h2>
            <p className="mt-4 text-sm uppercase tracking-[0.32em] text-foreground/60">
              Choose how fast you want to start your transformation
            </p>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-3">
            {packages.map((pkg, index) => (
              <motion.div
                key={pkg.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={cardVariants}
              custom={index}
                whileHover={{ scale: 1.03 }}
                className={`rounded-3xl border px-6 py-8 shadow-[0_0_60px_-35px_rgba(215,38,61,0.6)] backdrop-blur ${
                  pkg.highlight
                    ? "border-accent bg-accent/10"
                    : "border-border/70 bg-muted/50"
                }`}
              >
                <h3
                  className={`text-3xl font-bold uppercase tracking-[0.2em] ${
                    pkg.highlight ? "text-accent" : "text-foreground"
                  }`}
                >
                  {pkg.title}
                </h3>
                <p className="mt-3 text-sm font-semibold uppercase tracking-[0.3em] text-foreground/80">
                  {pkg.delivery}
                </p>
                <p className="mt-3 text-sm uppercase tracking-[0.3em] text-foreground/60">
                  {pkg.description}
                </p>
                <Link
                  href="/packages"
                  className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.32em] transition ${
                    pkg.highlight
                      ? "border border-accent bg-accent text-background hover:bg-transparent hover:text-accent"
                      : "border border-border/70 text-foreground hover:border-accent hover:text-accent"
                  }`}
                >
                  Get Started
                </Link>
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
            Ready to Transform Your Body?
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={heroTextVariants}
            custom={0.1}
            className="mt-4 text-sm uppercase tracking-[0.3em] text-foreground/60"
          >
            Stop guessing your macros. Start hitting your goals. Get your custom meal plan today.
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
              className="rounded-full bg-accent px-10 py-4 text-sm font-semibold uppercase tracking-[0.32em] text-background transition hover:bg-transparent hover:text-accent hover:border hover:border-accent"
            >
              Start My Transformation
            </Link>
        </motion.div>
        </div>
      </section>
    </div>
  );
}
