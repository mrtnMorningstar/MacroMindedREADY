"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

type DashboardCardProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
};

export default function DashboardCard({
  children,
  className = "",
  delay = 0,
  onClick,
}: DashboardCardProps) {
  const Component = onClick ? motion.button : motion.div;
  
  return (
    <Component
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={onClick ? { scale: 1.02, y: -2 } : undefined}
      onClick={onClick}
      className={`rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 shadow-xl ${className} ${
        onClick ? "cursor-pointer transition-all duration-300" : ""
      }`}
    >
      {children}
    </Component>
  );
}

