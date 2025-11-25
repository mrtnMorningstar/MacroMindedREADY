"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  GiftIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  UserCircleIcon as UserCircleIconSolid,
  GiftIcon as GiftIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
} from "@heroicons/react/24/solid";
import { useAppContext } from "@/context/AppContext";

type DashboardSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const navLinks = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: HomeIcon,
    iconSolid: HomeIconSolid,
  },
  {
    label: "Meal Plan",
    href: "/dashboard/plan",
    icon: ClipboardDocumentListIcon,
    iconSolid: ClipboardDocumentListIconSolid,
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: UserCircleIcon,
    iconSolid: UserCircleIconSolid,
  },
  {
    label: "Referrals",
    href: "/dashboard/referrals",
    icon: GiftIcon,
    iconSolid: GiftIconSolid,
  },
  {
    label: "Support",
    href: "/dashboard/support",
    icon: ChatBubbleLeftRightIcon,
    iconSolid: ChatBubbleLeftRightIconSolid,
  },
];

export default function DashboardSidebar({
  isOpen,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { loadingAuth, loadingUserDoc } = useAppContext();
  const loading = loadingAuth || loadingUserDoc;

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
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
            className="fixed inset-0 z-40 bg-neutral-900/80 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar - Always visible */}
      <aside className="hidden lg:flex fixed left-0 top-[80px] z-40 w-64 h-[calc(100vh-80px)] flex-col border-r border-neutral-800/50 bg-gradient-to-b from-neutral-950 to-neutral-900 shadow-2xl" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <div className="flex h-full flex-col overflow-hidden">
          {/* Brand Header */}
          <div className="border-b border-neutral-800/50 px-6 py-6 flex-shrink-0 bg-gradient-to-r from-neutral-900/50 to-transparent">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold uppercase tracking-[0.2em] text-white font-display bg-gradient-to-r from-white via-white to-neutral-400 bg-clip-text text-transparent"
            >
              MacroMinded
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500"
            >
              Client Dashboard
            </motion.p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-6 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
            <div className="space-y-1">
              {loading ? (
                // Skeleton placeholders while loading
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl px-4 py-3"
                    >
                      <div className="h-5 w-5 rounded bg-neutral-800 animate-pulse" />
                      <div className={`h-4 rounded bg-neutral-800 animate-pulse ${i === 1 ? 'w-3/4' : i === 2 ? 'w-2/3' : i === 3 ? 'w-1/2' : i === 4 ? 'w-5/6' : 'w-4/5'}`} />
                    </div>
                  ))}
                </>
              ) : (
                // Actual navigation links
                navLinks.map((link, index) => {
                  const active = isActive(link.href);
                  const Icon = active ? link.iconSolid : link.icon;

                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={link.href}
                        className="group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200"
                      >
                        {/* Active Indicator */}
                        {active && (
                          <motion.div
                            layoutId="activeDashboardIndicator"
                            className="absolute left-0 top-0 h-full w-1.5 rounded-r-full bg-[#D7263D] shadow-[0_0_15px_rgba(215,38,61,0.8)]"
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}

                        {/* Background highlight */}
                        <div
                          className={`absolute inset-0 rounded-xl transition-all duration-200 ${
                            active
                              ? "bg-gradient-to-r from-[#D7263D]/20 via-[#D7263D]/10 to-transparent shadow-[0_0_30px_-15px_rgba(215,38,61,0.6)]"
                              : "bg-transparent group-hover:bg-neutral-800/40"
                          }`}
                        />

                        {/* Icon and Label */}
                        <Icon
                          className={`relative h-5 w-5 flex-shrink-0 transition-all duration-200 ${
                            active
                              ? "text-[#D7263D] drop-shadow-[0_0_8px_rgba(215,38,61,0.6)]"
                              : "text-neutral-400 group-hover:text-white group-hover:scale-110"
                          }`}
                        />
                        <span
                          className={`relative transition-all duration-200 ${
                            active
                              ? "text-[#D7263D] font-bold"
                              : "text-neutral-400 group-hover:text-white"
                          }`}
                        >
                          {link.label}
                        </span>
                      </Link>
                    </motion.div>
                  );
                })
              )}
            </div>
          </nav>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : "-100%",
        }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="lg:hidden fixed left-0 top-[80px] z-50 h-[calc(100vh-80px)] w-64 border-r border-neutral-800 bg-gradient-to-b from-neutral-950 to-neutral-900 shadow-2xl"
      >
        <div className="flex h-full flex-col">
          {/* Mobile Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-5">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-wide text-white font-display">
                MacroMinded
              </h2>
              <p className="mt-1 text-xs uppercase tracking-wide text-neutral-500">
                Client Dashboard
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              aria-label="Close sidebar"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-6">
            <div className="space-y-1">
              {loading ? (
                // Skeleton placeholders while loading
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl px-4 py-3"
                    >
                      <div className="h-5 w-5 rounded bg-neutral-800 animate-pulse" />
                      <div className={`h-4 rounded bg-neutral-800 animate-pulse ${i === 1 ? 'w-3/4' : i === 2 ? 'w-2/3' : i === 3 ? 'w-1/2' : i === 4 ? 'w-5/6' : 'w-4/5'}`} />
                    </div>
                  ))}
                </>
              ) : (
                // Actual navigation links
                navLinks.map((link) => {
                  const active = isActive(link.href);
                  const Icon = active ? link.iconSolid : link.icon;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onClose}
                      className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        active
                          ? "bg-gradient-to-r from-[#D7263D]/20 via-[#D7263D]/10 to-transparent text-[#D7263D]"
                          : "text-neutral-400 hover:bg-neutral-800/40 hover:text-white"
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeDashboardIndicatorMobile"
                          className="absolute left-0 top-0 h-full w-1.5 rounded-r-full bg-[#D7263D]"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                      <Icon className="h-5 w-5" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })
              )}
            </div>
          </nav>
        </div>
      </motion.aside>
    </>
  );
}

