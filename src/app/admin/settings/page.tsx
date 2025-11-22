"use client";

import { motion } from "framer-motion";
import EmptyState from "@/components/admin/EmptyState";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";

export default function AdminSettingsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-6"
    >
      <EmptyState
        icon={<Cog6ToothIcon className="h-16 w-16" />}
        title="Settings coming soon"
        description="Admin settings and configuration options will be available here."
      />
    </motion.div>
  );
}
