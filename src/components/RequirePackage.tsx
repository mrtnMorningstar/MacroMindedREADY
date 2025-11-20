"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";

type RequirePackageProps = {
  children: ReactNode;
};

export default function RequirePackage({ children }: RequirePackageProps) {
  const { firebaseUser, hasPackage, loading } = useUser();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="animate-pulse text-sm">Loading…</div>
      </div>
    );
  }

  if (!firebaseUser) {
    router.replace("/login");
    return null;
  }

  if (!hasPackage) {
    router.replace("/packages");
    return null;
  }

  return <>{children}</>;
}

