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
  hidden: { y: 20 },
  visible: (custom: number = 0) => ({
    y: 0,
    transition: {
      duration: 0.4,
      delay: custom * 0.05,
      ease: "easeOut",
    },
  }),
};

const audienceTargets = [
  "Beginners",
  "Busy Professionals",
  "Gym-Goers",
  "Athletes",
  "Anyone Tired of AI Plans",
];

const workflowSteps = [
  {
    title: "1. Choose a Package",
    text: "Select Basic, Pro, or Elite depending on how fast you want your plan delivered.",
  },
  {
    title: "2. Tell Us About You",
    text: "Share stats, preferences, allergies, goals, and schedule so your plan fits your life.",
  },
  {
    title: "3. Get Your Plan",
    text: "A real human expert designs your meal plan and delivers it to your dashboard + email.",
  },
];

const deliverables = [
  "Daily macro targets",
  "Full custom meal plan",
  "Ingredient lists",
  "Calorie breakdowns",
  "Preparation steps",
  "Access to Recipe Library",
  "Private dashboard access",
];

const packages = [
  {
    title: "Basic",
    description: "Perfect for beginners wanting a budget-friendly custom plan.",
    bullets: [
      "Delivery: 5 business days",
      "Full customized meal plan",
      "Dashboard access",
      "Recipe Library access",
    ],
    cta: "Choose Basic",
    href: "/packages#basic",
    highlight: false,
  },
  {
    title: "Pro",
    description: "Faster delivery, more personalization, and priority support.",
    bullets: [
      "Delivery: 3 business days",
      "Priority in queue",
      "Dashboard access",
      "Recipe Library access",
    ],
    cta: "Choose Pro",
    href: "/packages#pro",
    highlight: true,
  },
  {
    title: "Elite",
    description: "The best option for people who want results ASAP.",
    bullets: [
      "Delivery: 1 business day",
      "Priority support",
      "All Pro features",
      "Fastest response times",
    ],
    cta: "Choose Elite",
    href: "/packages#elite",
    highlight: false,
  },
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

      {/* HERO */}
      <section className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col items-center justify-center px-6 py-24 text-center text-white">
        <motion.h1
          initial="hidden"
          animate="visible"
          custom={0.2}
          variants={heroTextVariants}
          className="text-4xl font-bold uppercase tracking-[0.2em] sm:text-6xl"
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

      {/* WHO THIS IS FOR */}
      <section className="px-6 py-16 text-center text-white">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold uppercase tracking-[0.2em] sm:text-4xl">
            Built for Anyone Who Wants Results
          </h2>
          <p className="mt-4 text-sm uppercase tracking-[0.32em] text-foreground/60">
            Whether you&apos;re trying to lose fat, build muscle, or maintain your physique —
            your plan is tailored to your reality.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-4 text-sm uppercase tracking-[0.2em] text-foreground/70 sm:grid-cols-5">
          {audienceTargets.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-border/60 bg-muted/70 px-4 py-4 text-sm font-semibold"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl text-center text-white">
          <h2 className="text-3xl font-bold uppercase tracking-[0.2em] sm:text-4xl">
            How It Works
          </h2>
        </div>
        <div className="mx-auto mt-12 grid gap-8 md:grid-cols-3">
          {workflowSteps.map((step) => (
            <div
              key={step.title}
              className="rounded-3xl border border-border/70 bg-muted/80 px-6 py-8 text-left shadow-[0_0_60px_-35px_rgba(215,38,61,0.6)] transition hover:scale-105"
            >
              <h3 className="text-xl font-semibold uppercase tracking-[0.2em]">
                {step.title}
              </h3>
              <p className="mt-3 text-sm uppercase tracking-[0.28em] text-foreground/60">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="px-6 py-16 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold uppercase tracking-[0.2em] sm:text-4xl">
            What You Get
          </h2>
        </div>
        <div className="mx-auto mt-10 grid gap-6 md:grid-cols-2">
          {deliverables.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-border/70 bg-muted/70 px-6 py-5 text-left text-sm uppercase tracking-[0.25em] text-foreground/80"
            >
              • {item}
            </div>
          ))}
        </div>
      </section>

      {/* PACKAGES */}
      <section className="px-6 py-20 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold uppercase tracking-[0.2em] sm:text-4xl">
            Packages
          </h2>
        </div>
        <div className="mx-auto mt-12 grid gap-8 md:grid-cols-3">
          {packages.map((pkg) => (
            <div
              key={pkg.title}
              className={`rounded-3xl border px-6 py-8 shadow-[0_0_60px_-35px_rgba(215,38,61,0.6)] transition hover:scale-105 ${
                pkg.highlight
                  ? "border-accent bg-accent/20"
                  : "border-border/70 bg-muted/80"
              }`}
            >
              <h3
                className={`text-3xl font-bold uppercase tracking-[0.2em] ${
                  pkg.highlight ? "text-accent" : "text-foreground"
                }`}
              >
                {pkg.title}
              </h3>
              <p className="mt-3 text-sm uppercase tracking-[0.3em] text-foreground/60">
                {pkg.description}
              </p>
              <ul className="mt-6 space-y-2 text-sm uppercase tracking-[0.28em] text-foreground/70">
                {pkg.bullets.map((bullet) => (
                  <li key={bullet}>• {bullet}</li>
                ))}
              </ul>
              <Link
                href={pkg.href}
                className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.32em] transition ${
                  pkg.highlight
                    ? "border border-accent bg-accent text-background hover:bg-transparent hover:text-accent"
                    : "border border-border/70 text-foreground hover:border-accent hover:text-accent"
                }`}
              >
                {pkg.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-20 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold uppercase tracking-[0.2em] sm:text-4xl">
            Ready to Transform Your Nutrition?
          </h2>
          <p className="mt-4 text-sm uppercase tracking-[0.3em] text-foreground/60">
            Start your transformation with a meal plan built for your life — not downloaded from a template.
          </p>
          <div className="mt-10 flex justify-center">
            <Link
              href="/packages"
              className="rounded-full bg-accent px-10 py-4 text-sm font-semibold uppercase tracking-[0.32em] text-background transition hover:bg-transparent hover:text-accent"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
