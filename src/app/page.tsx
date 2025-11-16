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

const workflowSteps = [
  {
    title: "1. Choose a Package",
    description: "Select Basic, Pro, or Elite depending on how fast you want your plan delivered.",
  },
  {
    title: "2. Tell Us About You",
    description: "Share stats, preferences, allergies, goals, and schedule so your plan fits your life.",
  },
  {
    title: "3. Get Your Plan",
    description: "A real human expert designs your meal plan and delivers it to your dashboard + email.",
  },
];

const deliverables = [
  "Daily macro targets (calories, protein, carbs, fats)",
  "Full custom meal plan with breakfast, lunch, dinner, and snacks",
  "Detailed ingredient lists for every meal",
  "Calorie and macro breakdowns per meal",
  "Step-by-step preparation instructions",
  "Access to our Recipe Library with hundreds of recipes",
  "Private dashboard access to view and manage your plan",
  "Email delivery of your complete meal plan",
  "Ability to request plan updates and modifications",
  "Progress tracking tools and reminders",
];

const dashboardFeatures = [
  {
    title: "Meal Plan Overview",
    description: "View your complete custom meal plan with all meals, macros, and ingredients.",
  },
  {
    title: "Progress Tracking",
    description: "Track your nutrition goals and see your progress over time.",
  },
  {
    title: "Recipe Library",
    description: "Browse and search hundreds of recipes that fit your macro targets.",
  },
  {
    title: "Profile Management",
    description: "Update your stats, goals, and preferences anytime.",
  },
  {
    title: "Plan Updates",
    description: "Request modifications to your meal plan as your goals evolve.",
  },
  {
    title: "Referral Program",
    description: "Earn rewards by referring friends to MacroMinded.",
  },
];

const packages = [
  {
    title: "Basic",
    description: "Perfect for beginners wanting a budget-friendly custom plan.",
    delivery: "5 business days",
    highlight: false,
  },
  {
    title: "Pro",
    description: "Faster delivery, more personalization, and priority support.",
    delivery: "3 business days",
    highlight: true,
  },
  {
    title: "Elite",
    description: "The best option for people who want results ASAP.",
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
              Three simple steps to your custom meal plan
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
              What You Get
            </h2>
            <p className="mt-4 text-sm uppercase tracking-[0.32em] text-foreground/60">
              Everything included in your custom meal plan
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
              Your Dashboard
            </h2>
            <p className="mt-4 text-sm uppercase tracking-[0.32em] text-foreground/60">
              Powerful tools to manage your nutrition journey
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
              Choose Your Package
            </h2>
            <p className="mt-4 text-sm uppercase tracking-[0.32em] text-foreground/60">
              Select the delivery speed that works for you
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
                  View Details
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
