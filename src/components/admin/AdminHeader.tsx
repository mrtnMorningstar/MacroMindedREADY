"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useAppContext } from "@/context/AppContext";

type AdminHeaderProps = {
  title: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onQuickActions?: () => void;
};

export default function AdminHeader({
  title,
  searchQuery,
  onSearchChange,
  onQuickActions,
}: AdminHeaderProps) {
  const { user } = useAppContext();
  
  const userInitial = useMemo(
    () => user?.displayName?.[0]?.toUpperCase() || "M",
    [user?.displayName]
  );

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex-shrink-0 flex items-center justify-between gap-4 px-6 py-4 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-sm"
    >
      {/* Left: Page Title */}
      <div className="flex items-center gap-3 min-w-0 lg:pl-0 pl-12">
        <h1 className="text-xl font-semibold text-white truncate font-display tracking-wide">
          {title}
        </h1>
      </div>

      {/* Center: Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search clients, recipes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-neutral-900/50 border border-neutral-700 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#D7263D] focus:bg-neutral-900 transition-all duration-200"
          />
        </div>
      </div>

      {/* Right: Quick Actions + User Avatar */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onQuickActions}
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-[#D7263D] hover:bg-[#D7263D]/90 rounded-lg text-sm font-semibold text-white transition-colors duration-200 whitespace-nowrap shadow-[0_0_20px_-10px_rgba(215,38,61,0.5)]"
        >
          <PlusIcon className="h-4 w-4" />
          Quick Actions
        </motion.button>
        
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="w-9 h-9 bg-[#D7263D] rounded-full flex items-center justify-center text-sm font-bold text-white uppercase cursor-pointer hover:bg-[#D7263D]/90 transition-colors duration-200 shadow-[0_0_15px_-5px_rgba(215,38,61,0.6)]"
          title={user?.email || "Admin"}
        >
          {userInitial}
        </motion.div>
      </div>
    </motion.header>
  );
}

