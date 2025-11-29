import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { generateUniqueReferralCode } from "@/lib/referral";
import type { DecodedIdToken, CreateUserDocumentRequest } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Secure API route to create initial user document
 * 
 * Requirements:
 * - Only authenticated users can create their own user document
 * - Validates email and displayName
 * - Validates referredBy code if provided
 * - Creates user document in Firestore via Admin SDK
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
    const userEmail = decodedToken.email;

    // Get request body
    const body = await request.json() as CreateUserDocumentRequest;
    const { displayName, referredBy } = body;

    // Validate displayName
    if (!displayName || typeof displayName !== "string") {
      return NextResponse.json(
        { error: "Invalid request. 'displayName' is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    const trimmedName = displayName.trim();
    if (!trimmedName || trimmedName.length === 0) {
      return NextResponse.json(
        { error: "Invalid request. 'displayName' cannot be empty." },
        { status: 400 }
      );
    }

    // Validate email from token matches
    if (!userEmail || typeof userEmail !== "string") {
      return NextResponse.json(
        { error: "Invalid request. User email is required." },
        { status: 400 }
      );
    }

    // Get admin database instance
    const adminDb = getAdminDb();

    // Check if user document already exists
    const userDocRef = adminDb.collection("users").doc(userId);
    const userDoc = await userDocRef.get();
    if (userDoc.exists) {
      return NextResponse.json(
        { error: "User document already exists." },
        { status: 400 }
      );
    }

    // Validate referredBy code if provided
    let validReferredBy: string | null = null;
    if (referredBy && typeof referredBy === "string" && referredBy.trim().length > 0) {
      const referralCode = referredBy.trim();
      
      // Verify referral code exists
      const referralQuery = await adminDb
        .collection("users")
        .where("referralCode", "==", referralCode)
        .limit(1)
        .get();
      
      if (referralQuery.empty) {
        return NextResponse.json(
          { error: "Invalid referral code." },
          { status: 400 }
        );
      }

      // Don't allow self-referral
      const referrerDoc = referralQuery.docs[0];
      if (referrerDoc.id === userId) {
        return NextResponse.json(
          { error: "Cannot use your own referral code." },
          { status: 400 }
        );
      }

      validReferredBy = referralCode;
    }

    // Generate unique referral code for the new user
    let userReferralCode: string;
    try {
      userReferralCode = await generateUniqueReferralCode(trimmedName);
    } catch (error) {
      console.error("Failed to generate referral code:", error);
      return NextResponse.json(
        { error: "Failed to generate referral code. Please try again." },
        { status: 500 }
      );
    }

    // Create user document via Admin SDK
    await userDocRef.set({
      email: userEmail,
      displayName: trimmedName,
      packageTier: null,
      role: "member",
      referralCode: userReferralCode,
      referredBy: validReferredBy,
      referralCredits: 0,
      createdAt: FieldValue.serverTimestamp(),
      macroWizardCompleted: false,
    });

    return NextResponse.json({
      success: true,
      message: "User document created successfully.",
      referralCode: userReferralCode,
    });
  } catch (error) {
    console.error("Error in create-user-document API:", error);

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

