/**
 * Impersonation utilities
 * 
 * Handles client-side impersonation context reading from cookies
 */

/**
 * Get impersonation context from cookies (client-side)
 * Note: This only works on the client side as cookies are not accessible in middleware on client
 * For server components, use the impersonation cookie directly
 */
export function getImpersonationFromCookie(): {
  targetUserId: string;
  adminUserId: string;
  targetUserName: string | null;
  targetUserEmail: string | null;
  impersonatedAt: string;
} | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const cookies = document.cookie.split("; ");
    const impersonationCookie = cookies.find((cookie) =>
      cookie.startsWith("impersonation=")
    );

    if (!impersonationCookie) {
      return null;
    }

    const value = impersonationCookie.split("=")[1];
    const decoded = decodeURIComponent(value);
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Failed to parse impersonation cookie:", error);
    return null;
  }
}

/**
 * Exit impersonation by redirecting with exit-impersonation query param
 * The middleware will handle clearing the cookie
 */
export function exitImpersonation() {
  if (typeof window === "undefined") {
    return;
  }

  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set("exit-impersonation", "true");
  window.location.href = currentUrl.toString();
}

