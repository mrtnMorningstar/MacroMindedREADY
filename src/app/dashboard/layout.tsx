"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

import { RequireAuth, RequireProfileCompletion } from "@/components/guards";
import { useAppContext } from "@/context/AppContext";
import FullScreenLoader from "@/components/FullScreenLoader";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/plan", label: "Meal Plan" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/referrals", label: "Referrals" },
  { href: "/dashboard/support", label: "Support" },
];

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading } = useAppContext();

  return (
    <RequireAuth>
      {loading || !user ? <FullScreenLoader /> : (
        <RequireProfileCompletion>
              <div className="flex min-h-screen bg-background text-foreground">
        <motion.aside
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="hidden h-[calc(100vh-5rem)] w-60 flex-col border-r border-border/70 bg-muted/40 px-6 py-10 shadow-[0_0_80px_-40px_rgba(215,38,61,0.6)] backdrop-blur lg:fixed lg:left-0 lg:top-20 lg:flex"
        >
          <span className="font-bold uppercase tracking-[0.48em] text-foreground">
            MacroMinded
          </span>
          <p className="mt-2 text-[0.65rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
            Client dashboard
          </p>

          <nav className="mt-10 flex-1 overflow-y-auto pr-1">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full border px-4 py-2 text-left text-[0.65rem] uppercase tracking-[0.3em] transition ${
                    pathname === item.href
                      ? "border-accent/60 bg-accent/20 text-accent"
                      : "border-border/70 text-foreground/70 hover:border-accent hover:text-accent"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </motion.aside>

        <div className="relative isolate flex-1 lg:ml-60">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.1 }}
            className="pointer-events-none absolute inset-0"
          >
            <div className="absolute -top-36 left-1/2 h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-accent/30 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#161616_0%,rgba(0,0,0,0.92)_55%,#000000_95%)]" />
          </motion.div>

          <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-14">
            {children}
          </div>
        </div>
        </RequireProfileCompletion>
        )}
    </RequireAuth>
  );
}
