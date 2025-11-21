import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

/**
 * Next.js Middleware
 * 
 * Handles:
 * - Impersonation token verification and cookie setting
 * - Token validation from query parameter
 */
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // Check for impersonation token in query parameters
  const impersonateToken = searchParams.get("impersonate");
  
  if (impersonateToken) {
    try {
      // Verify token directly in middleware (server-side)
      const adminDb = getAdminDb();
      const tokenDoc = await adminDb.collection("impersonationTokens").doc(impersonateToken).get();

      if (!tokenDoc.exists) {
        // Invalid token - redirect to dashboard
        const dashboardUrl = new URL("/dashboard", request.url);
        dashboardUrl.searchParams.set("error", "invalid_impersonation_token");
        return NextResponse.redirect(dashboardUrl);
      }

      const tokenData = tokenDoc.data();
      
      // Check if token has been used
      if (tokenData?.used === true) {
        const dashboardUrl = new URL("/dashboard", request.url);
        dashboardUrl.searchParams.set("error", "token_already_used");
        return NextResponse.redirect(dashboardUrl);
      }

      // Check if token has expired
      const expiresAt = tokenData?.expiresAt;
      if (!expiresAt) {
        const dashboardUrl = new URL("/dashboard", request.url);
        dashboardUrl.searchParams.set("error", "invalid_token_data");
        return NextResponse.redirect(dashboardUrl);
      }

      const expirationTime = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
      if (expirationTime < new Date()) {
        // Clean up expired token
        await adminDb.collection("impersonationTokens").doc(impersonateToken).delete();
        const dashboardUrl = new URL("/dashboard", request.url);
        dashboardUrl.searchParams.set("error", "token_expired");
        return NextResponse.redirect(dashboardUrl);
      }

      // Mark token as used (one-time use)
      await adminDb.collection("impersonationTokens").doc(impersonateToken).update({
        used: true,
        usedAt: Timestamp.now(),
      });

      // Get target user data for context
      const targetUserDoc = await adminDb.collection("users").doc(tokenData.targetUserId).get();
      const targetUserData = targetUserDoc.data();

      // Create redirect URL without impersonate query param
      const redirectUrl = new URL(pathname, request.url);
      redirectUrl.search = searchParams.toString();
      redirectUrl.searchParams.delete("impersonate");
      
      // Create response with redirect
      const response = NextResponse.redirect(redirectUrl);
      
      // Set secure cookie with impersonation context
      // Cookie is readable by client (not httpOnly) so banner component can display it
      // Cookie expires in 1 hour (3600 seconds)
      // Security: The token is already validated and consumed (one-time use)
      response.cookies.set("impersonation", JSON.stringify({
        targetUserId: tokenData.targetUserId,
        adminUserId: tokenData.adminUserId,
        targetUserName: targetUserData?.displayName || null,
        targetUserEmail: targetUserData?.email || null,
        impersonatedAt: new Date().toISOString(),
      }), {
        httpOnly: false, // Readable by client for banner display
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 3600, // 1 hour
        path: "/",
      });
      
      return response;
    } catch (error) {
      console.error("Error in middleware impersonation handling:", error);
      
      // Redirect to dashboard on error
      const dashboardUrl = new URL("/dashboard", request.url);
      dashboardUrl.searchParams.set("error", "impersonation_error");
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Check for exit impersonation query param
  const exitImpersonation = searchParams.get("exit-impersonation");
  if (exitImpersonation === "true") {
    const redirectUrl = new URL(pathname, request.url);
    redirectUrl.search = searchParams.toString();
    redirectUrl.searchParams.delete("exit-impersonation");
    
    const response = NextResponse.redirect(redirectUrl);
    
    // Clear impersonation cookie
    response.cookies.delete("impersonation");
    
    return response;
  }

  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (except our verify endpoint which we call internally)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
};

