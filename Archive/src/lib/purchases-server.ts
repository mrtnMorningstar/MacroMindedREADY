import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";
import { MealPlanDeliveredEmail } from "../../emails/meal-plan-delivered";

/**
 * Server-side function to deliver a meal plan
 * 
 * Requirements:
 * - Uses Firebase Admin SDK for secure Firestore writes
 * - Updates purchase record with delivery information
 * - Sends delivery email notification
 * - Properly handles errors
 */
export async function deliverMealPlan(
  purchaseId: string,
  mealPlanUrl: string,
  userEmail: string,
  userName?: string
): Promise<void> {
  try {
    const adminDb = getAdminDb();
    
    // Validate inputs
    if (!purchaseId || typeof purchaseId !== "string") {
      throw new Error("Invalid purchaseId");
    }
    if (!userEmail || typeof userEmail !== "string") {
      throw new Error("Invalid userEmail");
    }
    if (!mealPlanUrl || typeof mealPlanUrl !== "string") {
      throw new Error("Invalid mealPlanUrl");
    }

    // Verify purchase exists
    const purchaseDocRef = adminDb.collection("purchases").doc(purchaseId);
    const purchaseDoc = await purchaseDocRef.get();
    
    if (!purchaseDoc.exists) {
      throw new Error(`Purchase ${purchaseId} not found`);
    }

    // Update purchase record via Admin SDK
    await purchaseDocRef.update({
      status: "delivered",
      mealPlanUrl,
      deliveredAt: FieldValue.serverTimestamp(),
    });

    // Send delivery email
    await sendEmail({
      to: userEmail,
      subject: "Your Custom Meal Plan is Ready",
      react: MealPlanDeliveredEmail({
        name: userName || undefined,
        mealPlanUrl: mealPlanUrl || undefined,
        dashboardUrl: process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
          : undefined,
      }),
    });
  } catch (error) {
    // Log error
    console.error("Failed to deliver meal plan:", error);
    throw error;
  }
}

