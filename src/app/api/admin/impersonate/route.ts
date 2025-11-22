import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { Timestamp } from "firebase-admin/firestore";

import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Secure API route to generate one-time impersonation tokens
 * 
 * Requirements:
 * - Only admins can call this route (verified via custom claims)
 * - Generates cryptographically secure one-time token
 * - Stores token in Firestore with expiration (15 minutes)
 * - Token is single-use and tied to target user ID
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

    // Verify requester is admin via custom claims (NOT Firestore role field)
    if (!decodedToken.admin) {
      return NextResponse.json(
        { error: "Forbidden. Only admins can impersonate users." },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { targetUserId } = body as { targetUserId?: string };

    // Validate input
    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json(
        { error: "Invalid request. 'targetUserId' is required and must be a string." },
        { status: 400 }
      );
    }

    // Prevent self-impersonation (not necessary but good practice)
    if (targetUserId === decodedToken.uid) {
      return NextResponse.json(
        { error: "Cannot impersonate yourself." },
        { status: 400 }
      );
    }

    // Verify target user exists
    const adminDb = getAdminDb();
    const targetUserDoc = await adminDb.collection("users").doc(targetUserId).get();
    
    if (!targetUserDoc.exists) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    // Generate cryptographically secure one-time token
    const token = randomBytes(32).toString("hex");
    
    // Token expires in 15 minutes
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + 15 * 60 * 1000));

    // Store token in Firestore
    try {
      await adminDb.collection("impersonationTokens").doc(token).set({
        targetUserId,
        adminUserId: decodedToken.uid,
        expiresAt,
        used: false,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Failed to store impersonation token:", error);
      return NextResponse.json(
        { error: "Failed to generate impersonation token." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      token,
      expiresAt: expiresAt.toDate().toISOString(),
      message: "Impersonation token generated successfully.",
    });
  } catch (error) {
    console.error("Error in impersonate API:", error);
    
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

