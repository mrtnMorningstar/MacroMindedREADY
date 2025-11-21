import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Middleware
 * 
 * IMPORTANT: Middleware runs in Edge Runtime, which doesn't support Firebase Admin SDK
 * Impersonation token verification is handled client-side via API routes
 * 
 * This middleware only handles:
 * - Exit impersonation query param (cookie cleanup)
 * - Impersonation token redirects (verification happens client-side)
 */
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // Check for impersonation token in query parameters
  // Token verification will happen client-side via API route
  // We just need to preserve the token for client-side handling
  const impersonateToken = searchParams.get("impersonate");
  
  if (impersonateToken) {
    // Redirect to API route for token verification
    // The API route will handle verification and cookie setting
    const apiUrl = new URL("/api/admin/verify-impersonation", request.url);
    apiUrl.searchParams.set("token", impersonateToken);
    apiUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
    return NextResponse.redirect(apiUrl);
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

