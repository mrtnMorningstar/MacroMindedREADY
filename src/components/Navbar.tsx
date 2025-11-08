"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth } from "@/lib/firebase";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/packages", label: "Packages" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(Boolean(user));
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  }, []);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur"
    >
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-display text-2xl uppercase tracking-[0.4em] text-foreground transition hover:text-accent"
        >
          MacroMinded
        </Link>

        <nav className="flex items-center gap-10">
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="relative text-xs font-semibold uppercase tracking-[0.32em] text-foreground/80 transition hover:text-foreground"
              >
                {label}
                {isActive ? (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-2 left-0 h-0.5 w-full bg-accent"
                    transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                  />
                ) : (
                  <span className="pointer-events-none absolute -bottom-2 left-0 h-0.5 w-full bg-transparent" />
                )}
              </Link>
            );
          })}

          {isAuthenticated && (
            <Link
              href="/dashboard"
              className={`relative text-xs font-semibold uppercase tracking-[0.32em] transition ${
                pathname?.startsWith("/dashboard")
                  ? "text-foreground"
                  : "text-foreground/80 hover:text-foreground"
              }`}
            >
              Dashboard
              {pathname?.startsWith("/dashboard") ? (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute -bottom-2 left-0 h-0.5 w-full bg-accent"
                  transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                />
              ) : (
                <span className="pointer-events-none absolute -bottom-2 left-0 h-0.5 w-full bg-transparent" />
              )}
            </Link>
          )}
        </nav>

        <div className="flex items-center">
          {isCheckingAuth ? (
            <span className="h-8 w-24 animate-pulse rounded-full bg-muted/60" />
          ) : isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-border/80 bg-muted/60 px-5 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-foreground transition hover:border-accent hover:bg-accent hover:text-background"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-accent bg-accent px-5 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-background transition hover:bg-transparent hover:text-accent"
            >
              Login/Register
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
}

