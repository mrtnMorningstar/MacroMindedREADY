"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import FullScreenLoader from "../FullScreenLoader";

type RequireAdminProps = {
  children: React.ReactNode;
  redirectTo?: string;
};

/**
 * Protected route wrapper that ensures user is an admin.
 * - Waits for Firebase Auth to finish loading
 * - Checks admin status via Firebase custom claims (request.auth.token.admin === true)
 * - Redirects to /dashboard if not admin
 * - NEVER returns null - always shows FullScreenLoader during transitions
 * 
 * IMPORTANT: Uses custom claims for authorization, NOT Firestore role field.
 */
export function RequireAdmin({ children, redirectTo = "/dashboard" }: RequireAdminProps) {
  const { user, isAdmin: isUserAdmin, loadingAuth, loadingAdmin } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (loadingAuth || loadingAdmin) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!isUserAdmin) {
      router.replace(redirectTo);
    }
  }, [user, isUserAdmin, loadingAuth, loadingAdmin, router, redirectTo]);

  // Show loader while auth or admin status is loading
  if (loadingAuth || loadingAdmin) {
    return <FullScreenLoader />;
  }

  // Show loader during redirect (never return null)
  if (!user || !isUserAdmin) {
    return <FullScreenLoader />;
  }

  return <>{children}</>;
}

