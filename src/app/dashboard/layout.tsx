"use client";

import { RequireAuth } from "@/components/guards/RequireAuth";
import { RequireWizard } from "@/components/guards/RequireWizard";
import DashboardShell from "@/components/layouts/DashboardShell";
import { useAuth } from "@/context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loadingAuth, user } = useAuth();
  
  // Only show overlay on very first load (before we have a user)
  const isFirstLoad = loadingAuth && !user;
  
  // CRITICAL: DashboardShell MUST always render - sidebar depends on it
  // Guards only wrap content inside the shell
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
      {/* Guards wrap content only - shell structure always visible */}
      <RequireAuth>
        <RequireWizard>
          {children}
        </RequireWizard>
      </RequireAuth>
    </DashboardShell>
  );
}
