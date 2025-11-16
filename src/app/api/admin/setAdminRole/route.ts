import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Secure API route to set/remove admin role
 * 
 * Requirements:
 * - Only admins can call this route
 * - Sets Firebase custom claim (admin: true/false)
 * - Updates Firestore role field
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

    // Verify requester is admin in Firestore
    const adminDb = getAdminDb();
    const requesterDoc = await adminDb.collection("users").doc(requesterUid).get();
    
    if (!requesterDoc.exists) {
      return NextResponse.json(
        { error: "Unauthorized. User not found." },
        { status: 401 }
      );
    }

    const requesterData = requesterDoc.data();
    if (requesterData?.role !== "admin") {
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

    // Verify target user exists
    const targetUserDoc = await adminDb.collection("users").doc(uid).get();
    if (!targetUserDoc.exists) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    // Set Firebase custom claim
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

    // Update Firestore role field
    try {
      await adminDb.collection("users").doc(uid).update({
        role: makeAdmin ? "admin" : "member",
      });
    } catch (error) {
      console.error("Failed to update Firestore role:", error);
      // Note: Custom claim was set, but Firestore update failed
      // This is not ideal but the custom claim is the primary source of truth
      return NextResponse.json(
        { 
          error: "Custom claim updated but Firestore update failed.",
          warning: "Please refresh and try again."
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: makeAdmin
        ? "User has been granted admin access."
        : "Admin access has been removed from user.",
      uid,
      isAdmin: makeAdmin,
    });
  } catch (error) {
    console.error("Error in setAdminRole API:", error);
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

