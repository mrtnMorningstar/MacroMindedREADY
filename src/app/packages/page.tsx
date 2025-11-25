"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import PackageRequiredModal from "@/components/modals/PackageRequiredModal";
import { useSearchParams } from "next/navigation";
import PackageListSkeleton from "@/components/skeletons/PackageListSkeleton";
import Link from "next/link";

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
    description: "Perfect for beginners wanting a budget-friendly custom plan.",
    benefits: [
      "Delivery: 5 business days",
      "Full customized meal plan",
      "Dashboard access",
      "Recipe Library access",
    ],
    accent: "from-accent/30 via-accent/15 to-transparent",
    price: "$69",
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
    price: "$99",
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
    price: "$149",
  },
};

const cards = Object.values(planConfig);

function PackagesPageContent() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [savingTier, setSavingTier] = useState<PlanTier["name"] | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<PlanTier["name"] | null>(null);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Check if redirected from dashboard (show modal)
  useEffect(() => {
    if (searchParams.get("redirect") === "dashboard") {
      setShowRedirectModal(true);
    }
  }, [searchParams]);

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

      setSavingTier(tier);

      try {
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
        console.error("Failed to start checkout:", error);
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
    <>
      <PackageRequiredModal
        isOpen={showRedirectModal}
        onClose={() => setShowRedirectModal(false)}
      />
      
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
          className="grid gap-8 sm:grid-cols-3"
        >
          {cards.map(({ name, turnaround, benefits, accent, description, price }, index) => {
            const isSaving = savingTier === name;
            const isCurrentSelection =
              !checkingAuth && currentTier === name;
            const isPopular = name === "Pro";

            return (
              <motion.article
                key={name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`relative flex flex-col overflow-hidden rounded-2xl border ${
                  isPopular
                    ? "border-[#D7263D]/50 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 shadow-[0_0_60px_-20px_rgba(215,38,61,0.8)] ring-2 ring-[#D7263D]/30"
                    : "border-neutral-800/50 bg-gradient-to-br from-neutral-900 to-neutral-950 shadow-xl"
                }`}
              >
                {/* Background gradient accent */}
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b ${accent} opacity-20 blur-3xl`}
                />

                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute right-4 top-4 z-10">
                    <span className="inline-flex items-center rounded-full bg-[#D7263D] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="relative flex flex-col flex-1 p-8">
                  {/* Header Section */}
                  <header className="mb-6 flex flex-col gap-3 border-b border-neutral-800/50 pb-6">
                    <div>
                      <span className="font-display text-xs uppercase tracking-[0.4em] text-neutral-400">
                        {name} Plan
                      </span>
                      <h2 className="mt-2 font-display text-2xl font-bold uppercase tracking-tight text-white">
                        {name}
                      </h2>
                    </div>
                    
                    {/* Price Section */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold tracking-tight text-white">
                        {price}
                      </span>
                    </div>

                    {/* Turnaround */}
                    <p className="text-sm font-medium text-[#D7263D]">
                      {turnaround}
                    </p>
                  </header>

                  {/* Description */}
                  <p className="mb-6 text-sm leading-relaxed text-neutral-400">
                    {description}
                  </p>

                  {/* Benefits List */}
                  <ul className="mb-8 flex flex-1 flex-col gap-4">
                    {benefits.map((benefit) => (
                      <li
                        key={benefit}
                        className="flex items-start gap-3 text-sm text-neutral-300"
                      >
                        <svg
                          className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#D7263D]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="leading-relaxed">{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelect(name)}
                    disabled={isSaving}
                    className={`mt-auto inline-flex items-center justify-center rounded-xl px-6 py-4 text-sm font-bold uppercase tracking-wide transition-all ${
                      isSaving
                        ? "cursor-wait bg-neutral-800 text-neutral-500"
                        : isPopular
                        ? "bg-[#D7263D] text-white shadow-[0_0_30px_-10px_rgba(215,38,61,0.6)] hover:bg-[#D7263D]/90 hover:shadow-[0_0_40px_-10px_rgba(215,38,61,0.8)]"
                        : "border-2 border-neutral-700 bg-transparent text-white hover:border-[#D7263D] hover:bg-[#D7263D]/10"
                    }`}
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="h-4 w-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      "Select Plan"
                    )}
                  </motion.button>

                  {/* Current Selection Badge */}
                  {isCurrentSelection && (
                    <div className="mt-4 text-center">
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#D7263D]/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#D7263D]">
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Currently Selected
                      </span>
                    </div>
                  )}
                </div>
              </motion.article>
            );
          })}
        </motion.div>

        {/* Macro Wizard Link for Users with Package */}
        {currentUser && currentTier && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6"
          >
            <Link
              href="/macro-wizard"
              className="block text-center text-xs font-semibold uppercase tracking-[0.3em] text-accent underline transition hover:text-accent/80"
            >
              Continue your setup →
            </Link>
          </motion.div>
        )}
      </section>
      </div>
    </>
  );
}

export default function PackagesPage() {
  return (
    <Suspense fallback={<PackageListSkeleton />}>
      <PackagesPageContent />
    </Suspense>
  );
}

