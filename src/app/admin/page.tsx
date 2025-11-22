"use client";

import DashboardSummary from "@/components/admin/DashboardSummary";

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Section */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-white">Overview</h2>
        <p className="text-sm text-neutral-400">
          Key metrics and insights at a glance
        </p>
      </div>

      {/* Dashboard Summary Cards */}
      <DashboardSummary />
    </div>
  );
}
