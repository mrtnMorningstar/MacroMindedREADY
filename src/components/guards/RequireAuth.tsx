"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";

type Props = { children: React.ReactNode; redirectTo?: string };

export function RequireAuth({ children, redirectTo = "/login" }: Props) {
  const { user, loadingAuth, loadingUserDoc } = useAppContext();
  const router = useRouter();
  const redirected = useRef(false);
  const hasAuthenticatedOnce = useRef(false);

  // Track if we've successfully authenticated once (user exists)
  useEffect(() => {
    if (user) {
      hasAuthenticatedOnce.current = true;
    }
  }, [user]);

  // Redirect only after loading resolves
  useEffect(() => {
    if (loadingAuth || loadingUserDoc) return;
    if (redirected.current) return;
    if (!user) {
      redirected.current = true;
      router.replace(redirectTo);
    }
  }, [user, loadingAuth, loadingUserDoc, router, redirectTo]);

  // Optimistic rendering: if we've authenticated before, render immediately during navigation
  // Only block on the very first load
  if (hasAuthenticatedOnce.current || user) {
    // User exists or has authenticated before - render children immediately (don't block on navigation)
    return <>{children}</>;
  }

  // First load - show loading or redirect
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
  
  if (!user) return <div />; // during redirect
  return <>{children}</>;
}

