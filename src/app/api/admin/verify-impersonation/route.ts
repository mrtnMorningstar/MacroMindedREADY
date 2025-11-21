import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import * as Sentry from "@sentry/nextjs";

import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * API route to verify and consume impersonation tokens
 * Called by middleware to validate tokens
 */
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

    const adminDb = getAdminDb();
    const tokenDoc = await adminDb.collection("impersonationTokens").doc(token).get();

    if (!tokenDoc.exists) {
      return NextResponse.json(
        { error: "Invalid token." },
        { status: 401 }
      );
    }

    const tokenData = tokenDoc.data();
    
    // Check if token has been used
    if (tokenData?.used === true) {
      return NextResponse.json(
        { error: "Token has already been used." },
        { status: 401 }
      );
    }

    // Check if token has expired
    const expiresAt = tokenData?.expiresAt;
    if (!expiresAt) {
      return NextResponse.json(
        { error: "Invalid token data." },
        { status: 401 }
      );
    }

    const expirationTime = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
    if (expirationTime < new Date()) {
      // Clean up expired token
      await adminDb.collection("impersonationTokens").doc(token).delete();
      return NextResponse.json(
        { error: "Token has expired." },
        { status: 401 }
      );
    }

    // Mark token as used (one-time use)
    await adminDb.collection("impersonationTokens").doc(token).update({
      used: true,
      usedAt: Timestamp.now(),
    });

    // Get target user data for context
    const targetUserDoc = await adminDb.collection("users").doc(tokenData.targetUserId).get();
    const targetUserData = targetUserDoc.data();

    return NextResponse.json({
      success: true,
      targetUserId: tokenData.targetUserId,
      adminUserId: tokenData.adminUserId,
      targetUserEmail: targetUserData?.email || null,
      targetUserName: targetUserData?.displayName || null,
    });
  } catch (error) {
    console.error("Error in verify-impersonation API:", error);
    
    // Capture error to Sentry
    Sentry.captureException(error, {
      tags: {
        route: "/api/admin/verify-impersonation",
        type: "admin_error",
      },
    });
    
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

