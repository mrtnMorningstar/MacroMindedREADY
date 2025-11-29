"use client";

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";

type UIContextValue = {
  sessionExpired: boolean;
  setSessionExpired: (expired: boolean) => void;
  // Add other UI states as needed (banners, modals, etc.)
};

const UIContext = createContext<UIContextValue | undefined>(undefined);

export function UIProvider({ children, sessionExpired: initialSessionExpired, setSessionExpired: setSessionExpiredProp }: { 
  children: ReactNode;
  sessionExpired?: boolean;
  setSessionExpired?: (expired: boolean) => void;
}) {
  const [internalSessionExpired, setInternalSessionExpired] = useState(false);
  
  const sessionExpired = initialSessionExpired !== undefined ? initialSessionExpired : internalSessionExpired;
  const setSessionExpired = setSessionExpiredProp || useCallback((expired: boolean) => {
    setInternalSessionExpired(expired);
  }, []);

  const value: UIContextValue = useMemo(
    () => ({
      sessionExpired,
      setSessionExpired,
    }),
    [sessionExpired, setSessionExpired]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within UIProvider");
  }
  return context;
}

