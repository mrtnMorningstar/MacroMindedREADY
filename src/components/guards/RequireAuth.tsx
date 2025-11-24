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
 * - Always renders children structure first, then shows loader overlay if needed
 * - This prevents black screen by ensuring layout is visible immediately
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

  // Always render children first to ensure layout structure is visible
  // Then show loader overlay only when truly needed (when no user and still loading)
  const showLoader = !user && (loadingAuth || loadingUserDoc);

  return (
    <>
      {children}
      {showLoader && <FullScreenLoader />}
    </>
  );
}

