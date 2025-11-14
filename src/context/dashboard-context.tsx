"use client";

import { createContext, useContext } from "react";
import type { User } from "firebase/auth";

import type { UserDashboardData } from "@/types/dashboard";

export type DashboardContextValue = {
  user: User | null;
  data: UserDashboardData | null;
  purchase: any;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  signOutAndRedirect: () => Promise<void>;
  isUnlocked: boolean;
};

const DashboardContext = createContext<DashboardContextValue | undefined>(
  undefined
);

export function DashboardProvider({
  value,
  children,
}: {
  value: DashboardContextValue;
  children: React.ReactNode;
}) {
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
}

