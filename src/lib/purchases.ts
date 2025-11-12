import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp } from "firebase/firestore";
import { sendEmail } from "@/lib/email";

export async function createPurchase(userId: string, planType: string) {
  return await addDoc(collection(db, "purchases"), {
    userId,
    planType,
    status: "paid",
    mealPlanUrl: null,
    createdAt: Timestamp.now(),
    deliveredAt: null,
  });
}

export async function getActivePurchase(userId: string) {
  const q = query(
    collection(db, "purchases"),
    where("userId", "==", userId),
    where("status", "==", "paid")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs[0]?.data() || null;
}

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

