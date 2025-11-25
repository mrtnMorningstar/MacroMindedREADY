"use client";

import { type ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bars3Icon } from "@heroicons/react/24/outline";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useAppContext } from "@/context/AppContext";

type DashboardShellProps = {
  children: ReactNode;
};

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loadingAuth, loadingUserDoc } = useAppContext();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Debug logging
  console.log("DashboardShell render", { user: !!user, sidebarVisible: true, loadingAuth, loadingUserDoc });

  return (
    <div className="flex min-h-screen w-full flex-col bg-neutral-900 text-white">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Always visible */}
        <DashboardSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden lg:ml-64">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden fixed left-4 top-24 z-50 p-2 rounded-lg bg-neutral-900/80 backdrop-blur border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Debug Overlay */}
          <div className="fixed bottom-2 right-2 z-[9999] bg-neutral-900/80 text-xs text-white p-2 rounded border border-neutral-800">
            <p>loadingAuth: {String(loadingAuth)}</p>
            <p>loadingUserDoc: {String(loadingUserDoc)}</p>
            <p>hasUser: {String(!!user)}</p>
          </div>

          {/* Content Wrapper */}
          <main className="flex-1 overflow-y-auto bg-neutral-900 min-h-0 relative">
            <div className="max-w-full px-6 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

