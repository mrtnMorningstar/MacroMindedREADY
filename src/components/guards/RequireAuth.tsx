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
 * - Waits for Firebase Auth and Firestore userDoc to finish loading before rendering
 * - Shows FullScreenLoader immediately on first load to prevent black screen
 * - Redirects to /login if not authenticated after loading completes
 * - Renders children only when a valid user is loaded
 */
export function RequireAuth({ children, redirectTo = "/login" }: RequireAuthProps) {
  const { user, loadingAuth, loadingUserDoc } = useAppContext();
  const router = useRouter();
  const redirectingRef = useRef(false);

  useEffect(() => {
    // Only redirect after loading is complete
    if (loadingAuth || loadingUserDoc) return;
    
    // Prevent multiple redirects
    if (redirectingRef.current) return;

    if (!user) {
      redirectingRef.current = true;
      router.replace(redirectTo);
    }
  }, [user, loadingAuth, loadingUserDoc, router, redirectTo]);

  // Show loader immediately while auth is loading (prevents black screen)
  if (loadingAuth || loadingUserDoc) {
    return <FullScreenLoader />;
  }

  // Redirect unauthenticated users (return null during redirect)
  if (!user) {
    return null;
  }

  // Render children only when user is authenticated and loading is complete
  return <>{children}</>;
}

