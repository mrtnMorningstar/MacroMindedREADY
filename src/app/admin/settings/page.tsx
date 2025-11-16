"use client";

import { motion } from "framer-motion";
import { AdminSidebar } from "@/components/admin";

export default function AdminSettingsPage() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminSidebar />

      <div className="relative isolate flex-1 lg:ml-64">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1 }}
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute -top-36 left-1/2 h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#161616_0%,rgba(0,0,0,0.92)_55%,#000000_95%)]" />
        </motion.div>

        <div className="relative flex flex-col gap-10 px-6 py-10 sm:py-16 lg:px-10">
          <header className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-muted/60 px-6 py-6 shadow-[0_0_70px_-35px_rgba(215,38,61,0.6)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-bold text-2xl uppercase tracking-[0.32em] text-foreground sm:text-3xl">
                Settings
              </h1>
              <p className="mt-2 text-[0.7rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
                Configure admin preferences and system settings
              </p>
            </div>
          </header>

          <div className="rounded-3xl border border-border/70 bg-muted/60 px-8 py-8 shadow-[0_0_60px_-30px_rgba(215,38,61,0.6)] backdrop-blur">
            <p className="text-center text-sm font-medium uppercase tracking-[0.3em] text-foreground/60">
              Settings page coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

