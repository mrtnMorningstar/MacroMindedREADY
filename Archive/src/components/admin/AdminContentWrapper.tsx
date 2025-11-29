"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

type AdminContentWrapperProps = {
  children: ReactNode;
  className?: string;
};

export default function AdminContentWrapper({
  children,
  className = "",
}: AdminContentWrapperProps) {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`flex-1 overflow-y-auto bg-black ${className}`}
    >
      <div className="max-w-full px-6 py-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </div>
    </motion.main>
  );
}
