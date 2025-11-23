"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

type SettingsFormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export default function SettingsFormSection({
  title,
  description,
  children,
  className = "",
}: SettingsFormSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl border border-neutral-800 bg-neutral-900 p-6 ${className}`}
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-neutral-400">{description}</p>
        )}
      </div>
      <div className="space-y-6">{children}</div>
    </motion.div>
  );
}

