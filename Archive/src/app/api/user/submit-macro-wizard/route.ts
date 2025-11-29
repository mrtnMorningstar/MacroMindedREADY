import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import type { DecodedIdToken, SubmitMacroWizardRequest } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Secure API route to submit macro wizard data
 * 
 * Requirements:
 * - Only authenticated users can submit their own wizard data
 * - Validates profile and estimatedMacros schema
 * - Updates user document in Firestore via Admin SDK
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
    const body = await request.json() as SubmitMacroWizardRequest;
    const { profile, estimatedMacros } = body;

    // Validate profile data
    if (!profile || typeof profile !== "object") {
      return NextResponse.json(
        { error: "Invalid request. 'profile' is required and must be an object." },
        { status: 400 }
      );
    }

    // Validate profile fields are strings if provided
    const profileFields = [
      "age",
      "height",
      "weight",
      "gender",
      "activityLevel",
      "goal",
      "allergies",
      "preferences",
      "dietaryRestrictions",
    ];
    for (const field of profileFields) {
      if (field in profile && profile[field as keyof typeof profile] !== null && profile[field as keyof typeof profile] !== undefined) {
        if (typeof profile[field as keyof typeof profile] !== "string") {
          return NextResponse.json(
            { error: `Invalid request. Profile field '${field}' must be a string.` },
            { status: 400 }
          );
        }
      }
    }

    // Validate estimatedMacros if provided
    if (estimatedMacros !== null && estimatedMacros !== undefined) {
      if (typeof estimatedMacros !== "object") {
        return NextResponse.json(
          { error: "Invalid request. 'estimatedMacros' must be an object or null." },
          { status: 400 }
        );
      }

      const macroFields = ["calories", "protein", "carbs", "fats"];
      for (const field of macroFields) {
        if (field in estimatedMacros && estimatedMacros[field as keyof typeof estimatedMacros] !== null && estimatedMacros[field as keyof typeof estimatedMacros] !== undefined) {
          const value = estimatedMacros[field as keyof typeof estimatedMacros];
          if (typeof value !== "number" || isNaN(value) || value < 0) {
            return NextResponse.json(
              { error: `Invalid request. Macro field '${field}' must be a non-negative number.` },
              { status: 400 }
            );
          }
        }
      }
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

    // Prepare update data
    const updateData: Record<string, unknown> = {
      profile: {
        ...(profile.age !== undefined && { age: profile.age }),
        ...(profile.height !== undefined && { height: profile.height }),
        ...(profile.weight !== undefined && { weight: profile.weight }),
        ...(profile.gender !== undefined && { gender: profile.gender }),
        ...(profile.activityLevel !== undefined && { activityLevel: profile.activityLevel }),
        ...(profile.goal !== undefined && { goal: profile.goal }),
        ...(profile.allergies !== undefined && { allergies: profile.allergies }),
        ...(profile.preferences !== undefined && { preferences: profile.preferences }),
        ...(profile.dietaryRestrictions !== undefined && { dietaryRestrictions: profile.dietaryRestrictions }),
      },
      macroWizardCompleted: true,
    };

    if (estimatedMacros !== null && estimatedMacros !== undefined) {
      updateData.estimatedMacros = {
        ...(estimatedMacros.calories !== undefined && { calories: Math.round(estimatedMacros.calories) }),
        ...(estimatedMacros.protein !== undefined && { protein: Math.round(estimatedMacros.protein) }),
        ...(estimatedMacros.carbs !== undefined && { carbs: Math.round(estimatedMacros.carbs) }),
        ...(estimatedMacros.fats !== undefined && { fats: Math.round(estimatedMacros.fats) }),
      };
    } else {
      updateData.estimatedMacros = null;
    }

    // Update user document via Admin SDK
    await userDocRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: "Macro wizard data saved successfully.",
    });
  } catch (error) {
    console.error("Error in submit-macro-wizard API:", error);

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

