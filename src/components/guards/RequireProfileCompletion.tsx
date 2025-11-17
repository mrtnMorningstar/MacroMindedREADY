"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ProfileIncompleteBanner from "../banners/ProfileIncompleteBanner";

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
  const { user, authLoading } = useAuth();
  const router = useRouter();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const missingFields = useMemo(() => {
    if (!profile) return requiredFields;
    return requiredFields.filter((field) => !profile[field] || profile[field].trim() === "");
  }, [profile, requiredFields]);

  useEffect(() => {
    if (authLoading || !user) return;

    const checkProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
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

    checkProfile();
  }, [user, authLoading, requiredFields]);

  if (authLoading || checkingProfile) {
    return null; // Let parent handle loading
  }

  if (!user) {
    return null;
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

