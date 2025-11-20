"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { firebaseUser, hasPackage, loading } = useUser();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="animate-pulse text-sm tracking-wide">
          Loading your dashboard...
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    router.replace("/login");
    return null;
  }

  if (!hasPackage) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Dashboard Locked</h1>
          <p className="text-gray-300 text-sm">
            You've created an account, but you don't have an active plan yet.
            Choose a package to unlock your MacroMinded dashboard.
          </p>
          <button
            onClick={() => router.push("/packages")}
            className="mt-2 inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700 transition"
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {children}
    </div>
  );
}
