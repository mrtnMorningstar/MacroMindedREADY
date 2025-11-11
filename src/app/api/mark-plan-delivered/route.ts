import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { userId, mealPlanUrl, name, email } = await request.json();

    if (!userId || !email) {
      return new Response("Missing required fields", { status: 400 });
    }

    const updates: Record<string, unknown> = {
      mealPlanStatus: "Delivered",
      deliveredAt: serverTimestamp(),
    };
    if (mealPlanUrl) {
      updates.mealPlanUrl = mealPlanUrl;
      updates.mealPlanFileURL = mealPlanUrl;
    }
    updates.mealPlanDeliveredAt = serverTimestamp();

    await updateDoc(doc(db, "users", userId), updates);

    try {
      const purchaseQuery = query(
        collection(db, "purchases"),
        where("userId", "==", userId),
        where("status", "==", "paid"),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      const snapshot = await getDocs(purchaseQuery);
      const latestPurchase = snapshot.docs[0];

      if (latestPurchase) {
        await updateDoc(latestPurchase.ref, {
          status: "delivered",
          mealPlanUrl: mealPlanUrl ?? null,
          deliveredAt: serverTimestamp(),
        });
      } else {
        console.warn(`No pending purchase found for user ${userId}`);
      }
    } catch (purchaseError) {
      console.error("Failed to update purchase record:", purchaseError);
    }

    const greeting = name ? `<p>Hi ${name},</p>` : "";
    const planLink = mealPlanUrl
      ? `<p><a href="${mealPlanUrl}" style="color:#D7263D; font-weight:bold;">View Your Meal Plan</a></p>`
      : "<p>Log into your MacroMinded dashboard to download your meal plan.</p>";

    await sendEmail({
      to: email,
      subject: "Your Custom Meal Plan is Ready",
      html: `
        <h2 style="font-weight:600; color:#111;">Your Plan Is Ready</h2>
        ${greeting}
        <p>Your personalized meal plan has been completed based on your metrics and goals.</p>
        <p>You can access it here:</p>
        ${planLink}
        <p>Follow the guidance consistently. Progress will follow.</p>
        <br>
        <p>Respectfully,<br><strong>MacroMinded</strong></p>
      `,
    });

    return new Response("OK");
  } catch (error) {
    console.error("Failed to mark plan as delivered:", error);
    return new Response("Failed to mark plan as delivered", { status: 500 });
  }
}


