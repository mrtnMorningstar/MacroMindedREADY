"use client";

import { useEffect, useRef } from "react";
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
 * - If user exists, always renders children (even during brief loading states) to prevent black screen
 */
export function RequireAuth({ children, redirectTo = "/login" }: RequireAuthProps) {
  const { user, loadingAuth, loadingUserDoc } = useAppContext();
  const router = useRouter();
  const redirectingRef = useRef(false);
  const hasUserRef = useRef(!!user);

  // Track if we've ever had a user (for navigation resilience)
  useEffect(() => {
    if (user) {
      hasUserRef.current = true;
    }
  }, [user]);

  useEffect(() => {
    // Only redirect after loading is complete
    if (loadingAuth || loadingUserDoc) return;
    
    // Prevent multiple redirects
    if (redirectingRef.current) return;

    if (!user && hasUserRef.current === false) {
      redirectingRef.current = true;
      router.replace(redirectTo);
    }
  }, [user, loadingAuth, loadingUserDoc, router, redirectTo]);

  // If we have a user, always render children to prevent black screen during navigation
  if (user) {
    return <>{children}</>;
  }

  // If we've had a user before but lost it, show loader (session expired)
  if (hasUserRef.current && !loadingAuth && !loadingUserDoc) {
    return <FullScreenLoader />;
  }

  // Show loader if we're loading or don't have a user
  if (loadingAuth || loadingUserDoc || !user) {
    return <FullScreenLoader />;
  }

  // Default: render children (shouldn't reach here)
  return <>{children}</>;
}

