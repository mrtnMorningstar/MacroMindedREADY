"use client";

import { motion } from "framer-motion";
import SuccessConfetti from "@/components/ui/SuccessConfetti";
import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background text-foreground p-6 text-center">
      <SuccessConfetti />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.1,
            type: "spring",
            stiffness: 140,
          }}
          className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-5xl font-bold text-background"
        >
          ✓
        </motion.div>

        <h1 className="text-3xl md:text-5xl font-extrabold uppercase tracking-[0.32em] text-foreground">
          Payment Successful!
        </h1>

        <p className="text-foreground/60 max-w-md text-sm uppercase tracking-[0.25em]">
          Your purchase has been confirmed. Your custom meal plan will be prepared and delivered based on the package you selected.
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Link
            href="/dashboard"
            className="mt-4 inline-block bg-accent hover:bg-accent/90 transition py-3 px-8 rounded-full text-xs font-semibold uppercase tracking-[0.32em] text-background"
          >
            Go to Dashboard
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

