"use client";

import { motion } from "framer-motion";
import DashboardSummary from "@/components/admin/DashboardSummary";
import RecentClients from "@/components/admin/RecentClients";
import RecentActivity from "@/components/admin/RecentActivity";
import PendingTasks from "@/components/admin/PendingTasks";

export default function AdminPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-6"
    >
      {/* Welcome Section */}
      <div className="flex flex-col gap-2">
        <p className="text-sm text-neutral-400">
          Key metrics and insights at a glance
        </p>
      </div>

      {/* Dashboard Summary Cards */}
      <DashboardSummary />

      {/* Pending Tasks - Actionable items */}
      <PendingTasks />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <RecentActivity />

        {/* Recent Clients */}
        <RecentClients />
      </div>
    </motion.div>
  );
}
