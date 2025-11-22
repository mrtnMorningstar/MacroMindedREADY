"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
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
  "/admin/sales": "Revenue",
  "/admin/referrals": "Referrals",
  "/admin/plan-requests": "Plan Requests",
  "/admin/recipes": "Recipes",
  "/admin/manage-admins": "Manage Admins",
  "/admin/settings": "Settings",
};

export default function AdminLayoutWrapper({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { user } = useAppContext();

  // We only need ONE search and ONE quick actions for all admin pages
  const [searchQuery, setSearchQuery] = useState("");
  // Sidebar open by default on desktop (always visible), closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Ensure sidebar is always considered "open" on desktop (it's always visible via CSS)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true); // Desktop: always visible
      }
    };
    
    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pageTitle = useMemo(() => pageTitles[pathname] || "Admin Panel", [pathname]);
  
  // Memoize user initial to prevent re-renders
  const userInitial = useMemo(() => user?.displayName?.[0] || "M", [user?.displayName]);

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* SIDEBAR - Always visible on desktop, toggleable on mobile */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* MAIN CONTENT */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* TOP NAVBAR — Only one bar for all admin pages */}
        <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-neutral-300 hover:text-white"
              aria-label="Open sidebar"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            <h1 className="text-xl font-semibold text-white">{pageTitle}</h1>
          </div>

          {/* SEARCH BAR */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <input
              type="text"
              placeholder="Search clients, recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#D7263D]"
            />
          </div>

          {/* QUICK ACTIONS */}
          <div className="flex items-center gap-4">
            <button className="hidden sm:block px-4 py-2 bg-[#D7263D] hover:bg-[#D7263D]/90 rounded-lg text-sm font-semibold text-white transition">
              + Quick Actions
            </button>

            {/* USER AVATAR */}
            <div className="w-8 h-8 bg-[#D7263D] rounded-full flex items-center justify-center text-sm font-bold text-white uppercase cursor-pointer hover:bg-[#D7263D]/90 transition">
              {userInitial}
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto px-6 py-8 bg-neutral-950">
          {children}
        </main>
      </div>
    </div>
  );
}
