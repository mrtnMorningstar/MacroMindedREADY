"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context";

export function RequireWizard({ children }: { children: React.ReactNode }) {
  const { user, userDoc, loadingAuth, loadingUserDoc } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRenderedOnce = useRef(false);
  const redirecting = useRef(false);

  const needsWizard = !!user && !!userDoc && userDoc.macroWizardCompleted === false;

  // Track successful render (wizard complete)
  useEffect(() => {
    if (user && userDoc && !needsWizard) {
      hasRenderedOnce.current = true;
    }
  }, [user, userDoc, needsWizard]);

  // Handle wizard redirect
  useEffect(() => {
    if (loadingAuth || loadingUserDoc) return;
    if (!user || !userDoc) return;
    if (needsWizard && !pathname?.startsWith("/macro-wizard") && !redirecting.current) {
      redirecting.current = true;
      router.replace("/macro-wizard");
    }
  }, [loadingAuth, loadingUserDoc, user, userDoc, needsWizard, router, pathname]);

  // CRITICAL: If we've rendered once, NEVER block - always show children during navigation
  if (hasRenderedOnce.current) {
    return <>{children}</>;
  }

  // If wizard is complete, render immediately (optimistic - even if loading)
  if (user && userDoc && !needsWizard) {
    return <>{children}</>;
  }
  
  // If we have user but no userDoc yet, render optimistically (prevents black screen)
  if (user && !userDoc && !loadingAuth) {
    return <>{children}</>;
  }

  // First load - show loading only if we don't have userDoc yet
  if ((loadingAuth || (loadingUserDoc && !userDoc)) && !hasRenderedOnce.current) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-[#D7263D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirecting to wizard - show placeholder to prevent black screen
  if (needsWizard && !pathname?.startsWith("/macro-wizard")) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full bg-neutral-900">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-[#D7263D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-neutral-400">Redirecting...</p>
        </div>
      </div>
    );
  }
  
  // Default: render children optimistically (always show something)
  return <>{children}</>;
}

