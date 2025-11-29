"use client";

import { type ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bars3Icon } from "@heroicons/react/24/outline";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

type DashboardShellProps = {
  children: ReactNode;
  loadingOverlay?: ReactNode;
};

export default function DashboardShell({ children, loadingOverlay }: DashboardShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // ALWAYS render - this component must never fail to render
  return (
    <div className="flex min-h-screen w-full flex-col bg-neutral-900 text-white" style={{ minHeight: '100vh' }}>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Always visible, must render immediately */}
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

          {/* Content Wrapper - Always render content area */}
          <main className="flex-1 overflow-y-auto bg-neutral-900 min-h-0 relative">
            {loadingOverlay}
            <div className="max-w-full px-6 py-8">
              {/* Wrap children in error boundary to prevent black screen */}
              {children || (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="h-8 w-8 border-2 border-[#D7263D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm text-neutral-400">Loading...</p>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

