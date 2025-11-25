"use client";

import { RequireAuth } from "@/components/guards/RequireAuth";
import { RequireWizard } from "@/components/guards/RequireWizard";
import DashboardShell from "@/components/layouts/DashboardShell";
import { useAppContext } from "@/context/AppContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loadingAuth, loadingUserDoc, user } = useAppContext();
  
  // Only show overlay on very first load (before we have a user)
  const isFirstLoad = loadingAuth && !user;
  
  return (
    <DashboardShell
      loadingOverlay={
        isFirstLoad ? (
          <div className="absolute inset-0 z-[60] grid place-items-center bg-black/70 backdrop-blur-sm">
            <div className="h-8 w-8 border-2 border-[#D7263D] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : null
      }
    >
      {/* Always render children - guards handle their own loading states */}
      <RequireAuth>
        <RequireWizard>{children}</RequireWizard>
      </RequireAuth>
    </DashboardShell>
  );
}
