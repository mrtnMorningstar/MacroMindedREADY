"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

type PlanTier = {
  name: "Basic" | "Pro" | "Elite";
  turnaround: string;
  benefits: string[];
  accent: string;
  description: string;
  price: string;
  originalPrice?: string;
};

type PlanConfig = Record<PlanTier["name"], PlanTier>;

const planConfig: PlanConfig = {
  Basic: {
    name: "Basic",
    turnaround: "Delivery: 5 Business Days",
    description: "Perfect for beginners wanting a budget-friendly custom plan.",
    benefits: [
      "Delivery: 5 business days",
      "Full customized meal plan",
      "Dashboard access",
      "Recipe Library access",
    ],
    accent: "from-accent/30 via-accent/15 to-transparent",
    price: "$149",
    originalPrice: "$199",
  },
  Pro: {
    name: "Pro",
    turnaround: "Delivery: 3 Business Days",
    description:
      "Faster delivery, more personalization, and priority support.",
    benefits: [
      "Delivery: 3 business days",
      "Priority in queue",
      "Dashboard access",
      "Recipe Library access",
    ],
    accent: "from-accent/50 via-accent/20 to-transparent",
    price: "$249",
    originalPrice: "$329",
  },
  Elite: {
    name: "Elite",
    turnaround: "Delivery: 1 Business Day",
    description: "The best package for people who want results ASAP.",
    benefits: [
      "Delivery: 1 business day",
      "Priority support",
      "All Pro features",
      "Fastest response times",
    ],
    accent: "from-accent/70 via-accent/35 to-transparent",
    price: "$399",
    originalPrice: "$549",
  },
};

const cards = Object.values(planConfig);

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (custom: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: 0.4 + custom * 0.08,
      ease: "easeOut",
    },
  }),
} as const;

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
    text: "Share your stats, preferences, allergies, goals, and schedule so your plan fits your life.",
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

export default function PackagesPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [savingTier, setSavingTier] = useState<PlanTier["name"] | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<PlanTier["name"] | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadPackageTier = async () => {
      if (!currentUser) {
        setCurrentTier(null);
        return;
      }

      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const snapshot = await getDoc(userDocRef);
        if (!snapshot.exists()) {
          if (isMounted) setCurrentTier(null);
          return;
        }

        const tier = snapshot.data()?.packageTier as PlanTier["name"] | undefined;
        if (isMounted) {
          setCurrentTier(tier ?? null);
        }
      } catch (error) {
        console.error("Failed to fetch package selection:", error);
      }
    };

    void loadPackageTier();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const handleSelect = useCallback(
    async (tier: PlanTier["name"]) => {
      setFeedback(null);

      if (!currentUser) {
        router.push("/register");
        return;
      }

      try {
        setSavingTier(tier);
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan: tier,
            userId: currentUser.uid,
            email: currentUser.email ?? "",
          }),
        });

        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(errorData.error ?? "Failed to initiate checkout.");
        }

        const data = (await response.json()) as { url?: string };
        if (!data.url) {
          throw new Error("No checkout URL returned.");
        }

        window.location.href = data.url;
      } catch (error) {
        console.error("Failed to save package selection:", error);
        setFeedback(
          error instanceof Error
            ? error.message
            : "Could not start checkout. Please try again."
        );
        setSavingTier(null);
      }
    },
    [currentUser, router]
  );

  return (
    <div className="relative isolate overflow-hidden bg-background text-foreground">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.1 }}
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute top-1/2 left-1/4 h-[560px] w-[560px] -translate-y-1/2 rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute top-1/3 right-[-120px] h-[420px] w-[420px] rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#101010_0%,#000000_90%)]" />
      </motion.div>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 py-24 sm:py-28">
        {/* HERO */}
        <section className="flex flex-col items-center gap-8 text-center text-white">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-4xl uppercase tracking-[0.24em] sm:text-5xl"
          >
            Your Body. Your Goals. Your Custom Meal Plan.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="max-w-3xl text-xs uppercase tracking-[0.32em] text-foreground/60 sm:text-sm"
          >
            No AI. No generic templates. Just real nutrition crafted by a human expert who understands your goals,
            lifestyle, and biology.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex flex-col gap-4 sm:flex-row"
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleSelect("Pro")}
              className="rounded-full bg-accent px-8 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-background transition hover:bg-transparent hover:text-accent"
            >
              Start My Custom Plan
            </motion.button>
            <Link
              href="/dashboard"
              className="rounded-full border border-accent px-8 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-accent transition hover:bg-accent hover:text-background"
            >
              Preview Dashboard
            </Link>
          </motion.div>
        </section>

        {feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-auto w-full max-w-xl rounded-2xl border border-accent/40 bg-muted/60 px-6 py-4 text-xs font-semibold uppercase tracking-[0.28em] text-accent"
          >
            {feedback}
          </motion.div>
        )}

        {/* WHO THIS IS FOR */}
        <section className="text-center text-white">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={cardVariants}
            className="text-3xl font-bold uppercase tracking-[0.2em] sm:text-4xl"
          >
            Built for Anyone Who Wants Results
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={cardVariants}
            custom={1}
            className="mx-auto mt-4 max-w-3xl text-xs uppercase tracking-[0.32em] text-foreground/60 sm:text-sm"
          >
            Whether you&apos;re trying to lose fat, build muscle, or maintain your physique — your plan is tailored to
            your reality.
          </motion.p>
          <div className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-5">
            {audienceTargets.map((item, index) => (
              <motion.div
                key={item}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                custom={index}
                whileHover={{ scale: 1.03 }}
                className="rounded-2xl border border-border/70 bg-muted/50 px-4 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="text-white">
          <div className="text-center">
            <h2 className="text-3xl font-bold uppercase tracking-[0.2em] sm:text-4xl">How It Works</h2>
          </div>
          <div className="mx-auto mt-12 grid gap-8 md:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={cardVariants}
                custom={index}
                whileHover={{ scale: 1.03 }}
                className="rounded-3xl border border-border/60 bg-muted/50 px-6 py-8 shadow-[0_0_60px_-35px_rgba(215,38,61,0.6)] backdrop-blur"
              >
                <h3 className="text-xl font-semibold uppercase tracking-[0.2em]">{step.title}</h3>
                <p className="mt-3 text-xs uppercase tracking-[0.3em] text-foreground/60">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* WHAT YOU GET */}
        <section className="text-white">
          <div className="text-center">
            <h2 className="text-3xl font-bold uppercase tracking-[0.2em] sm:text-4xl">What You Get</h2>
          </div>
          <div className="mx-auto mt-10 grid gap-6 md:grid-cols-2">
            {deliverables.map((item, index) => (
              <motion.div
                key={item}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={cardVariants}
                custom={index}
                whileHover={{ scale: 1.02 }}
                className="rounded-2xl border border-border/70 bg-muted/40 px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.28em] text-foreground/70"
              >
                • {item}
              </motion.div>
            ))}
          </div>
        </section>

        {/* PACKAGES */}
        <section className="text-white">
          <div className="text-center">
            <h2 className="text-3xl font-bold uppercase tracking-[0.2em] sm:text-4xl">Packages</h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {cards.map(({ name, turnaround, benefits, accent, description, price, originalPrice }, index) => {
              const isSaving = savingTier === name;
              const isCurrentSelection = !checkingAuth && currentTier === name;
              return (
                <motion.article
                  key={name}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={cardVariants}
                  custom={index}
                  whileHover={{ scale: 1.02 }}
                  className="relative overflow-hidden rounded-3xl border border-border/70 bg-muted/60 px-8 py-10 text-left shadow-[0_0_80px_-40px_rgba(215,38,61,0.6)] backdrop-blur"
                >
                  <div className={`pointer-events-none absolute inset-x-0 -top-1/3 h-56 bg-gradient-to-b ${accent} opacity-70 blur-3xl`} />
                  <div className="relative flex flex-col gap-6">
                    <header className="flex flex-col gap-2">
                      <span className="font-display text-sm uppercase tracking-[0.45em] text-accent">{name} Plan</span>
                      <h2 className="text-sm uppercase tracking-[0.32em] text-foreground/70">{turnaround}</h2>
                      <div className="flex items-baseline gap-3">
                        <p className="text-3xl font-semibold tracking-[0.18em] text-foreground">{price}</p>
                        {originalPrice && (
                          <span className="text-sm uppercase tracking-[0.3em] text-foreground/40 line-through">
                            {originalPrice}
                          </span>
                        )}
                      </div>
                    </header>
                    <p className="text-xs uppercase tracking-[0.28em] text-foreground/60">{description}</p>
                    <ul className="flex flex-col gap-3">
                      {benefits.map((benefit) => (
                        <li
                          key={benefit}
                          className="flex items-start gap-3 text-xs uppercase tracking-[0.28em] text-foreground/80"
                        >
                          <span className="mt-[3px] inline-flex h-2 w-2 flex-none rounded-full bg-accent" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelect(name)}
                      disabled={isSaving}
                      className={`mt-4 inline-flex items-center justify-center rounded-full border px-6 py-3 text-xs font-semibold uppercase tracking-[0.32em] transition ${
                        isSaving
                          ? "cursor-wait border-accent/40 bg-accent/40 text-background/70"
                          : "border-accent bg-accent text-background hover:border-foreground hover:bg-transparent hover:text-accent"
                      }`}
                    >
                      {isSaving ? "Saving..." : "Select Plan"}
                    </motion.button>
                    {isCurrentSelection && (
                      <span className="text-[0.6rem] uppercase tracking-[0.4em] text-foreground/50">
                        Currently selected
                      </span>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="text-center text-white">
          <h2 className="text-3xl font-bold uppercase tracking-[0.2em] sm:text-4xl">
            Ready to Transform Your Nutrition?
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-xs uppercase tracking-[0.3em] text-foreground/60 sm:text-sm">
            Start your transformation with a meal plan built for your life — not downloaded from a template.
          </p>
          <div className="mt-10 flex justify-center">
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleSelect("Elite")}
              className="rounded-full bg-accent px-10 py-4 text-sm font-semibold uppercase tracking-[0.32em] text-background transition hover:bg-transparent hover:text-accent"
            >
              Get Started
            </motion.button>
          </div>
        </section>
      </main>
    </div>
  );
}

