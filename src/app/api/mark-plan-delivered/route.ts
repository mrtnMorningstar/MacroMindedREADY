import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";
import { MealPlanDeliveredEmail } from "../../../../emails/meal-plan-delivered";
import { MealPlanStatus } from "@/types/status";
import type { DecodedIdToken, MarkPlanDeliveredRequest } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Secure API route to mark a meal plan as delivered
 * 
 * Requirements:
 * - Only admins can mark plans as delivered (verified via custom claims)
 * - Uses Firebase Admin SDK for secure Firestore writes
 * - Updates user document and purchase record
 * - Sends delivery email notification
 */
export async function POST(request: Request) {
  let decodedToken: DecodedIdToken | undefined;
  let body: MarkPlanDeliveredRequest | undefined;

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

    // Verify requester is admin via custom claims (NOT Firestore role field)
    if (!decodedToken.admin) {
      return NextResponse.json(
        { error: "Forbidden. Only admins can mark plans as delivered." },
        { status: 403 }
      );
    }

    // Parse request body
    body = await request.json() as MarkPlanDeliveredRequest;

    // Validate input
    const { userId, mealPlanUrl, name, email } = body;
    
    if (!userId || typeof userId !== "string" || !email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Missing required fields: userId and email are required." },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format." },
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

    // Prepare updates
    const updates: Record<string, unknown> = {
      mealPlanStatus: MealPlanStatus.DELIVERED,
      deliveredAt: FieldValue.serverTimestamp(),
      mealPlanDeliveredAt: FieldValue.serverTimestamp(),
    };
    if (mealPlanUrl && typeof mealPlanUrl === "string") {
      updates.mealPlanUrl = mealPlanUrl;
      updates.mealPlanFileURL = mealPlanUrl;
    }

    // Update user document via Admin SDK
    await userDocRef.update(updates);

    // Update purchase record
    try {
      const purchaseQuery = adminDb
        .collection("purchases")
        .where("userId", "==", userId)
        .where("status", "==", "paid")
        .orderBy("createdAt", "desc")
        .limit(1);
      
      const purchaseSnapshot = await purchaseQuery.get();
      const latestPurchase = purchaseSnapshot.docs[0];

      if (latestPurchase) {
        await latestPurchase.ref.update({
          status: "delivered",
          mealPlanUrl: mealPlanUrl ?? null,
          deliveredAt: FieldValue.serverTimestamp(),
        });
      } else {
        console.warn(`No pending purchase found for user ${userId}`);
      }
    } catch (purchaseError) {
      console.error("Failed to update purchase record:", purchaseError);
      // Log error but don't fail the request
    }

    // Send delivery email
    await sendEmail({
      to: email,
      subject: "Your Custom Meal Plan is Ready",
      react: MealPlanDeliveredEmail({
        name: name || undefined,
        mealPlanUrl: mealPlanUrl || undefined,
        dashboardUrl: process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
          : undefined,
      }),
    });

    return NextResponse.json({
      success: true,
      message: "Plan marked as delivered successfully.",
    });
  } catch (error) {
    console.error("Failed to mark plan as delivered:", error);
    
    return NextResponse.json(
      {
        error: "Internal server error.",
        message: error instanceof Error ? error.message : "Unknown error occurred.",
      },
      { status: 500 }
    );
  }
}


