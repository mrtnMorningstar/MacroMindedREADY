"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppContext } from "@/context/AppContext";

export function RequireWizard({ children }: { children: React.ReactNode }) {
  const { user, userDoc, loadingAuth, loadingUserDoc } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();

  const needsWizard = !!user && !!userDoc && userDoc.macroWizardCompleted === false;

  useEffect(() => {
    if (loadingAuth || loadingUserDoc) return;
    if (!user) return; // handled by RequireAuth higher up
    if (needsWizard && !pathname?.startsWith("/macro-wizard")) {
      router.replace("/macro-wizard");
    }
  }, [loadingAuth, loadingUserDoc, user, needsWizard, router, pathname]);

  // During loading, return empty div (layout overlay handles visual loading)
  if (loadingAuth || loadingUserDoc) return <div />;
  if (needsWizard && !pathname?.startsWith("/macro-wizard")) return <div />;
  return <>{children}</>;
}

