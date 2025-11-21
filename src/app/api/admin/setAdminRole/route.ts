import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Secure API route to set/remove admin role
 * 
 * Requirements:
 * - Only admins can call this route (verified via custom claims)
 * - Sets Firebase custom claim (admin: true/false) - THIS IS THE SOURCE OF TRUTH
 * - Updates Firestore role field for DISPLAY purposes only (NOT used for authorization)
 */
export async function POST(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized. Missing or invalid authorization header." },
        { status: 401 }
      );
    }

    const idToken = authHeader.replace("Bearer ", "");

    // Verify the token and get the user
    const adminAuth = getAdminAuth();
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json(
        { error: "Unauthorized. Invalid token." },
        { status: 401 }
      );
    }

    const requesterUid = decodedToken.uid;

    // Verify requester is admin via custom claims (NOT Firestore role field)
    // This is the ONLY way to verify admin status for authorization
    if (!decodedToken.admin) {
      return NextResponse.json(
        { error: "Forbidden. Only admins can modify admin roles." },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { uid, makeAdmin } = body as { uid?: string; makeAdmin?: boolean };

    // Validate input
    if (!uid || typeof uid !== "string") {
      return NextResponse.json(
        { error: "Invalid request. 'uid' is required and must be a string." },
        { status: 400 }
      );
    }

    if (typeof makeAdmin !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request. 'makeAdmin' is required and must be a boolean." },
        { status: 400 }
      );
    }

    // Prevent self-demotion (safety check)
    if (uid === requesterUid && !makeAdmin) {
      return NextResponse.json(
        { error: "Cannot remove your own admin role." },
        { status: 400 }
      );
    }

    // Get admin database instance
    const adminDb = getAdminDb();

    // Verify target user exists
    const targetUserDoc = await adminDb.collection("users").doc(uid).get();
    if (!targetUserDoc.exists) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    // Set Firebase custom claim (THIS IS THE SOURCE OF TRUTH for authorization)
    try {
      await adminAuth.setCustomUserClaims(uid, {
        admin: makeAdmin,
      });
    } catch (error) {
      console.error("Failed to set custom claim:", error);
      return NextResponse.json(
        { error: "Failed to update custom claim." },
        { status: 500 }
      );
    }

    // Update Firestore role field (for DISPLAY purposes only, NOT used for authorization)
    try {
      await adminDb.collection("users").doc(uid).update({
        role: makeAdmin ? "admin" : "member",
      });
    } catch (error) {
      console.error("Failed to update Firestore role:", error);
      // Note: Custom claim was set successfully (this is the source of truth)
      // Firestore role field is only for display, so this is not critical
      // We continue even if Firestore update fails
    }

    // Force token refresh by revoking refresh tokens
    // This ensures the user gets a new token with updated custom claims immediately
    // Without this, users would need to wait for their token to expire or manually refresh
    try {
      await adminAuth.revokeRefreshTokens(uid);
      console.log(`Refresh tokens revoked for user ${uid} to force token refresh with updated claims`);
    } catch (error) {
      console.error("Failed to revoke refresh tokens:", error);
      // Note: Custom claims were updated successfully
      // Token refresh failure is not critical - user will get updated claims on next sign-in
      // But we log it for monitoring purposes
    }

    return NextResponse.json({
      success: true,
      message: makeAdmin
        ? "User has been granted admin access. Please sign out and sign back in to see changes."
        : "Admin access has been removed from user. Please sign out and sign back in to see changes.",
      uid,
      isAdmin: makeAdmin,
      tokenRefreshed: true,
    });
  } catch (error) {
    console.error("Error in setAdminRole API:", error);
    
    // Capture error to Sentry
    Sentry.captureException(error, {
      tags: {
        route: "/api/admin/setAdminRole",
        type: "admin_error",
      },
      extra: {
        requesterUid: decodedToken?.uid,
        targetUid: body?.uid,
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

