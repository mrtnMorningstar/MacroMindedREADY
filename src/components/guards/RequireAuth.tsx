"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import FullScreenLoader from "../FullScreenLoader";

type RequireAuthProps = {
  children: React.ReactNode;
  redirectTo?: string;
};

export function RequireAuth({ children, redirectTo = "/login" }: RequireAuthProps) {
  const { user, loadingAuth, loadingUserDoc } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loadingAuth || loadingUserDoc) return;
    if (!user) {
      router.replace(redirectTo);
    }
  }, [user, loadingAuth, loadingUserDoc, router, redirectTo]);

  if (loadingAuth || loadingUserDoc) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <FullScreenLoader />;
  }

  return <>{children}</>;
}

