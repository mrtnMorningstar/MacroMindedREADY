"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { isAdmin } from "@/lib/admin";

export type AppUserDoc = {
  email?: string;
  displayName?: string;
  role?: "admin" | "client" | string; // Display-only field, NOT used for authorization
  packageTier?: "Basic" | "Pro" | "Elite" | null;
  mealPlanStatus?: string | null;
  mealPlanFileURL?: string | null;
  mealPlanImageURLs?: string[] | null;
  mealPlanDeliveredAt?: any;
  createdAt?: any;
};

type UseUserState = {
  firebaseUser: FirebaseUser | null;
  userDoc: AppUserDoc | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  hasPackage: boolean;
};

export function useUser(): UseUserState {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userDoc, setUserDoc] = useState<AppUserDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setFirebaseUser(null);
          setUserDoc(null);
          setIsUserAdmin(false);
          setLoading(false);
          return;
        }
        setFirebaseUser(user);
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUserDoc(snap.data() as AppUserDoc);
        } else {
          setUserDoc(null);
        }

        // Check admin status via custom claims (NOT Firestore role field)
        try {
          const adminStatus = await isAdmin(user);
          setIsUserAdmin(adminStatus);
        } catch (adminError) {
          console.error("Failed to check admin status:", adminError);
          setIsUserAdmin(false);
        }
      } catch (err: any) {
        console.error("useUser error", err);
        setError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const hasPackage = !!userDoc && !!userDoc.packageTier;

  return {
    firebaseUser,
    userDoc,
    loading,
    error,
    isAdmin: isUserAdmin,
    hasPackage,
  };
}

