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

  // During loading, show placeholder to prevent black screen
  if (loadingAuth || loadingUserDoc) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-[#D7263D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }
  if (!user) return <div />; // during redirect
  return <>{children}</>;
}

