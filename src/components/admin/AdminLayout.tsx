"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminSidebar from "./AdminSidebar";

// Icons
import {
  HomeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type AdminLayoutProps = {
  children: React.ReactNode;
};

// Page titles for the top bar
const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/clients": "Clients",
  "/admin/plan-requests": "Plan Requests",
  "/admin/recipes": "Recipes",
  "/admin/sales": "Sales & Revenue",
  "/admin/settings": "Settings",
};

export default function AdminLayoutWrapper({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  // We only need ONE search and ONE quick actions for all admin pages
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageTitle = pageTitles[pathname] || "Admin Panel";

  return (
    <div className="flex h-screen bg-black text-white">

      {/* SIDEBAR */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* MAIN CONTENT */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* TOP BAR — Only one bar for all admin pages */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-neutral-300 hover:text-white"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            <h1 className="text-xl font-semibold">{pageTitle}</h1>
          </div>

          {/* SEARCH BAR */}
          <div className="hidden md:block w-96">
            <input
              type="text"
              placeholder="Search clients, recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm focus:outline-none"
            />
          </div>

          {/* QUICK ACTIONS */}
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm">
              + Quick Actions
            </button>

            {/* USER AVATAR */}
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-sm font-bold uppercase">
              {user?.displayName?.[0] || "M"}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
