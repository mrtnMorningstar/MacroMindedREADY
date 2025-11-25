"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppContext } from "@/context/AppContext";

export function RequireWizard({ children }: { children: React.ReactNode }) {
  const { user, userDoc, loadingAuth, loadingUserDoc } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();

  const needsWizard = !!user && !!userDoc && userDoc.macroWizardCompleted === false;

  useEffect(() => {
    if (loadingAuth || loadingUserDoc) return;
    if (!user) return; // handled by RequireAuth higher up
    if (needsWizard && !pathname?.startsWith("/macro-wizard")) {
      router.replace("/macro-wizard");
    }
  }, [loadingAuth, loadingUserDoc, user, needsWizard, router, pathname]);

  // During loading, show placeholder to prevent black screen
  if (loadingAuth || loadingUserDoc) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-[#D7263D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }
  if (needsWizard && !pathname?.startsWith("/macro-wizard")) return <div />;
  return <>{children}</>;
}

