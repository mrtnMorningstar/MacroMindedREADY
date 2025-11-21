import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import type { DecodedIdToken, CreatePlanUpdateRequestRequest } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Secure API route to create a plan update request
 * 
 * Requirements:
 * - Only authenticated users can create their own plan update requests
 * - Validates requestText is a non-empty string
 * - Creates document in planUpdateRequests collection via Admin SDK
 */
export async function POST(request: Request) {
  let decodedToken: DecodedIdToken | undefined;
  
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
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken) as DecodedIdToken;
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json(
        { error: "Unauthorized. Invalid token." },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // Get request body
    const body = await request.json() as CreatePlanUpdateRequestRequest;
    const { requestText } = body;

    // Validate requestText
    if (!requestText || typeof requestText !== "string") {
      return NextResponse.json(
        { error: "Invalid request. 'requestText' is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    const trimmedText = requestText.trim();
    if (!trimmedText || trimmedText.length === 0) {
      return NextResponse.json(
        { error: "Invalid request. 'requestText' cannot be empty." },
        { status: 400 }
      );
    }

    // Validate requestText length (reasonable limit)
    if (trimmedText.length > 5000) {
      return NextResponse.json(
        { error: "Invalid request. 'requestText' is too long (max 5000 characters)." },
        { status: 400 }
      );
    }

    // Get admin database instance
    const adminDb = getAdminDb();

    // Verify user exists
    const userDocRef = adminDb.collection("users").doc(userId);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    // Create plan update request via Admin SDK
    const requestDocRef = adminDb.collection("planUpdateRequests").doc();
    await requestDocRef.set({
      userId,
      requestText: trimmedText,
      date: FieldValue.serverTimestamp(),
      handled: false,
    });

    return NextResponse.json({
      success: true,
      message: "Plan update request submitted successfully.",
      requestId: requestDocRef.id,
    });
  } catch (error) {
    console.error("Error in create-plan-update-request API:", error);

    // Capture error to Sentry
    Sentry.captureException(error, {
      tags: {
        route: "/api/user/create-plan-update-request",
        type: "user_error",
      },
      extra: {
        userId: decodedToken?.uid,
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

