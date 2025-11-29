"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function PaymentCancel() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background text-foreground text-center p-6">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl md:text-5xl font-bold uppercase tracking-[0.32em] mb-4 text-foreground"
      >
        Payment Cancelled
      </motion.h1>

      <p className="text-foreground/60 mb-8 text-sm uppercase tracking-[0.25em] max-w-md">
        Your payment was not completed. If this was accidental, you can try again below.
      </p>

      <Link
        href="/packages"
        className="bg-accent hover:bg-accent/90 transition py-3 px-8 rounded-full text-xs font-semibold uppercase tracking-[0.32em] text-background"
      >
        Try Again
      </Link>
    </div>
  );
}

