"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from "react";
import { getUserPurchase } from "@/lib/purchases";
import type { UserDashboardData, EstimatedMacros } from "@/types/dashboard";
import { useAuth } from "./AuthContext";

type PurchaseContextValue = {
  purchase: any;
  data: UserDashboardData | null;
  macros: EstimatedMacros | null;
  packageTier: string | null;
  isUnlocked: boolean;
  loadingPurchase: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
};

const PurchaseContext = createContext<PurchaseContextValue | undefined>(undefined);

export function PurchaseProvider({ children }: { children: ReactNode }) {
  const { user, userDoc, loadingUserDoc } = useAuth();
  
  const [purchase, setPurchase] = useState<any>(null);
  const [data, setData] = useState<UserDashboardData | null>(null);
  const [loadingPurchase, setLoadingPurchase] = useState(false);

  // Load purchase data
  const loadPurchase = useCallback(async (uid: string, userDocData: any) => {
    setLoadingPurchase(true);
    
    try {
      const nextData: UserDashboardData = userDocData ? (userDocData as UserDashboardData) : {};
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
    } catch (error) {
      console.error("Failed to load purchase data:", error);
      setPurchase(null);
      setData(null);
    } finally {
      setLoadingPurchase(false);
    }
  }, []);

  // Refresh function
  const refresh = useCallback(async () => {
    if (user && userDoc) {
      await loadPurchase(user.uid, userDoc);
    }
  }, [user, userDoc, loadPurchase]);

  // Load purchase when userDoc is available
  useEffect(() => {
    if (!user || loadingUserDoc || !userDoc) {
      setPurchase(null);
      setData(null);
      setLoadingPurchase(false);
      return;
    }

    void loadPurchase(user.uid, userDoc);
  }, [user, userDoc, loadingUserDoc, loadPurchase]);

  // Computed values
  const macros = useMemo(() => userDoc?.estimatedMacros ?? null, [userDoc?.estimatedMacros]);
  const packageTier = useMemo(() => userDoc?.packageTier ?? null, [userDoc?.packageTier]);
  const isUnlocked = useMemo(() => !!(purchase || userDoc?.packageTier), [purchase, userDoc?.packageTier]);
  const loading = useMemo(() => loadingPurchase || loadingUserDoc, [loadingPurchase, loadingUserDoc]);

  const value: PurchaseContextValue = useMemo(
    () => ({
      purchase,
      data,
      macros,
      packageTier,
      isUnlocked,
      loadingPurchase,
      loading,
      refresh,
    }),
    [
      purchase,
      data,
      macros,
      packageTier,
      isUnlocked,
      loadingPurchase,
      loading,
      refresh,
    ]
  );

  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
}

export function usePurchase() {
  const context = useContext(PurchaseContext);
  if (!context) {
    throw new Error("usePurchase must be used within PurchaseProvider");
  }
  return context;
}

