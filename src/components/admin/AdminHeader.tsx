"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MagnifyingGlassIcon, PlusIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useAppContext } from "@/context/AppContext";
import { usePathname } from "next/navigation";

type AdminHeaderProps = {
  title: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
};

export default function AdminHeader({
  title,
  searchQuery,
  onSearchChange,
}: AdminHeaderProps) {
  const { user, signOutAndRedirect } = useAppContext();
  const pathname = usePathname();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setShowQuickActions(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Quick actions based on route
  const getQuickActions = () => {
    if (pathname === "/admin/clients") {
      return [
        { label: "Add Client", href: "#", onClick: () => {} },
      ];
    }
    if (pathname === "/admin/recipes") {
      return [
        { label: "Add Recipe", href: "#", onClick: () => {} },
      ];
    }
    return [
      { label: "New Client", href: "/admin/clients", onClick: () => {} },
      { label: "New Recipe", href: "/admin/recipes", onClick: () => {} },
    ];
  };

  const quickActions = getQuickActions();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex-shrink-0 flex items-center justify-between gap-4 px-6 py-4 border-b border-neutral-800/50 bg-gradient-to-r from-neutral-950 via-neutral-950 to-black backdrop-blur-sm shadow-lg"
    >
      {/* Left: Page Title */}
      <div className="flex items-center gap-3 min-w-0 lg:pl-0 pl-12">
        <motion.h1 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-white truncate font-display tracking-tight bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent"
        >
          {title}
        </motion.h1>
      </div>

      {/* Center: Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 pointer-events-none" />
          <input
            id="adminSearch"
            name="adminSearch"
            type="search"
            placeholder="Search clients, recipes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-900/80 border border-neutral-800 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#D7263D] focus:bg-neutral-900 focus:ring-2 focus:ring-[#D7263D]/20 transition-all duration-200"
            aria-label="Search clients and recipes"
          />
        </div>
      </div>

      {/* Right: Quick Actions + User Avatar */}
      <div className="flex items-center gap-3">
        {/* Quick Actions */}
        <div className="relative" ref={quickActionsRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 hover:border-[#D7263D] hover:shadow-[0_0_20px_-10px_rgba(215,38,61,0.5)] transition-all duration-200 group"
            aria-label="Quick Actions"
          >
            <PlusIcon className="h-5 w-5 text-neutral-400 group-hover:text-[#D7263D] transition-colors" />
            <span className="text-sm font-semibold text-neutral-300 group-hover:text-white">
              Quick Actions
            </span>
          </motion.button>

          <AnimatePresence>
            {showQuickActions && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden z-50 backdrop-blur-sm"
              >
                <div className="py-2">
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        action.onClick();
                        setShowQuickActions(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-neutral-300 hover:bg-gradient-to-r hover:from-[#D7263D]/20 hover:to-transparent hover:text-white transition-all duration-200"
                    >
                      {action.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Avatar */}
        <div className="relative" ref={userMenuRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-neutral-800/50 transition-colors border border-transparent hover:border-neutral-800"
            aria-label="User menu"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="h-9 w-9 rounded-full border-2 border-neutral-800 hover:border-[#D7263D] transition-colors"
              />
            ) : (
              <div className="h-9 w-9 rounded-full border-2 border-neutral-800 bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center hover:border-[#D7263D] transition-colors">
                <UserCircleIcon className="h-6 w-6 text-neutral-400" />
              </div>
            )}
          </motion.button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden z-50 backdrop-blur-sm"
              >
                <div className="py-2">
                  <div className="px-4 py-3 border-b border-neutral-800">
                    <p className="text-sm font-semibold text-white truncate">
                      {user?.displayName || "Admin"}
                    </p>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                      {user?.email || ""}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ x: 4 }}
                    onClick={async () => {
                      setShowUserMenu(false);
                      await signOutAndRedirect();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-neutral-300 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-transparent hover:text-red-400 transition-all duration-200"
                  >
                    Logout
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}
