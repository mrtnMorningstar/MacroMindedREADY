"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";

type Props = { children: React.ReactNode; redirectTo?: string };

export function RequireAuth({ children, redirectTo = "/login" }: Props) {
  const { user, loadingAuth, loadingUserDoc } = useAppContext();
  const router = useRouter();
  const redirected = useRef(false);

  // Redirect only after loading resolves
  useEffect(() => {
    if (loadingAuth || loadingUserDoc) return;
    if (redirected.current) return;
    if (!user) {
      redirected.current = true;
      router.replace(redirectTo);
    }
  }, [user, loadingAuth, loadingUserDoc, router, redirectTo]);

  // During loading, return empty div (layout overlay handles visual loading)
  if (loadingAuth || loadingUserDoc) return <div />;
  if (!user) return <div />; // during redirect
  return <>{children}</>;
}

