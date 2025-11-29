"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context";
import { getUserPurchase } from "@/lib/purchases";
import FullScreenLoader from "@/components/shared/FullScreenLoader";
import PackageRequiredModal from "../modals/PackageRequiredModal";

type RequirePackageProps = {
  children: React.ReactNode;
  redirectTo?: string;
  showModal?: boolean;
};

/**
 * Protected route wrapper that ensures user has purchased a package.
 * - Waits for Firebase Auth and Firestore userDoc to finish loading
 * - Checks userDoc.packageTier and purchases collection
 * - Redirects to /packages if no package found
 * - NEVER returns null - always shows FullScreenLoader during transitions
 */
export function RequirePackage({ 
  children, 
  redirectTo = "/packages",
  showModal = true 
}: RequirePackageProps) {
  const { user, packageTier, purchase, isUnlocked, loadingAuth, loadingUserDoc, loadingPurchase } = useAppContext();
  const router = useRouter();
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);

  useEffect(() => {
    // Wait for auth and userDoc to load
    if (loadingAuth || loadingUserDoc || loadingPurchase) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    // Check if user has package from AppContext
    if (isUnlocked || packageTier || purchase) {
      return;
    }

    // Fallback: check purchases collection (though this should already be in context)
    setCheckingPurchase(true);
    const checkPurchase = async () => {
      try {
        const userPurchase = await getUserPurchase(user.uid);
        if (!userPurchase) {
          if (showModal) {
            setShowPackageModal(true);
            setTimeout(() => {
              router.replace(`${redirectTo}?redirect=dashboard`);
            }, 2000);
          } else {
            router.replace(redirectTo);
          }
        }
      } catch (error) {
        console.error("Failed to check purchase:", error);
        if (showModal) {
          setShowPackageModal(true);
          setTimeout(() => {
            router.replace(redirectTo);
          }, 2000);
        } else {
          router.replace(redirectTo);
        }
      } finally {
        setCheckingPurchase(false);
      }
    };

    void checkPurchase();
  }, [user, packageTier, purchase, isUnlocked, loadingAuth, loadingUserDoc, loadingPurchase, router, redirectTo, showModal]);

  // Show loader while loading auth, userDoc, purchase, or checking purchase
  if (loadingAuth || loadingUserDoc || loadingPurchase || checkingPurchase) {
    return <FullScreenLoader />;
  }

  // Show loader during redirect (never return null)
  if (!user) {
    return <FullScreenLoader />;
  }

  // Show modal and loader if no package
  if (!isUnlocked && !packageTier && !purchase) {
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
        <FullScreenLoader />
      </>
    );
  }

  return <>{children}</>;
}

