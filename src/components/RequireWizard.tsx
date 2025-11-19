"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import FullScreenLoader from "./FullScreenLoader";

type RequireWizardProps = {
  children: ReactNode;
  redirectTo?: string;
};

export default function RequireWizard({
  children,
  redirectTo = "/macro-wizard",
}: RequireWizardProps) {
  const router = useRouter();
  const { user, userDoc, loadingAuth, loadingUserDoc } = useAuth();
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

  if (loadingAuth || loadingUserDoc || checkingWizard) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <FullScreenLoader />;
  }

  return <>{children}</>;
}

