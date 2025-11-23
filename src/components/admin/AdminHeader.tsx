"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
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
  const pathname = usePathname();

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

      {/* Right: Empty space for balance */}
      <div className="flex items-center gap-3">
        {/* Empty div for layout balance */}
      </div>
    </motion.header>
  );
}
