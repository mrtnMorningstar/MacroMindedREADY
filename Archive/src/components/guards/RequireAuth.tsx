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
    if (!user && !hasAuthenticatedOnce.current) {
      redirected.current = true;
      router.replace(redirectTo);
    }
  }, [user, loadingAuth, loadingUserDoc, router, redirectTo]);

  // CRITICAL: Once authenticated, NEVER block - always render children immediately
  // This ensures navigation never causes black screens
  if (hasAuthenticatedOnce.current || user) {
    return <>{children}</>;
  }

  // First load - show loading only if no user yet
  if (loadingAuth || loadingUserDoc) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full bg-neutral-900">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-[#D7263D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  // No user and not loading - will redirect
  return (
    <div className="flex items-center justify-center min-h-[400px] w-full bg-neutral-900">
      <div className="text-center">
        <div className="h-8 w-8 border-2 border-[#D7263D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-neutral-400">Redirecting...</p>
      </div>
    </div>
  );
}

