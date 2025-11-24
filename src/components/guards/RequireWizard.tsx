"use client";

import { useEffect, useState, useRef, type ReactNode } from "react";
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
 * - Only shows full-screen loader on initial load, not during navigation
 */
export function RequireWizard({
  children,
  redirectTo = "/macro-wizard",
}: RequireWizardProps) {
  const router = useRouter();
  const { user, userDoc, loadingAuth, loadingUserDoc } = useAppContext();
  const [checkingWizard, setCheckingWizard] = useState(true);
  const [hasInitiallyChecked, setHasInitiallyChecked] = useState(false);
  const redirectingRef = useRef(false);

  useEffect(() => {
    // If we've already checked and have userDoc, don't re-check during navigation
    if (hasInitiallyChecked && userDoc) {
      // Still check if wizard is not completed and redirect if needed (only once)
      if (!userDoc.macroWizardCompleted && !redirectingRef.current) {
        redirectingRef.current = true;
        router.push(redirectTo);
      }
      return;
    }

    if (loadingAuth || loadingUserDoc) return;

    if (!user) {
      setCheckingWizard(false);
      setHasInitiallyChecked(true);
      return;
    }

    // Use userDoc from context if available
    if (userDoc) {
      if (!userDoc.macroWizardCompleted && !redirectingRef.current) {
        redirectingRef.current = true;
        router.push(redirectTo);
      }
      setCheckingWizard(false);
      setHasInitiallyChecked(true);
      return;
    }

    // Fallback: fetch if not in context
    const checkWizardCompletion = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const docSnapshot = await getDoc(userDocRef);

        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (!userData.macroWizardCompleted && !redirectingRef.current) {
            redirectingRef.current = true;
            router.push(redirectTo);
            return;
          }
        }
        setHasInitiallyChecked(true);
      } catch (error) {
        console.error("Failed to check wizard completion:", error);
        setHasInitiallyChecked(true);
      } finally {
        setCheckingWizard(false);
      }
    };

    void checkWizardCompletion();
  }, [user, userDoc, loadingAuth, loadingUserDoc, router, redirectTo, hasInitiallyChecked]);

  // Always render children first to ensure layout structure is visible
  // Only show loader if we don't have a user yet (auth is still loading)
  // Once user exists, let the page handle its own loading states
  const showLoader = !user && (loadingAuth || loadingUserDoc);

  return (
    <>
      {children}
      {showLoader && <FullScreenLoader />}
    </>
  );
}

