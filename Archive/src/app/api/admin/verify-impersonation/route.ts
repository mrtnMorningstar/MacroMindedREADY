import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { Timestamp } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * API route to verify and consume impersonation tokens
 * Can be called via GET (from middleware) or POST (from client)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const redirect = searchParams.get("redirect") || "/dashboard";

  if (!token || typeof token !== "string") {
    const redirectUrl = new URL(redirect, request.url);
    redirectUrl.searchParams.delete("impersonate"); // Remove impersonate param
    redirectUrl.searchParams.set("error", "invalid_impersonation_token");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const result = await verifyAndConsumeToken(token);
    
    if (!result.success) {
      const redirectUrl = new URL(redirect, request.url);
      redirectUrl.searchParams.delete("impersonate"); // Remove impersonate param
      redirectUrl.searchParams.set("error", result.error || "invalid_token");
      return NextResponse.redirect(redirectUrl);
    }

    // Create redirect URL and strip impersonate/error params to prevent redirect loop
    const redirectUrl = new URL(redirect, request.url);
    redirectUrl.searchParams.delete("impersonate");
    redirectUrl.searchParams.delete("error");
    
    // Create response with redirect
    const response = NextResponse.redirect(redirectUrl);
    
    // Set secure cookie with impersonation context
    response.cookies.set("impersonation", JSON.stringify({
      targetUserId: result.targetUserId,
      adminUserId: result.adminUserId,
      targetUserName: result.targetUserName || null,
      targetUserEmail: result.targetUserEmail || null,
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
    console.error("Error in verify-impersonation API:", error);
    
    const redirectUrl = new URL(redirect, request.url);
    redirectUrl.searchParams.delete("impersonate"); // Remove impersonate param
    redirectUrl.searchParams.set("error", "impersonation_error");
    return NextResponse.redirect(redirectUrl);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body as { token?: string };

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Invalid request. Token is required." },
        { status: 400 }
      );
    }

    const result = await verifyAndConsumeToken(token);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Invalid token." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      targetUserId: result.targetUserId,
      adminUserId: result.adminUserId,
      targetUserEmail: result.targetUserEmail || null,
      targetUserName: result.targetUserName || null,
    });
  } catch (error) {
    console.error("Error in verify-impersonation API:", error);
    
    return NextResponse.json(
      {
        error: "Internal server error.",
        message:
          error instanceof Error ? error.message : "Unknown error occurred.",
      },
      { status: 500 }
    );
  }
}

/**
 * Shared function to verify and consume impersonation token
 */
async function verifyAndConsumeToken(token: string): Promise<{
  success: boolean;
  error?: string;
  targetUserId?: string;
  adminUserId?: string;
  targetUserName?: string | null;
  targetUserEmail?: string | null;
}> {
  try {

    const adminDb = getAdminDb();
    const tokenDoc = await adminDb.collection("impersonationTokens").doc(token).get();

    if (!tokenDoc.exists) {
      return { success: false, error: "Invalid token." };
    }

    const tokenData = tokenDoc.data();
    
    // Check if token has been used
    if (tokenData?.used === true) {
      return { success: false, error: "Token has already been used." };
    }

    // Check if token has expired
    const expiresAt = tokenData?.expiresAt;
    if (!expiresAt) {
      return { success: false, error: "Invalid token data." };
    }

    const expirationTime = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
    if (expirationTime < new Date()) {
      // Clean up expired token
      await adminDb.collection("impersonationTokens").doc(token).delete();
      return { success: false, error: "Token has expired." };
    }

    // Mark token as used (one-time use)
    await adminDb.collection("impersonationTokens").doc(token).update({
      used: true,
      usedAt: Timestamp.now(),
    });

    // Get target user data for context
    const targetUserDoc = await adminDb.collection("users").doc(tokenData.targetUserId).get();
    const targetUserData = targetUserDoc.data();

    return {
      success: true,
      targetUserId: tokenData.targetUserId,
      adminUserId: tokenData.adminUserId,
      targetUserEmail: targetUserData?.email || null,
      targetUserName: targetUserData?.displayName || null,
    };
  } catch (error) {
    console.error("Error verifying impersonation token:", error);
    return { success: false, error: "Internal server error." };
  }
}

