"use client";

import { useEffect, useState } from "react";
import { getImpersonationFromCookie, exitImpersonation } from "@/lib/impersonation";

/**
 * ImpersonationBanner Component
 * 
 * Displays a banner at the top of the page when an admin is impersonating a user.
 * Reads impersonation context from HTTP-only cookie set by middleware.
 */
export default function ImpersonationBanner() {
  const [impersonationContext, setImpersonationContext] = useState<{
    targetUserId: string;
    adminUserId: string;
    targetUserName: string | null;
    targetUserEmail: string | null;
    impersonatedAt: string;
  } | null>(null);

  useEffect(() => {
    // Check for impersonation context in cookie
    const context = getImpersonationFromCookie();
    setImpersonationContext(context);

    // Check periodically for cookie changes (in case it's cleared externally)
    const interval = setInterval(() => {
      const currentContext = getImpersonationFromCookie();
      setImpersonationContext(currentContext);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!impersonationContext) {
    return null;
  }

  const handleExit = () => {
    exitImpersonation();
  };

  const displayName =
    impersonationContext.targetUserName ||
    impersonationContext.targetUserEmail ||
    "User";

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#D7263D] text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <span className="font-semibold text-sm">
          🔍 Impersonating <strong>{displayName}</strong> — Admin mode active
        </span>
        <button
          onClick={handleExit}
          className="rounded-lg bg-white/20 px-4 py-1.5 text-sm font-semibold hover:bg-white/30 transition whitespace-nowrap"
        >
          Exit Impersonation
        </button>
      </div>
      {/* Spacer to prevent content from going under the banner */}
      <div className="h-[48px]" />
    </>
  );
}

