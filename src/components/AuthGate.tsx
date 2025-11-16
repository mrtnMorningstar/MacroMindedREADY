"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/context/auth-context";
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
  const { user, authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checkingPermissions, setCheckingPermissions] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (authLoading) return;

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

    // Check admin permission
    if (requireAdmin) {
      setCheckingPermissions(true);
      const checkAdmin = async () => {
        if (!user) {
          router.replace("/login");
          return;
        }

        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const role = userDoc.data()?.role;

          if (role !== "admin") {
            router.replace("/dashboard");
            return;
          }

          setHasPermission(true);
        } catch (error) {
          console.error("Failed to verify admin role:", error);
          router.replace("/dashboard");
        } finally {
          setCheckingPermissions(false);
        }
      };

      checkAdmin();
      return;
    }

    // Check purchase permission
    if (requirePurchase) {
      setCheckingPermissions(true);
      const checkPurchase = async () => {
        if (!user) {
          router.replace("/login");
          return;
        }

        try {
          const purchase = await getUserPurchase(user.uid);
          if (!purchase) {
            router.replace("/packages");
            return;
          }

          setHasPermission(true);
        } catch (error) {
          console.error("Failed to check purchase:", error);
          router.replace("/packages");
        } finally {
          setCheckingPermissions(false);
        }
      };

      checkPurchase();
      return;
    }

    // If only auth is required and user exists, allow access
    if (requireAuth && user) {
      setHasPermission(true);
    }
  }, [user, authLoading, requireAuth, requireAdmin, requirePurchase, router]);

  // Show loader while checking auth or permissions
  if (authLoading || checkingPermissions) {
    return <FullScreenLoader />;
  }

  // If no user and auth is required, don't render (redirect is happening)
  if (requireAuth && !user) {
    return null;
  }

  // If permissions check failed, don't render (redirect is happening)
  if ((requireAdmin || requirePurchase) && !hasPermission) {
    return null;
  }

  return <>{children}</>;
}

