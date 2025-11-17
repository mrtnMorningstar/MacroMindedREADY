"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/context/auth-context";
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
  const { user, authLoading } = useAuth();
  const [checkingWizard, setCheckingWizard] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setCheckingWizard(false);
      return;
    }

    const checkWizardCompletion = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
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
  }, [user, authLoading, router, redirectTo]);

  if (authLoading || checkingWizard) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

