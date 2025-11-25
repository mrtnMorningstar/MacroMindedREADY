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
      {loading && (
        <div className="absolute inset-0 z-[9999] grid place-items-center bg-black/60 backdrop-blur-sm">
          <FullScreenLoader />
        </div>
      )}
      <RequireAuth>
        <RequireWizard>{children}</RequireWizard>
      </RequireAuth>
    </DashboardShell>
  );
}
