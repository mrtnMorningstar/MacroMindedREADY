"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { useAppContext } from "@/context/AppContext";
import { db } from "@/lib/firebase";
import FullScreenLoader from "../FullScreenLoader";

type RequireWizardProps = {
  children: ReactNode;
  redirectTo?: string;
};

/**
 * Protected route wrapper that ensures user has completed the macro wizard.
 * - Waits for Firebase Auth and Firestore userDoc to finish loading
 * - Checks userDoc.macroWizardCompleted
 * - Redirects to /macro-wizard if not completed
 * - NEVER returns null - always shows FullScreenLoader during transitions
 */
export function RequireWizard({
  children,
  redirectTo = "/macro-wizard",
}: RequireWizardProps) {
  const router = useRouter();
  const { user, userDoc, loadingAuth, loadingUserDoc } = useAppContext();
  const [checkingWizard, setCheckingWizard] = useState(true);

  useEffect(() => {
    if (loadingAuth || loadingUserDoc) return;

    if (!user) {
      setCheckingWizard(false);
      return;
    }

    // Use userDoc from context if available
    if (userDoc) {
      if (!userDoc.macroWizardCompleted) {
        router.push(redirectTo);
      }
      setCheckingWizard(false);
      return;
    }

    // Fallback: fetch if not in context
    const checkWizardCompletion = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const docSnapshot = await getDoc(userDocRef);

        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (!userData.macroWizardCompleted) {
            router.push(redirectTo);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to check wizard completion:", error);
      } finally {
        setCheckingWizard(false);
      }
    };

    void checkWizardCompletion();
  }, [user, userDoc, loadingAuth, loadingUserDoc, router, redirectTo]);

  // Show loader while checking, but ensure we don't flash black screen
  if (loadingAuth || loadingUserDoc || checkingWizard) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-[#D7263D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-[#D7263D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

