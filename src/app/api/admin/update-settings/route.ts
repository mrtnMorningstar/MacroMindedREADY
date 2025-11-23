import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Secure API route to update admin settings
 * 
 * Requirements:
 * - Only admins can call this route (verified via custom claims)
 * - Saves settings to Firestore document: adminSettings/global
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

    // Verify requester is admin via custom claims
    if (!decodedToken.admin) {
      return NextResponse.json(
        { error: "Forbidden. Only admins can update settings." },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "Invalid request. 'settings' is required and must be an object." },
        { status: 400 }
      );
    }

    // Validate settings structure - only allow specific keys
    const validKeys = [
      "brandName",
      "accentColor",
      "timezone",
      "currency",
      "dateFormat",
      "adminEmail",
      "emailAlerts",
      "taxEnabled",
      "taxRate",
      "impersonationEnabled",
      "sessionTimeout",
      "stripeWebhookLastSuccess",
    ];

    const filteredSettings: Record<string, any> = {};
    for (const key of validKeys) {
      if (key in settings) {
        filteredSettings[key] = settings[key];
      }
    }

    // Add metadata
    filteredSettings.updatedAt = new Date();
    filteredSettings.updatedBy = decodedToken.uid;

    // Get admin database instance
    const adminDb = getAdminDb();

    // Save to Firestore
    await adminDb.collection("adminSettings").doc("global").set(filteredSettings, { merge: true });

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating admin settings:", error);
    return NextResponse.json(
      {
        error: "Internal server error.",
        message: error instanceof Error ? error.message : "Failed to update settings",
      },
      { status: 500 }
    );
  }
}


