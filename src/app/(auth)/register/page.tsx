"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { FirebaseError } from "firebase/app";

import { auth, db } from "@/lib/firebase";

const heroEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: heroEase },
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDisabled = useMemo(
    () =>
      !name.trim() || !email || !password || !confirmPassword || isSubmitting,
    [name, email, password, confirmPassword, isSubmitting]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/dashboard");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(credential.user, {
        displayName: trimmedName,
      });

      await setDoc(
        doc(db, "users", credential.user.uid),
        {
          email,
          displayName: trimmedName,
          packageTier: null,
          role: "member",
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative isolate min-h-screen bg-background text-foreground">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.1 }}
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -top-32 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-accent/35 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#161616_0%,rgba(0,0,0,0.9)_55%,#000000_95%)]" />
      </motion.div>

      <section className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-6 py-24 text-center sm:py-28">
        <motion.span
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="font-display text-xs uppercase tracking-[0.5em] text-accent/90"
        >
          Join The Program
        </motion.span>
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          transition={{ duration: 0.7, delay: 0.1, ease: heroEase }}
          className="mt-6 max-w-3xl font-display text-4xl uppercase tracking-[0.24em] text-foreground sm:text-5xl"
        >
          Build your plan with real human coaches
        </motion.h1>
        <motion.p
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          transition={{ duration: 0.7, delay: 0.2, ease: heroEase }}
          className="mt-4 max-w-2xl text-xs uppercase tracking-[0.32em] text-foreground/60 sm:text-sm"
        >
          Create your MacroMinded account and get matched with specialists who
          fine-tune every macro split to your goals.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          transition={{ duration: 0.7, delay: 0.35, ease: heroEase }}
          className="relative mt-12 w-full max-w-md overflow-hidden rounded-3xl border border-border/70 bg-muted/60 p-10 text-left shadow-[0_0_90px_-45px_rgba(215,38,61,0.6)] backdrop-blur"
        >
          <div className="pointer-events-none absolute inset-x-0 -top-1/3 h-40 bg-gradient-to-b from-accent/40 via-accent/10 to-transparent blur-3xl" />

          <header className="relative flex flex-col gap-2">
            <h2 className="font-display text-2xl uppercase tracking-[0.32em] text-foreground">
              Create Account
            </h2>
            <p className="text-xs uppercase tracking-[0.28em] text-foreground/60">
              Already training with us?{" "}
              <Link
                href="/login"
                className="text-accent transition hover:text-accent/80"
              >
                Log in here
              </Link>
            </p>
          </header>

          <form
            className="relative mt-10 flex flex-col gap-6"
            onSubmit={handleSubmit}
          >
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.32em] text-foreground/70">
                Full Name<span className="ml-2 text-accent">*</span>
              </span>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm tracking-[0.08em] text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none"
                placeholder="How should we address you?"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.32em] text-foreground/70">
                Email<span className="ml-2 text-accent">*</span>
              </span>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm tracking-[0.08em] text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.32em] text-foreground/70">
                Password<span className="ml-2 text-accent">*</span>
              </span>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm tracking-[0.08em] text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.32em] text-foreground/70">
                Confirm Password<span className="ml-2 text-accent">*</span>
              </span>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm tracking-[0.08em] text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none"
              />
            </label>

            {error ? (
              <p
                className="text-[0.7rem] uppercase tracking-[0.3em] text-accent"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              disabled={isDisabled}
              className={`mt-2 inline-flex items-center justify-center rounded-full border px-6 py-3 text-xs font-semibold uppercase tracking-[0.32em] transition ${
                isDisabled
                  ? "cursor-not-allowed border-border/40 bg-muted/50 text-foreground/40"
                  : "border-accent bg-accent text-background hover:border-foreground hover:bg-transparent hover:text-accent"
              }`}
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
            </motion.button>
          </form>
        </motion.div>
      </section>
    </div>
  );
}


