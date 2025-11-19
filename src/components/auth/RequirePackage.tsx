"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getUserPurchase } from "@/lib/purchases";
import FullScreenLoader from "../FullScreenLoader";
import PackageRequiredModal from "../modals/PackageRequiredModal";

type RequirePackageProps = {
  children: React.ReactNode;
  redirectTo?: string;
  showModal?: boolean;
};

/**
 * Protected route wrapper that ensures user has purchased a package.
 * - Waits for Firebase Auth to finish loading
 * - Fetches user's Firestore document to check packageTier
 * - Checks purchases collection as fallback
 * - Redirects to /packages if no package found
 */
export function RequirePackage({ 
  children, 
  redirectTo = "/packages",
  showModal = true 
}: RequirePackageProps) {
  const { user, authLoading } = useAuth();
  const router = useRouter();
  const [checkingPackage, setCheckingPackage] = useState(true);
  const [hasPackage, setHasPackage] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const checkPackage = async () => {
      setCheckingPackage(true);
      try {
        // Fetch user document
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        const packageTier = userData?.packageTier;

        // Also check purchases collection as fallback
        const purchase = await getUserPurchase(user.uid);

        if (packageTier || purchase) {
          setHasPackage(true);
        } else {
          if (showModal) {
            setShowPackageModal(true);
            // Redirect after showing modal
            setTimeout(() => {
              router.replace(`${redirectTo}?redirect=dashboard`);
            }, 2000);
          } else {
            router.replace(redirectTo);
          }
        }
      } catch (error) {
        console.error("Failed to check package:", error);
        if (showModal) {
          setShowPackageModal(true);
          setTimeout(() => {
            router.replace(redirectTo);
          }, 2000);
        } else {
          router.replace(redirectTo);
        }
      } finally {
        setCheckingPackage(false);
      }
    };

    void checkPackage();
  }, [user, authLoading, router, redirectTo, showModal]);

  // Show loader while checking
  if (authLoading || checkingPackage) {
    return <FullScreenLoader />;
  }

  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  // Show modal and redirect if no package
  if (!hasPackage) {
    return (
      <>
        {showModal && (
          <PackageRequiredModal 
            isOpen={showPackageModal} 
            onClose={() => {
              setShowPackageModal(false);
              router.replace(redirectTo);
            }} 
          />
        )}
        {null}
      </>
    );
  }

  return <>{children}</>;
}

