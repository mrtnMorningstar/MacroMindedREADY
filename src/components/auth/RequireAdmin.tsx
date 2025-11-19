"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import FullScreenLoader from "../FullScreenLoader";

type RequireAdminProps = {
  children: React.ReactNode;
  redirectTo?: string;
};

/**
 * Protected route wrapper that ensures user is an admin.
 * - Waits for Firebase Auth to finish loading
 * - Fetches user's Firestore document to check role
 * - Redirects to /dashboard if not admin
 */
export function RequireAdmin({ children, redirectTo = "/dashboard" }: RequireAdminProps) {
  const { user, authLoading } = useAuth();
  const router = useRouter();
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const checkAdminRole = async () => {
      setCheckingAdmin(true);
      try {
        // Fetch user document
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        const role = userData?.role;

        if (role === "admin") {
          setIsAdmin(true);
        } else {
          router.replace(redirectTo);
        }
      } catch (error) {
        console.error("Failed to check admin role:", error);
        router.replace(redirectTo);
      } finally {
        setCheckingAdmin(false);
      }
    };

    void checkAdminRole();
  }, [user, authLoading, router, redirectTo]);

  // Show loader while checking
  if (authLoading || checkingAdmin) {
    return <FullScreenLoader />;
  }

  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  // Redirect if not admin
  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}

