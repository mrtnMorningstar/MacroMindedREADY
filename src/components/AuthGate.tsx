"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { useAppContext } from "@/context";
import FullScreenLoader from "./shared/FullScreenLoader";

type AuthGateProps = {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requirePurchase?: boolean;
};

export default function AuthGate({
  children,
  requireAuth = false,
  requireAdmin = false,
  requirePurchase = false,
}: AuthGateProps) {
  const { user, isAdmin: isUserAdmin, isUnlocked, loadingAuth, loadingUserDoc, loadingAdmin, loadingPurchase } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loadingAuth || loadingUserDoc) return;

    // If auth is required but no user, redirect to login
    if (requireAuth && !user) {
      router.replace("/login");
      return;
    }

    // If no requirements, allow access
    if (!requireAuth && !requireAdmin && !requirePurchase) {
      return;
    }

    // Check admin permission
    if (requireAdmin) {
      if (!user) {
        router.replace("/login");
        return;
      }

      if (!loadingAdmin && !isUserAdmin) {
        router.replace("/dashboard");
      }
      return;
    }

    // Check purchase permission
    if (requirePurchase) {
      if (!user) {
        router.replace("/login");
        return;
      }

      if (!loadingPurchase && !isUnlocked) {
        router.replace("/packages");
      }
      return;
    }
  }, [user, isUserAdmin, isUnlocked, loadingAuth, loadingUserDoc, loadingAdmin, loadingPurchase, requireAuth, requireAdmin, requirePurchase, router]);

  // Show loader while checking auth or permissions
  if (loadingAuth || loadingUserDoc || (requireAdmin && loadingAdmin) || (requirePurchase && loadingPurchase)) {
    return <FullScreenLoader />;
  }

  // If no user and auth is required, show loader during redirect
  if (requireAuth && !user) {
    return <FullScreenLoader />;
  }

  // If permissions check failed, show loader during redirect
  if ((requireAdmin && !isUserAdmin) || (requirePurchase && !isUnlocked)) {
    return <FullScreenLoader />;
  }

  return <>{children}</>;
}

