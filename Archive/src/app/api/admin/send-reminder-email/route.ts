import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAdminAuth } from "@/lib/firebase-admin";
import { ReminderEmail } from "../../../../../emails/reminder-email";
import { MealPlanStatus } from "@/types/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin-only API route to send reminder emails
 * Authorization is verified via Firebase custom claims (NOT Firestore role field)
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

    // Verify the token and check admin status via custom claims
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
        { error: "Forbidden. Only admins can send reminder emails." },
        { status: 403 }
      );
    }

    const { userId, email, name } = await request.json();

    if (!email || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user data to personalize the email
    const userDoc = await getDoc(doc(db, "users", userId));
    const userData = userDoc.data();
    const packageTier = userData?.packageTier ?? "your plan";
    const mealPlanStatus = userData?.mealPlanStatus ?? MealPlanStatus.NOT_STARTED;

    await sendEmail({
      to: email,
      subject: "Reminder: Your MacroMinded Meal Plan",
      react: ReminderEmail({
        name: name || undefined,
        packageTier: packageTier || undefined,
        mealPlanStatus: mealPlanStatus || undefined,
        dashboardUrl: process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
          : undefined,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send reminder email:", error);
    
    return NextResponse.json(
      { error: "Failed to send reminder email" },
      { status: 500 }
    );
  }
}

