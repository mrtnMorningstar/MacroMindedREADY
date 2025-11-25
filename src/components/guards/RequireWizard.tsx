"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppContext } from "@/context/AppContext";

export function RequireWizard({ children }: { children: React.ReactNode }) {
  const { user, userDoc, loadingAuth, loadingUserDoc } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const hasCheckedWizard = useRef(false);
  const hasRenderedBefore = useRef(false);

  const needsWizard = !!user && !!userDoc && userDoc.macroWizardCompleted === false;

  useEffect(() => {
    if (loadingAuth || loadingUserDoc) return;
    if (!user) return; // handled by RequireAuth higher up
    if (!userDoc) return; // wait for userDoc
    hasCheckedWizard.current = true;
    
    if (needsWizard && !pathname?.startsWith("/macro-wizard")) {
      router.replace("/macro-wizard");
    }
  }, [loadingAuth, loadingUserDoc, user, userDoc, needsWizard, router, pathname]);

  // Track if we've rendered successfully before (for optimistic rendering during navigation)
  useEffect(() => {
    if (user && userDoc && !needsWizard) {
      hasRenderedBefore.current = true;
    }
  }, [user, userDoc, needsWizard]);

  // Optimistic rendering: if we've rendered before or wizard is complete, render immediately
  // Only block on initial load when we're still checking
  if (hasRenderedBefore.current || (user && userDoc && !needsWizard)) {
    // Already checked wizard and it's complete - render children immediately (don't block on navigation)
    return <>{children}</>;
  }

  // First load or still checking - show loading only if truly loading
  if (loadingAuth || (loadingUserDoc && !hasCheckedWizard.current && !hasRenderedBefore.current)) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-[#D7263D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirecting to wizard
  if (needsWizard && !pathname?.startsWith("/macro-wizard")) return <div />;
  
  // All good - render children
  return <>{children}</>;
}

