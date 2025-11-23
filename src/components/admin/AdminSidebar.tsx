"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  HomeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  GiftIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  UsersIcon as UsersIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  SparklesIcon as SparklesIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  ShieldCheckIcon as ShieldCheckIconSolid,
  GiftIcon as GiftIconSolid,
} from "@heroicons/react/24/solid";

type AdminSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onMenuClick?: () => void;
};

const navLinks = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: HomeIcon,
    iconSolid: HomeIconSolid,
  },
  {
    label: "Clients",
    href: "/admin/clients",
    icon: UsersIcon,
    iconSolid: UsersIconSolid,
  },
  {
    label: "Revenue",
    href: "/admin/sales",
    icon: ChartBarIcon,
    iconSolid: ChartBarIconSolid,
  },
  {
    label: "Referrals",
    href: "/admin/referrals",
    icon: GiftIcon,
    iconSolid: GiftIconSolid,
  },
  {
    label: "Plan Requests",
    href: "/admin/plan-requests",
    icon: ClipboardDocumentListIcon,
    iconSolid: ClipboardDocumentListIconSolid,
  },
  {
    label: "Recipes",
    href: "/admin/recipes",
    icon: SparklesIcon,
    iconSolid: SparklesIconSolid,
  },
];

const settingsLinks = [
  {
    label: "Manage Admins",
    href: "/admin/manage-admins",
    icon: ShieldCheckIcon,
    iconSolid: ShieldCheckIconSolid,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Cog6ToothIcon,
    iconSolid: Cog6ToothIconSolid,
  },
];

export default function AdminSidebar({
  isOpen,
  onClose,
  onMenuClick,
}: AdminSidebarProps) {
  const pathname = usePathname();
  
  // Check if impersonation banner is active (for desktop positioning)
  const [hasImpersonationBanner, setHasImpersonationBanner] = useState(false);
  
  useEffect(() => {
    // Import dynamically to avoid SSR issues
    let interval: NodeJS.Timeout | null = null;
    
    import("@/lib/impersonation").then(({ getImpersonationFromCookie }) => {
      const checkImpersonation = () => {
        const context = getImpersonationFromCookie();
        setHasImpersonationBanner(!!context);
      };
      
      checkImpersonation();
      interval = setInterval(checkImpersonation, 1000);
    });
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Calculate top offset: Navbar (80px) + ImpersonationBanner (48px if active)
  const topOffset = hasImpersonationBanner ? 128 : 80;

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar - Fixed 256px width */}
      <aside className={`hidden lg:flex fixed left-0 top-0 z-40 w-64 h-screen flex-col border-r border-neutral-800 bg-neutral-950 ${
        hasImpersonationBanner 
          ? `pt-[48px]` 
          : `pt-0`
      }`}>
        <div className="flex h-full flex-col overflow-hidden">
          {/* Brand Header */}
          <div className="border-b border-neutral-800 px-6 py-6 flex-shrink-0">
            <h2 className="text-xl font-bold uppercase tracking-[0.15em] text-white font-display">
              MacroMinded
            </h2>
            <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Admin Panel
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
            <div className="space-y-1">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                const Icon = active ? link.iconSolid : link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200"
                  >
                    {/* Active Indicator - Red accent bar */}
                    {active && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-[#D7263D] shadow-[0_0_10px_rgba(215,38,61,0.6)]"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}

                    {/* Background highlight */}
                    <div
                      className={`absolute inset-0 rounded-lg transition-all duration-200 ${
                        active
                          ? "bg-[#D7263D]/20 shadow-[0_0_20px_-10px_rgba(215,38,61,0.4)]"
                          : "bg-transparent group-hover:bg-neutral-800/50"
                      }`}
                    />

                    {/* Icon and Label */}
                    <Icon
                      className={`relative h-5 w-5 flex-shrink-0 transition-colors duration-200 ${
                        active ? "text-[#D7263D]" : "text-neutral-400 group-hover:text-white"
                      }`}
                    />
                    <span
                      className={`relative transition-colors duration-200 ${
                        active
                          ? "text-[#D7263D] font-semibold"
                          : "text-neutral-400 group-hover:text-white"
                      }`}
                    >
                      {link.label}
                    </span>

                    {/* Tooltip on hover (desktop only) */}
                    {!active && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                        {link.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Settings Section */}
            <div className="mt-8 pt-8 border-t border-neutral-800">
              <p className="px-4 mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Settings
              </p>
              <div className="space-y-1">
                {settingsLinks.map((link) => {
                  const active = isActive(link.href);
                  const Icon = active ? link.iconSolid : link.icon;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200"
                    >
                      {/* Active Indicator */}
                      {active && (
                        <motion.div
                          layoutId="activeIndicatorSettings"
                          className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-[#D7263D] shadow-[0_0_10px_rgba(215,38,61,0.6)]"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}

                      {/* Background highlight */}
                      <div
                        className={`absolute inset-0 rounded-lg transition-all duration-200 ${
                          active
                            ? "bg-[#D7263D]/20 shadow-[0_0_20px_-10px_rgba(215,38,61,0.4)]"
                            : "bg-transparent group-hover:bg-neutral-800/50"
                        }`}
                      />

                      {/* Icon and Label */}
                      <Icon
                        className={`relative h-5 w-5 flex-shrink-0 transition-colors duration-200 ${
                          active ? "text-[#D7263D]" : "text-neutral-400 group-hover:text-white"
                        }`}
                      />
                      <span
                        className={`relative transition-colors duration-200 ${
                          active
                            ? "text-[#D7263D] font-semibold"
                            : "text-neutral-400 group-hover:text-white"
                        }`}
                      >
                        {link.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>
      </aside>

      {/* Mobile Sidebar - Slide in/out */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : "-100%",
        }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="lg:hidden fixed left-0 top-0 z-50 h-full w-64 border-r border-neutral-800 bg-neutral-900"
      >
        <div className="flex h-full flex-col">
          {/* Mobile Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
            <div>
              <h2 className="text-lg font-bold uppercase tracking-wide text-white font-display">
                MacroMinded
              </h2>
              <p className="mt-1 text-xs uppercase tracking-wide text-neutral-500">
                Admin Panel
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              aria-label="Close sidebar"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-1">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                const Icon = active ? link.iconSolid : link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
                    className={`group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      active
                        ? "bg-[#D7263D]/20 text-[#D7263D]"
                        : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeIndicatorMobile"
                        className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-[#D7263D]"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    <Icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Settings Section */}
            <div className="mt-8 pt-8 border-t border-neutral-800">
              <p className="px-4 mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Settings
              </p>
              <div className="space-y-1">
                {settingsLinks.map((link) => {
                  const active = isActive(link.href);
                  const Icon = active ? link.iconSolid : link.icon;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onClose}
                      className={`group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        active
                          ? "bg-[#D7263D]/20 text-[#D7263D]"
                          : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeIndicatorSettingsMobile"
                          className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-[#D7263D]"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                      <Icon className="h-5 w-5" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>
      </motion.aside>
    </>
  );
}
