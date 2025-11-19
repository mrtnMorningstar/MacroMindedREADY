"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getUserPurchase } from "@/lib/purchases";
import FullScreenLoader from "../FullScreenLoader";
import PackageRequiredModal from "../modals/PackageRequiredModal";

type RequirePackageProps = {
  children: React.ReactNode;
  redirectTo?: string;
};

export function RequirePackage({ children, redirectTo = "/packages" }: RequirePackageProps) {
  const { user, userDoc, loadingAuth, loadingUserDoc } = useAuth();
  const router = useRouter();
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  const [hasPackage, setHasPackage] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (loadingAuth || loadingUserDoc) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    // Check userDoc first
    const packageTier = userDoc?.packageTier;
    if (packageTier) {
      setHasPackage(true);
      return;
    }

    // Fallback: check purchases
    setCheckingPurchase(true);
    const checkPurchase = async () => {
      try {
        const purchase = await getUserPurchase(user.uid);
        if (purchase) {
          setHasPackage(true);
        } else {
          setShowModal(true);
          setTimeout(() => {
            router.replace(`${redirectTo}?redirect=dashboard`);
          }, 2000);
        }
      } catch (error) {
        console.error("Failed to check purchase:", error);
        setShowModal(true);
        setTimeout(() => {
          router.replace(redirectTo);
        }, 2000);
      } finally {
        setCheckingPurchase(false);
      }
    };

    void checkPurchase();
  }, [user, userDoc, loadingAuth, loadingUserDoc, router, redirectTo]);

  if (loadingAuth || loadingUserDoc || checkingPurchase) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <FullScreenLoader />;
  }

  if (!hasPackage) {
    return (
      <>
        <PackageRequiredModal isOpen={showModal} onClose={() => setShowModal(false)} />
        <FullScreenLoader />
      </>
    );
  }

  return <>{children}</>;
}

