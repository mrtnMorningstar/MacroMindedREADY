"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { getUserPurchase } from "@/lib/purchases";
import FullScreenLoader from "./FullScreenLoader";

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
  const { user, userDoc, loadingAuth, loadingUserDoc } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checkingPermissions, setCheckingPermissions] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (loadingAuth || loadingUserDoc) return;

    // If auth is required but no user, redirect to login
    if (requireAuth && !user) {
      router.replace("/login");
      return;
    }

    // If no requirements, allow access
    if (!requireAuth && !requireAdmin && !requirePurchase) {
      setHasPermission(true);
      return;
    }

    // Check admin permission using userDoc
    if (requireAdmin) {
      if (!user) {
        router.replace("/login");
        return;
      }

      if (userDoc && userDoc.role === "admin") {
        setHasPermission(true);
      } else if (userDoc && userDoc.role !== "admin") {
        router.replace("/dashboard");
      }
      return;
    }

    // Check purchase permission using userDoc
    if (requirePurchase) {
      if (!user) {
        router.replace("/login");
        return;
      }

      if (userDoc?.packageTier) {
        setHasPermission(true);
      } else {
        setCheckingPermissions(true);
        const checkPurchase = async () => {
          try {
            const purchase = await getUserPurchase(user.uid);
            if (purchase) {
              setHasPermission(true);
            } else {
              router.replace("/packages");
            }
          } catch (error) {
            console.error("Failed to check purchase:", error);
            router.replace("/packages");
          } finally {
            setCheckingPermissions(false);
          }
        };
        void checkPurchase();
      }
      return;
    }

    // If only auth is required and user exists, allow access
    if (requireAuth && user) {
      setHasPermission(true);
    }
  }, [user, userDoc, loadingAuth, loadingUserDoc, requireAuth, requireAdmin, requirePurchase, router]);

  // Show loader while checking auth or permissions
  if (loadingAuth || loadingUserDoc || checkingPermissions) {
    return <FullScreenLoader />;
  }

  // If no user and auth is required, show loader during redirect
  if (requireAuth && !user) {
    return <FullScreenLoader />;
  }

  // If permissions check failed, show loader during redirect
  if ((requireAdmin || requirePurchase) && !hasPermission) {
    return <FullScreenLoader />;
  }

  return <>{children}</>;
}

