"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { isAdmin } from "@/lib/admin";
import { getUserPurchase } from "@/lib/purchases";
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

type AppContextValue = {
  // Auth
  user: User | null;
  userDoc: UserDoc | null;
  isAdmin: boolean;
  
  // Dashboard data
  purchase: any;
  data: UserDashboardData | null;
  
  // Computed values
  macros: EstimatedMacros | null;
  packageTier: string | null;
  isUnlocked: boolean;
  
  // Loading states
  loadingAuth: boolean;
  loadingUserDoc: boolean;
  loadingAdmin: boolean;
  loadingPurchase: boolean;
  loading: boolean; // Overall loading state (true if any loading is true)
  
  // Error states
  error: string | null;
  sessionExpired: boolean;
  
  // Actions
  refresh: () => Promise<void>;
  signOutAndRedirect: () => Promise<void>;
  setSessionExpired: (expired: boolean) => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  
  // Dashboard state
  const [purchase, setPurchase] = useState<any>(null);
  const [data, setData] = useState<UserDashboardData | null>(null);
  
  // Loading states
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingUserDoc, setLoadingUserDoc] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [loadingPurchase, setLoadingPurchase] = useState(false);
  
  // Error states
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Overall loading state
  const loading = useMemo(
    () => loadingAuth || loadingUserDoc || loadingAdmin || loadingPurchase,
    [loadingAuth, loadingUserDoc, loadingAdmin, loadingPurchase]
  );

  // Computed values
  const macros = useMemo(() => userDoc?.estimatedMacros ?? null, [userDoc?.estimatedMacros]);
  const packageTier = useMemo(() => userDoc?.packageTier ?? null, [userDoc?.packageTier]);
  const isUnlocked = useMemo(() => !!(purchase || userDoc?.packageTier), [purchase, userDoc?.packageTier]);

  // Load user document and dashboard data
  const loadUserData = useCallback(async (uid: string) => {
    setLoadingUserDoc(true);
    setLoadingPurchase(true);
    setError(null);
    
    try {
      // Load user document
      const userDocRef = doc(db, "users", uid);
      const snapshot = await getDoc(userDocRef);
      let nextData: UserDashboardData = {};
      
      if (snapshot.exists()) {
        const docData = snapshot.data();
        setUserDoc(docData as UserDoc);
        nextData = (docData as UserDashboardData) ?? {};

        // Generate referral code if needed
        if (
          !nextData.referralCode &&
          nextData.displayName &&
          typeof nextData.displayName === "string" &&
          nextData.displayName.trim().length > 0
        ) {
          try {
            const newReferralCode = await generateUniqueReferralCode(nextData.displayName);
            if (newReferralCode && typeof newReferralCode === "string") {
              await setDoc(
                userDocRef,
                {
                  referralCode: newReferralCode,
                  referralCredits: nextData.referralCredits ?? 0,
                },
                { merge: true }
              );
              nextData.referralCode = newReferralCode;
              nextData.referralCredits = nextData.referralCredits ?? 0;
              // Update userDoc state
              setUserDoc((prev) => ({ ...prev, referralCode: newReferralCode }));
            }
          } catch (referralError) {
            console.error("Failed to generate referral code:", referralError);
          }
        }
      } else {
        setUserDoc(null);
      }
      
      setData(nextData);

      // Load purchase
      try {
        const userPurchase = await getUserPurchase(uid);
        if (!userPurchase && nextData.packageTier) {
          setPurchase({ planType: nextData.packageTier, status: "paid" });
        } else {
          setPurchase(userPurchase);
        }
      } catch (purchaseError) {
        console.error("Failed to load purchase:", purchaseError);
        setPurchase(null);
      }
    } catch (fetchError) {
      console.error("Failed to load user data:", fetchError);
      setError("We couldn't load your data. Please refresh.");
      setData(null);
      setUserDoc(null);
    } finally {
      setLoadingUserDoc(false);
      setLoadingPurchase(false);
    }
  }, []);

  // Refresh function
  const refresh = useCallback(async () => {
    if (user) {
      await loadUserData(user.uid);
    }
  }, [user, loadUserData]);

  // Sign out and redirect
  const signOutAndRedirect = useCallback(async () => {
    await signOut(auth);
    router.replace("/login");
  }, [router]);

  // Handle Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u && user) {
        // User was logged in but now logged out - session expired
        setSessionExpired(true);
      } else {
        setSessionExpired(false);
      }
      setUser(u);
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Load user document and dashboard data when user is defined
  useEffect(() => {
    if (!user) {
      setUserDoc(null);
      setData(null);
      setPurchase(null);
      setLoadingUserDoc(false);
      setLoadingPurchase(false);
      setIsUserAdmin(false);
      setLoadingAdmin(false);
      setError(null);
      return;
    }

    void loadUserData(user.uid);
  }, [user, loadUserData]);

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

  const value: AppContextValue = useMemo(
    () => ({
      user,
      userDoc,
      isAdmin: isUserAdmin,
      purchase,
      data,
      macros,
      packageTier,
      isUnlocked,
      loadingAuth,
      loadingUserDoc,
      loadingAdmin,
      loadingPurchase,
      loading,
      error,
      sessionExpired,
      refresh,
      signOutAndRedirect,
      setSessionExpired,
    }),
    [
      user,
      userDoc,
      isUserAdmin,
      purchase,
      data,
      macros,
      packageTier,
      isUnlocked,
      loadingAuth,
      loadingUserDoc,
      loadingAdmin,
      loadingPurchase,
      loading,
      error,
      sessionExpired,
      refresh,
      signOutAndRedirect,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
}

// Legacy hooks for backward compatibility during migration
export function useAuth() {
  const context = useAppContext();
  return {
    user: context.user,
    userDoc: context.userDoc,
    isAdmin: context.isAdmin,
    loadingAuth: context.loadingAuth,
    loadingUserDoc: context.loadingUserDoc,
    loadingAdmin: context.loadingAdmin,
    sessionExpired: context.sessionExpired,
    setSessionExpired: context.setSessionExpired,
  };
}

export function useDashboard() {
  const context = useAppContext();
  return {
    user: context.user,
    data: context.data,
    purchase: context.purchase,
    loading: context.loading,
    error: context.error,
    refresh: context.refresh,
    signOutAndRedirect: context.signOutAndRedirect,
    isUnlocked: context.isUnlocked,
  };
}

