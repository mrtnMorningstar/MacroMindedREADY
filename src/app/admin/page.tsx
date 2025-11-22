"use client";

import { useAppContext } from "@/context/AppContext";
import AdminLayout from "@/components/admin/AdminLayout";

export default function AdminPage() {
  const { user } = useAppContext();

  return (
    <AdminLayout>
      <div className="relative min-h-screen bg-black text-white p-6">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold uppercase tracking-[0.3em] text-[#D7263D]">
            Admin Dashboard
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">
            {user?.email}
          </p>
        </header>

        {/* Dashboard Content */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-[0_0_60px_-35px_rgba(215,38,61,0.5)] backdrop-blur">
            <h2 className="text-lg font-semibold uppercase tracking-[0.3em] text-white">
              Total Users
            </h2>
            <p className="mt-2 text-sm uppercase tracking-[0.2em] text-neutral-300">
              Loading...
            </p>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-[0_0_60px_-35px_rgba(215,38,61,0.5)] backdrop-blur">
            <h2 className="text-lg font-semibold uppercase tracking-[0.3em] text-white">
              Active Plans
            </h2>
            <p className="mt-2 text-sm uppercase tracking-[0.2em] text-neutral-300">
              Loading...
            </p>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-[0_0_60px_-35px_rgba(215,38,61,0.5)] backdrop-blur">
            <h2 className="text-lg font-semibold uppercase tracking-[0.3em] text-white">
              Pending Requests
            </h2>
            <p className="mt-2 text-sm uppercase tracking-[0.2em] text-neutral-300">
              Loading...
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
