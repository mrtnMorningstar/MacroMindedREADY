"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getUserPurchase } from "@/lib/purchases";
import FullScreenLoader from "../FullScreenLoader";
import PackageRequiredModal from "../modals/PackageRequiredModal";
import { useState } from "react";

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
  const { user, userDoc, loadingAuth, loadingUserDoc } = useAuth();
  const router = useRouter();
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  const [hasPackage, setHasPackage] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);

  useEffect(() => {
    // Wait for auth and userDoc to load
    if (loadingAuth || loadingUserDoc) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    // Check if user has package from userDoc
    const packageTier = userDoc?.packageTier;
    if (packageTier) {
      setHasPackage(true);
      return;
    }

    // Fallback: check purchases collection
    setCheckingPurchase(true);
    const checkPurchase = async () => {
      try {
        const purchase = await getUserPurchase(user.uid);
        if (purchase) {
          setHasPackage(true);
        } else {
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
  }, [user, userDoc, loadingAuth, loadingUserDoc, router, redirectTo, showModal]);

  // Show loader while loading auth, userDoc, or checking purchase
  if (loadingAuth || loadingUserDoc || checkingPurchase) {
    return <FullScreenLoader />;
  }

  // Show loader during redirect (never return null)
  if (!user) {
    return <FullScreenLoader />;
  }

  // Show modal and loader if no package
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
        <FullScreenLoader />
      </>
    );
  }

  return <>{children}</>;
}

