"use client";

import { RequireAuth } from "@/components/guards/RequireAuth";
import { RequireWizard } from "@/components/guards/RequireWizard";
import DashboardShell from "@/components/layouts/DashboardShell";
import FullScreenLoader from "@/components/FullScreenLoader";
import { useAppContext } from "@/context/AppContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loadingAuth, loadingUserDoc } = useAppContext();
  const loading = loadingAuth || loadingUserDoc;

  return (
    <DashboardShell>
      {loading ? (
        <div className="absolute inset-0 z-[9999] grid place-items-center bg-black/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full border-2 border-[#D7263D] border-t-transparent animate-spin" />
            <p className="text-sm text-neutral-300">Loading…</p>
          </div>
        </div>
      ) : (
        <RequireAuth>
          <RequireWizard>
            {children}
          </RequireWizard>
        </RequireAuth>
      )}
    </DashboardShell>
  );
}
