"use client";

import { useEffect, useState, useMemo, useRef } from "react";
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
  const [hasInitiallyChecked, setHasInitiallyChecked] = useState(false);
  const redirectingRef = useRef(false);

  const missingFields = useMemo(() => {
    if (!profile) return requiredFields;
    return requiredFields.filter((field) => !profile[field] || profile[field].trim() === "");
  }, [profile, requiredFields]);

  useEffect(() => {
    if (loadingAuth || loadingUserDoc || !user) {
      // If we've already checked before and user exists, don't reset state during navigation
      if (hasInitiallyChecked && user) {
        return;
      }
      return;
    }

    // Use userDoc from context if available, otherwise fetch
    if (userDoc?.profile) {
      const userProfile = userDoc.profile || {};
      setProfile(userProfile);
      const hasAllFields = requiredFields.every(
        (field) => userProfile[field] && String(userProfile[field]).trim() !== ""
      );
      setIsComplete(hasAllFields);
      setCheckingProfile(false);
      setHasInitiallyChecked(true);
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
        setHasInitiallyChecked(true);
      } catch (error) {
        console.error("Failed to check profile:", error);
        setIsComplete(false);
        setHasInitiallyChecked(true);
      } finally {
        setCheckingProfile(false);
      }
    };

    void checkProfile();
  }, [user, userDoc, loadingAuth, loadingUserDoc, requiredFields, hasInitiallyChecked]);

  // If we have a user, always render children (even during checks) to prevent black screen
  if (user) {
    // Only show full-screen loader if we're doing initial check and haven't checked before
    if (!hasInitiallyChecked && (loadingAuth || loadingUserDoc || checkingProfile)) {
      return <FullScreenLoader />;
    }
    
    // Always render children to prevent black screen - banner overlays if needed
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

  // Show loader only if no user
  if (loadingAuth || loadingUserDoc || !user) {
    return <FullScreenLoader />;
  }

  // Default: render children
  return <>{children}</>;
}

