"use client";

import { useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signOut } from "firebase/auth";
import { useAppContext } from "@/context/AppContext";
import { auth } from "@/lib/firebase";
import SessionExpiredModal from "./modals/SessionExpiredModal";

const publicNavLinks = [
  { href: "/", label: "Home" },
  { href: "/packages", label: "Pricing" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, isUnlocked, loadingAuth, sessionExpired, setSessionExpired } = useAppContext();

  // Hide navbar on admin routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  }, [router]);

  const handleSessionExpiredClose = useCallback(() => {
    setSessionExpired(false);
    router.push("/login");
  }, [router, setSessionExpired]);

  // Determine navigation links based on user state
  const getNavLinks = () => {
    if (!user) {
      return publicNavLinks;
    }
    // If user is logged in, show Dashboard
    return [
      ...publicNavLinks,
      ...(isUnlocked ? [{ href: "/dashboard", label: "Dashboard" }] : []),
    ];
  };

  return (
    <>
      <SessionExpiredModal isOpen={sessionExpired} onClose={handleSessionExpiredClose} />
      
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
            {getNavLinks().map(({ href, label }) => {
              const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href));
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

            {isAdmin && (
              <Link
                href="/admin"
                className={`relative text-xs font-semibold uppercase tracking-[0.32em] transition ${
                  pathname?.startsWith("/admin")
                    ? "text-foreground"
                    : "text-foreground/80 hover:text-foreground"
                }`}
              >
                Admin Panel
                {pathname?.startsWith("/admin") ? (
                  <motion.span
                    layoutId="nav-underline-admin"
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
            {loadingAuth ? (
              <span className="h-8 w-24 animate-pulse rounded-full bg-muted/60" />
            ) : user ? (
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
    </>
  );
}
