"use client";

import { type ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  HomeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  GlobeAltIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import AdminSidebar from "./AdminSidebar";

type AdminLayoutProps = {
  children: ReactNode;
};

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/clients": "Clients",
  "/admin/plan-requests": "Plan Requests",
  "/admin/recipes": "Recipes",
  "/admin/sales": "Sales & Revenue",
};

export default function AdminLayoutWrapper({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showQuickActions, setShowQuickActions] = useState(false);

  const pageTitle = pageTitles[pathname] || "Admin Panel";

  return (
    <RequireAuth>
      <RequireAdmin>
        <div className="flex min-h-screen bg-black text-white">
          {/* Sidebar */}
          <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          {/* Main Content */}
          <div className="flex-1 flex flex-col lg:ml-64">
            {/* Top Bar */}
            <header className="sticky top-0 z-30 border-b border-neutral-800 bg-neutral-900">
              <div className="flex items-center justify-between px-6 py-4">
                {/* Left: Menu + Title */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden rounded-lg p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                  >
                    {sidebarOpen ? (
                      <XMarkIcon className="h-6 w-6" />
                    ) : (
                      <Bars3Icon className="h-6 w-6" />
                    )}
                  </button>
                  <h1 className="text-xl font-semibold text-white">{pageTitle}</h1>
                </div>

                {/* Center: Search */}
                <div className="hidden md:flex flex-1 max-w-md mx-8">
                  <div className="relative w-full">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search clients, recipes..."
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-800 bg-neutral-800/50 text-white placeholder:text-neutral-500 focus:border-[#D7263D] focus:outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Right: Quick Actions + Avatar */}
                <div className="flex items-center gap-3">
                  {/* Quick Actions Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowQuickActions(!showQuickActions)}
                      className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-700"
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Quick Actions</span>
                    </button>
                    {showQuickActions && (
                      <div className="absolute right-0 mt-2 w-48 rounded-lg border border-neutral-800 bg-neutral-900 shadow-xl py-2">
                        <Link
                          href="/admin/recipes"
                          onClick={() => setShowQuickActions(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                        >
                          <SparklesIcon className="h-5 w-5" />
                          Create Recipe
                        </Link>
                        <Link
                          href="/recipes"
                          onClick={() => setShowQuickActions(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                        >
                          <GlobeAltIcon className="h-5 w-5" />
                          View Site
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Admin Avatar */}
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#D7263D] flex items-center justify-center text-sm font-semibold text-white">
                      {user?.displayName?.[0]?.toUpperCase() || "A"}
                    </div>
                    <span className="hidden sm:inline text-sm text-neutral-300">
                      {user?.displayName || "Admin"}
                    </span>
                  </div>
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 p-6">
              <div className="mx-auto max-w-7xl space-y-8">{children}</div>
            </main>
          </div>

          {/* Click outside to close quick actions */}
          {showQuickActions && (
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowQuickActions(false)}
            />
          )}
        </div>
      </RequireAdmin>
    </RequireAuth>
  );
}
