"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ProfileIncompleteBanner from "../banners/ProfileIncompleteBanner";
import FullScreenLoader from "../FullScreenLoader";

type RequireProfileCompletionProps = {
  children: React.ReactNode;
  redirectTo?: string;
  showBanner?: boolean;
  requiredFields?: string[];
};

const DEFAULT_REQUIRED_FIELDS = ["age", "height", "weight", "goal"];

export function RequireProfileCompletion({
  children,
  redirectTo = "/macro-wizard",
  showBanner = true,
  requiredFields = DEFAULT_REQUIRED_FIELDS,
}: RequireProfileCompletionProps) {
  const { user, userDoc, loadingAuth, loadingUserDoc } = useAppContext();
  const router = useRouter();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const missingFields = useMemo(() => {
    if (!profile) return requiredFields;
    return requiredFields.filter((field) => !profile[field] || profile[field].trim() === "");
  }, [profile, requiredFields]);

  useEffect(() => {
    if (loadingAuth || loadingUserDoc || !user) return;

    // Use userDoc from context if available, otherwise fetch
    if (userDoc?.profile) {
      const userProfile = userDoc.profile || {};
      setProfile(userProfile);
      const hasAllFields = requiredFields.every(
        (field) => userProfile[field] && String(userProfile[field]).trim() !== ""
      );
      setIsComplete(hasAllFields);
      setCheckingProfile(false);
      return;
    }

    // Fallback: fetch profile if not in context
    const checkProfile = async () => {
      try {
        const userDocSnapshot = await getDoc(doc(db, "users", user.uid));
        const userData = userDocSnapshot.data();
        const userProfile = userData?.profile || {};

        setProfile(userProfile);

        const hasAllFields = requiredFields.every(
          (field) => userProfile[field] && String(userProfile[field]).trim() !== ""
        );

        setIsComplete(hasAllFields);
      } catch (error) {
        console.error("Failed to check profile:", error);
        setIsComplete(false);
      } finally {
        setCheckingProfile(false);
      }
    };

    void checkProfile();
  }, [user, userDoc, loadingAuth, loadingUserDoc, requiredFields]);

  if (loadingAuth || loadingUserDoc || checkingProfile) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <FullScreenLoader />;
  }

  return (
    <>
      {showBanner && !isComplete && missingFields.length > 0 && (
        <ProfileIncompleteBanner
          missingFields={missingFields}
          onComplete={() => router.push(redirectTo)}
        />
      )}
      {children}
    </>
  );
}

