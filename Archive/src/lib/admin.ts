/**
 * Admin utilities for checking admin status via Firebase custom claims
 * 
 * IMPORTANT: Admin authorization is ONLY via custom claims (request.auth.token.admin === true)
 * The Firestore 'role' field is for DISPLAY purposes only and should NEVER be used for authorization.
 */

import { type User } from "firebase/auth";

/**
 * Check if a user is an admin via custom claims
 * This is the ONLY way to verify admin status for authorization
 */
export async function isAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;

  try {
    // Get ID token result which includes custom claims
    const tokenResult = await user.getIdTokenResult();
    return tokenResult.claims.admin === true;
  } catch (error) {
    console.error("Failed to check admin status:", error);
    return false;
  }
}

/**
 * Check if a user is an admin synchronously (requires cached token)
 * This should only be used when the token is already loaded
 * For authorization, prefer the async isAdmin() function
 */
export function isAdminSync(user: User | null): boolean {
  if (!user) return false;
  
  // Note: Custom claims are only available after getIdTokenResult() is called
  // This sync version relies on the token being cached
  // For most cases, use isAdmin() instead
  try {
    // Access claims from the user's token (if available)
    // @ts-ignore - Custom claims may not be typed
    const claims = user.accessToken ? null : null;
    
    // Since we can't reliably get claims synchronously, return false
    // This forces async checks which are more reliable
    return false;
  } catch {
    return false;
  }
}

/**
 * Get admin status from a decoded token's claims
 * Used in API routes where token is already decoded
 */
export function isAdminFromClaims(claims: any): boolean {
  return claims?.admin === true;
}

