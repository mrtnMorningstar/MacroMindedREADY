"use client";

import React from "react";
import { useAuth, AuthProvider } from "./AuthContext";
import { usePurchase, PurchaseProvider } from "./PurchaseContext";
import { useUI, UIProvider } from "./UIContext";

// Context providers
export { AuthProvider, useAuth } from "./AuthContext";
export { PurchaseProvider, usePurchase } from "./PurchaseContext";
export { UIProvider, useUI } from "./UIContext";

// Combined provider that wraps all contexts
export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SessionExpiredSyncProvider>
        <PurchaseProvider>
          <UIProvider>{children}</UIProvider>
        </PurchaseProvider>
      </SessionExpiredSyncProvider>
    </AuthProvider>
  );
}

// Helper component to sync sessionExpired from AuthContext to UIProvider
function SessionExpiredSyncProvider({ children }: { children: React.ReactNode }) {
  const { sessionExpired, setSessionExpired } = useAuth();
  return (
    <UIProvider sessionExpired={sessionExpired} setSessionExpired={setSessionExpired}>
      {children}
    </UIProvider>
  );
}

// Unified hook for backward compatibility (can be used during migration)
export function useAppContext() {
  const auth = useAuth();
  const purchase = usePurchase();
  const ui = useUI();

  return {
    // Auth
    user: auth.user,
    userDoc: auth.userDoc,
    isAdmin: auth.isAdmin,
    loadingAuth: auth.loadingAuth,
    loadingUserDoc: auth.loadingUserDoc,
    loadingAdmin: auth.loadingAdmin,
    sessionExpired: ui.sessionExpired,
    setSessionExpired: ui.setSessionExpired,
    signOutAndRedirect: auth.signOutAndRedirect,
    
    // Purchase
    purchase: purchase.purchase,
    data: purchase.data,
    macros: purchase.macros,
    packageTier: purchase.packageTier,
    isUnlocked: purchase.isUnlocked,
    loadingPurchase: purchase.loadingPurchase,
    loading: purchase.loading || auth.loadingAuth || auth.loadingUserDoc || auth.loadingAdmin,
    
    // Combined
    error: auth.error,
    refresh: async () => {
      await Promise.all([auth.refresh(), purchase.refresh()]);
    },
  };
}

// Note: useAuth, usePurchase, and useUI are already exported above

