"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { isAdmin } from "@/lib/admin";
import { generateUniqueReferralCode } from "@/lib/referral";
import type { UserDashboardData, EstimatedMacros } from "@/types/dashboard";

type UserDoc = {
  role?: string; // Display-only field, NOT used for authorization
  packageTier?: string | null;
  displayName?: string | null;
  email?: string | null;
  mealPlanStatus?: string | null;
  macroWizardCompleted?: boolean;
  estimatedMacros?: EstimatedMacros | null;
  [key: string]: any;
};

type AuthContextValue = {
  user: User | null;
  userDoc: UserDoc | null;
  isAdmin: boolean;
  loadingAuth: boolean;
  loadingUserDoc: boolean;
  loadingAdmin: boolean;
  error: string | null;
  sessionExpired: boolean;
  setSessionExpired: (expired: boolean) => void;
  signOutAndRedirect: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const previousUserRef = useRef<User | null>(null);
  
  // Loading states
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingUserDoc, setLoadingUserDoc] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  
  // Error states
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Load user document
  const loadUserDoc = useCallback(async (uid: string) => {
    setLoadingUserDoc(true);
    setError(null);
    
    try {
      const userDocRef = doc(db, "users", uid);
      const snapshot = await getDoc(userDocRef);
      
      if (snapshot.exists()) {
        const docData = snapshot.data();
        setUserDoc(docData as UserDoc);

        // Generate referral code if needed
        const data = docData as UserDashboardData;
        if (
          !data.referralCode &&
          data.displayName &&
          typeof data.displayName === "string" &&
          data.displayName.trim().length > 0
        ) {
          try {
            const newReferralCode = await generateUniqueReferralCode(data.displayName);
            if (newReferralCode && typeof newReferralCode === "string") {
              await setDoc(
                userDocRef,
                {
                  referralCode: newReferralCode,
                  referralCredits: data.referralCredits ?? 0,
                },
                { merge: true }
              );
              setUserDoc((prev) => (prev ? { ...prev, referralCode: newReferralCode } : null));
            }
          } catch (referralError) {
            console.error("Failed to generate referral code:", referralError);
          }
        }
      } else {
        setUserDoc(null);
      }
    } catch (fetchError) {
      console.error("Failed to load user document:", fetchError);
      setError("We couldn't load your data. Please refresh.");
      setUserDoc(null);
    } finally {
      setLoadingUserDoc(false);
    }
  }, []);

  // Refresh function
  const refresh = useCallback(async () => {
    if (user) {
      await loadUserDoc(user.uid);
    }
  }, [user, loadUserDoc]);

  // Sign out and redirect
  const signOutAndRedirect = useCallback(async () => {
    await signOut(auth);
    router.replace("/login");
  }, [router]);

  // Handle Firebase Auth state changes
  useEffect(() => {
    setLoadingAuth(true);

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      const previousUser = previousUserRef.current;
      previousUserRef.current = u ?? null;
      
      setUser(u ?? null);
      setSessionExpired(!u && !!previousUser);
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Load user document when user is defined
  useEffect(() => {
    if (!user) {
      setUserDoc(null);
      setLoadingUserDoc(false);
      setIsUserAdmin(false);
      setLoadingAdmin(false);
      setError(null);
      return;
    }

    void loadUserDoc(user.uid);
  }, [user, loadUserDoc]);

  // Check admin status via custom claims when user is defined
  useEffect(() => {
    if (!user) {
      setIsUserAdmin(false);
      setLoadingAdmin(false);
      return;
    }

    setLoadingAdmin(true);
    const checkAdminStatus = async () => {
      try {
        const adminStatus = await isAdmin(user);
        setIsUserAdmin(adminStatus);
      } catch (error) {
        console.error("Failed to check admin status:", error);
        setIsUserAdmin(false);
      } finally {
        setLoadingAdmin(false);
      }
    };

    void checkAdminStatus();
  }, [user]);

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      userDoc,
      isAdmin: isUserAdmin,
      loadingAuth,
      loadingUserDoc,
      loadingAdmin,
      error,
      sessionExpired,
      setSessionExpired,
      signOutAndRedirect,
      refresh,
    }),
    [
      user,
      userDoc,
      isUserAdmin,
      loadingAuth,
      loadingUserDoc,
      loadingAdmin,
      error,
      sessionExpired,
      signOutAndRedirect,
      refresh,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

