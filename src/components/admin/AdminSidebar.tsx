"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  UsersIcon as UsersIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
} from "@heroicons/react/24/solid";

type NavLink = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconSolid: React.ComponentType<{ className?: string }>;
};

const navLinks: NavLink[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: HomeIcon,
    iconSolid: HomeIconSolid,
  },
  {
    label: "Clients",
    href: "/admin/users",
    icon: UsersIcon,
    iconSolid: UsersIconSolid,
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: ChartBarIcon,
    iconSolid: ChartBarIconSolid,
  },
  {
    label: "Requests",
    href: "/admin/requests",
    icon: ClipboardDocumentListIcon,
    iconSolid: ClipboardDocumentListIconSolid,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Cog6ToothIcon,
    iconSolid: Cog6ToothIconSolid,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      if (mobile) {
        setIsOpen(false); // Auto-collapse on mobile
      }
      // On desktop, sidebar state is controlled by toggle button
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Initialize desktop sidebar as open
  useEffect(() => {
    if (!isMobile) {
      setIsOpen(true);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="fixed left-4 top-24 z-50 rounded-full border border-border/70 bg-muted/60 p-2 text-foreground/70 transition hover:border-accent hover:text-accent lg:hidden"
        aria-label="Toggle sidebar"
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars3Icon className="h-6 w-6" />
        )}
      </button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {(isOpen || !isMobile) && (
          <motion.aside
            initial={isMobile ? { x: -300, opacity: 0 } : { x: 0, opacity: 1 }}
            animate={isMobile ? { x: isOpen ? 0 : -300, opacity: isOpen ? 1 : 0 } : { x: 0, opacity: 1 }}
            exit={isMobile ? { x: -300, opacity: 0 } : { x: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed left-0 top-20 z-40 h-[calc(100vh-5rem)] w-64 flex-col border-r border-border/70 bg-muted/40 px-6 py-10 shadow-[0_0_80px_-40px_rgba(215,38,61,0.6)] backdrop-blur ${
              isMobile ? (isOpen ? "flex" : "hidden") : isOpen ? "hidden lg:flex" : "hidden lg:hidden"
            }`}
          >
            {/* Desktop Toggle Button */}
            {!isMobile && (
              <button
                onClick={toggleSidebar}
                className="mb-6 ml-auto flex items-center justify-center rounded-full border border-border/70 bg-background/40 p-2 text-foreground/70 transition hover:border-accent hover:text-accent"
                aria-label="Toggle sidebar"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
            )}

            {/* Brand */}
            <div className={`${!isOpen && !isMobile ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}>
              <span className="font-bold uppercase tracking-[0.48em] text-foreground">
                MacroMinded
              </span>
              <p className="mt-2 text-[0.65rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
                Admin
              </p>
            </div>

            {/* Navigation */}
            <nav className="mt-10 flex-1 overflow-y-auto pr-1">
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => {
                  const active = isActive(link.href);
                  const Icon = active ? link.iconSolid : link.icon;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => isMobile && setIsOpen(false)}
                      className={`group relative flex items-center gap-3 rounded-lg px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-[0.25em] transition ${
                        active
                          ? "bg-accent/20 text-accent"
                          : "text-foreground/70 hover:bg-background/20 hover:text-foreground"
                      }`}
                    >
                      {/* Active indicator bar */}
                      {active && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-accent"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}

                      {/* Icon */}
                      <Icon
                        className={`h-5 w-5 flex-shrink-0 ${
                          active ? "text-accent" : "text-foreground/60 group-hover:text-foreground"
                        }`}
                      />

                      {/* Label */}
                      <span className={`${!isOpen && !isMobile ? "opacity-0 w-0" : "opacity-100"} transition-all duration-300`}>
                        {link.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

    </>
  );
}
