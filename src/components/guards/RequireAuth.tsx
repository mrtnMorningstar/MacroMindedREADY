"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import FullScreenLoader from "../FullScreenLoader";

type RequireAuthProps = {
  children: React.ReactNode;
  redirectTo?: string;
};

export function RequireAuth({ children, redirectTo = "/login" }: RequireAuthProps) {
  const { user, authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(redirectTo);
    }
  }, [user, authLoading, router, redirectTo]);

  if (authLoading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

