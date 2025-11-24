"use client";

import { type ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Bars3Icon } from "@heroicons/react/24/outline";

import { RequireAuth, RequireProfileCompletion } from "@/components/guards";
import { useAppContext } from "@/context/AppContext";
import FullScreenLoader from "@/components/FullScreenLoader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading } = useAppContext();
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

  return (
    <RequireAuth>
      {loading || !user ? (
        <FullScreenLoader />
      ) : (
        <RequireProfileCompletion>
          <div className="flex min-h-screen w-full flex-col bg-black text-white">
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar */}
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

                {/* Content Wrapper */}
                <motion.main
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="flex-1 overflow-y-auto bg-black"
                >
                  <div className="max-w-full px-6 py-8">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {children}
                    </motion.div>
                  </div>
                </motion.main>
              </div>
            </div>
          </div>
        </RequireProfileCompletion>
      )}
    </RequireAuth>
  );
}
