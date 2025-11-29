"use client";

import { motion } from "framer-motion";

type AdminHeaderProps = {
  title: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
};

export default function AdminHeader({
  title,
}: AdminHeaderProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex-shrink-0 flex items-center justify-between gap-4 px-6 py-4 border-b border-neutral-800/50 bg-gradient-to-r from-neutral-950 via-neutral-950 to-black backdrop-blur-sm shadow-lg"
    >
      {/* Page Title */}
      <div className="flex items-center gap-3 min-w-0 lg:pl-0 pl-12">
        <motion.h1 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-white truncate font-display tracking-tight bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent"
        >
          {title}
        </motion.h1>
      </div>
    </motion.header>
  );
}
