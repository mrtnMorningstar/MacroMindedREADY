"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import FullScreenLoader from "../FullScreenLoader";

type RequireAdminProps = {
  children: React.ReactNode;
  redirectTo?: string;
};

/**
 * Protected route wrapper that ensures user is an admin.
 * - Waits for Firebase Auth and Firestore userDoc to finish loading
 * - Checks userDoc.role === "admin"
 * - Redirects to /dashboard if not admin
 * - NEVER returns null - always shows FullScreenLoader during transitions
 */
export function RequireAdmin({ children, redirectTo = "/dashboard" }: RequireAdminProps) {
  const { user, userDoc, loadingAuth, loadingUserDoc } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after loading is complete
    if (loadingAuth || loadingUserDoc) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (userDoc && userDoc.role !== "admin") {
      router.replace(redirectTo);
    }
  }, [user, userDoc, loadingAuth, loadingUserDoc, router, redirectTo]);

  // Show loader while auth or userDoc is loading
  if (loadingAuth || loadingUserDoc) {
    return <FullScreenLoader />;
  }

  // Show loader during redirect (never return null)
  if (!user) {
    return <FullScreenLoader />;
  }

  // Show loader if not admin (during redirect)
  if (userDoc && userDoc.role !== "admin") {
    return <FullScreenLoader />;
  }

  // If userDoc is null but user exists, wait a bit more (document might be loading)
  if (!userDoc && user) {
    return <FullScreenLoader />;
  }

  return <>{children}</>;
}

