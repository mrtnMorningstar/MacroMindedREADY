"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { getImpersonationFromCookie } from "@/lib/impersonation";
import AdminSidebar from "./AdminSidebar";
import AdminContentWrapper from "./AdminContentWrapper";
import ImpersonationBanner from "./ImpersonationBanner";
import Navbar from "../Navbar";
import { Bars3Icon } from "@heroicons/react/24/outline";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default function AdminLayoutWrapper({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { user } = useAppContext();
  
  // Sidebar state - mobile overlay
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Check if impersonation banner is active
  const [hasImpersonationBanner, setHasImpersonationBanner] = useState(false);

  // Check for impersonation banner on mount and periodically
  useEffect(() => {
    const checkImpersonation = () => {
      const context = getImpersonationFromCookie();
      setHasImpersonationBanner(!!context);
    };
    
    checkImpersonation();
    const interval = setInterval(checkImpersonation, 1000);
    
    return () => clearInterval(interval);
  }, []);

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
    <div className="flex min-h-screen w-full flex-col bg-black text-white">
      <Navbar />
      <ImpersonationBanner />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar - Fixed 256px width */}
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden lg:ml-64">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden fixed left-4 top-32 z-50 p-2 rounded-lg bg-neutral-900/80 backdrop-blur border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Content Wrapper */}
          <AdminContentWrapper>{children}</AdminContentWrapper>
        </div>
      </div>
    </div>
  );
}
