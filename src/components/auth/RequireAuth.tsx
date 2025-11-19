"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import FullScreenLoader from "../FullScreenLoader";

type RequireAuthProps = {
  children: React.ReactNode;
  redirectTo?: string;
};

/**
 * Protected route wrapper that ensures user is authenticated.
 * - Waits for Firebase Auth to finish loading (no UI flashing)
 * - Fetches user's Firestore document
 * - Redirects to /login if not authenticated
 */
export function RequireAuth({ children, redirectTo = "/login" }: RequireAuthProps) {
  const { user, authLoading } = useAuth();
  const router = useRouter();
  const [loadingUserDoc, setLoadingUserDoc] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace(redirectTo);
      return;
    }

    // Fetch user document from Firestore
    const fetchUserDoc = async () => {
      setLoadingUserDoc(true);
      try {
        await getDoc(doc(db, "users", user.uid));
        // Document fetched successfully, user is authenticated
      } catch (error) {
        console.error("Failed to fetch user document:", error);
        // Still allow access, document might not exist yet
      } finally {
        setLoadingUserDoc(false);
      }
    };

    void fetchUserDoc();
  }, [user, authLoading, router, redirectTo]);

  // Show loader while auth is loading or user document is being fetched
  if (authLoading || loadingUserDoc) {
    return <FullScreenLoader />;
  }

  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  return <>{children}</>;
}

