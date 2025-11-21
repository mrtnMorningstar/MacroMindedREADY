"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import FullScreenLoader from "../FullScreenLoader";

type RequireAuthProps = {
  children: React.ReactNode;
  redirectTo?: string;
};

/**
 * Protected route wrapper that ensures user is authenticated.
 * - Waits for Firebase Auth and Firestore userDoc to finish loading
 * - Redirects to /login if not authenticated
 * - NEVER returns null - always shows FullScreenLoader during transitions
 */
export function RequireAuth({ children, redirectTo = "/login" }: RequireAuthProps) {
  const { user, loadingAuth, loadingUserDoc } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after loading is complete
    if (loadingAuth || loadingUserDoc) return;

    if (!user) {
      router.replace(redirectTo);
    }
  }, [user, loadingAuth, loadingUserDoc, router, redirectTo]);

  // Show loader while auth or userDoc is loading
  if (loadingAuth || loadingUserDoc) {
    return <FullScreenLoader />;
  }

  // Show loader during redirect (never return null)
  if (!user) {
    return <FullScreenLoader />;
  }

  return <>{children}</>;
}

