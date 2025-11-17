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
};

export function RequirePackage({ children, redirectTo = "/packages" }: RequirePackageProps) {
  const { user, authLoading } = useAuth();
  const router = useRouter();
  const [checkingPurchase, setCheckingPurchase] = useState(true);
  const [hasPackage, setHasPackage] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const checkPurchase = async () => {
      try {
        const purchase = await getUserPurchase(user.uid);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const packageTier = userDoc.data()?.packageTier;

        if (purchase || packageTier) {
          setHasPackage(true);
        } else {
          setShowModal(true);
          // Redirect after showing modal
          setTimeout(() => {
            router.replace(`${redirectTo}?redirect=dashboard`);
          }, 100);
        }
      } catch (error) {
        console.error("Failed to check purchase:", error);
        setShowModal(true);
        setTimeout(() => {
          router.replace(redirectTo);
        }, 100);
      } finally {
        setCheckingPurchase(false);
      }
    };

    checkPurchase();
  }, [user, authLoading, router, redirectTo]);

  if (authLoading || checkingPurchase) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return null;
  }

  if (!hasPackage) {
    return (
      <>
        <PackageRequiredModal isOpen={showModal} onClose={() => setShowModal(false)} />
        {null}
      </>
    );
  }

  return <>{children}</>;
}

