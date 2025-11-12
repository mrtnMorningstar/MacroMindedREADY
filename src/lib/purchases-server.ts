import { db } from "@/lib/firebase";
import { updateDoc, doc, Timestamp } from "firebase/firestore";
import { sendEmail } from "@/lib/email";

export async function deliverMealPlan(
  purchaseId: string,
  mealPlanUrl: string,
  userEmail: string
) {
  await updateDoc(doc(db, "purchases", purchaseId), {
    status: "delivered",
    mealPlanUrl,
    deliveredAt: Timestamp.now(),
  });

  await sendEmail({
    to: userEmail,
    subject: "Your Custom Meal Plan is Ready",
    html: `
      <h2>Your Plan Is Ready</h2>
      <p>You can access it inside your dashboard.</p>
      <a href="${mealPlanUrl}">Open Meal Plan</a>
    `,
  });
}

