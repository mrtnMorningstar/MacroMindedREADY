"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
};

type PlanConfig = Record<PlanTier["name"], PlanTier>;

const planConfig: PlanConfig = {
  Basic: {
    name: "Basic",
    turnaround: "Delivery: 5 Business Days",
    description: "Foundational nutrition support to dial-in your daily macros.",
    benefits: [
      "Personalized macro calculation",
      "1 Meal plan PDF",
    ],
    accent: "from-accent/30 via-accent/15 to-transparent",
    price: "$149",
    originalPrice: "$199",
  },
  Pro: {
    name: "Pro",
    turnaround: "Delivery: 3 Business Days",
    description:
      "Deeper accountability with faster turnaround to stay competition ready.",
    benefits: [
      "Personalized macros",
      "1 Meal Plan PDF",
      "Progress check-in message",
    ],
    accent: "from-accent/50 via-accent/20 to-transparent",
    price: "$249",
    originalPrice: "$329",
  },
  Elite: {
    name: "Elite",
    turnaround: "Delivery: 1 Business Day",
    description:
      "White-glove coaching with advanced planning and weekly adjustments.",
    benefits: [
      "Personalized macros",
      "Detailed, advanced meal plan",
      "Progress check-ins weekly",
    ],
    accent: "from-accent/70 via-accent/35 to-transparent",
    price: "$399",
    originalPrice: "$549",
  },
};

const cards = Object.values(planConfig);

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
          body: JSON.stringify({ plan: tier }),
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

      <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-24 text-center sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-6"
        >
          <span className="font-display text-xs uppercase tracking-[0.5em] text-accent/90">
            Choose Your Edge
          </span>
          <h1 className="max-w-3xl font-display text-4xl uppercase tracking-[0.24em] text-foreground sm:text-5xl">
            Pick the plan that fuels your next transformation
          </h1>
          <p className="max-w-2xl text-xs uppercase tracking-[0.32em] text-foreground/60 sm:text-sm">
            Every tier is crafted by specialists who live performance nutrition.
            Select yours and we&apos;ll get to work immediately.
          </p>
        </motion.div>

        {feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-auto w-full max-w-xl rounded-2xl border border-accent/40 bg-muted/60 px-6 py-4 text-xs font-semibold uppercase tracking-[0.28em] text-accent"
          >
            {feedback}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid gap-6 sm:grid-cols-3"
        >
          {cards.map(({ name, turnaround, benefits, accent, description, price, originalPrice }) => {
            const isSaving = savingTier === name;
            const isCurrentSelection =
              !checkingAuth && currentTier === name;

            return (
              <motion.article
                key={name}
                whileHover={{ y: -12, scale: 1.01 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative overflow-hidden rounded-3xl border border-border/70 bg-muted/60 px-8 py-10 text-left shadow-[0_0_80px_-40px_rgba(215,38,61,0.6)] backdrop-blur"
              >
                <div
                  className={`pointer-events-none absolute inset-x-0 -top-1/3 h-56 bg-gradient-to-b ${accent} opacity-80 blur-3xl`}
                />
                <div className="relative flex flex-col gap-6">
                  <header className="flex flex-col gap-2">
                    <span className="font-display text-sm uppercase tracking-[0.45em] text-accent">
                      {name} Plan
                    </span>
                    <h2 className="text-sm uppercase tracking-[0.32em] text-foreground/70">
                      {turnaround}
                    </h2>
                    <div className="flex items-baseline gap-3">
                      <p className="text-3xl font-semibold tracking-[0.18em] text-foreground">
                        {price}
                        <span className="ml-2 text-xs uppercase tracking-[0.3em] text-foreground/50">
                          per month
                        </span>
                      </p>
                      {originalPrice && (
                        <span className="text-sm uppercase tracking-[0.3em] text-foreground/40 line-through">
                          {originalPrice}
                        </span>
                      )}
                    </div>
                    <span className="text-xs uppercase tracking-[0.3em] text-accent/80">
                      Limited time discount
                    </span>
                  </header>

                  <p className="text-xs uppercase tracking-[0.28em] text-foreground/60">
                    {description}
                  </p>

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
        </motion.div>
      </section>
    </div>
  );
}

