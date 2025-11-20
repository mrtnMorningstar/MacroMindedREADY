"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type AppUserDoc = {
  email?: string;
  displayName?: string;
  role?: "admin" | "client" | string;
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setFirebaseUser(null);
          setUserDoc(null);
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
      } catch (err: any) {
        console.error("useUser error", err);
        setError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const isAdmin = !!userDoc && userDoc.role === "admin";
  const hasPackage = !!userDoc && !!userDoc.packageTier;

  return {
    firebaseUser,
    userDoc,
    loading,
    error,
    isAdmin,
    hasPackage,
  };
}

