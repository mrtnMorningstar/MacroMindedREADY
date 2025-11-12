import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp } from "firebase/firestore";

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

export async function getUserPurchase(userId: string) {
  try {
    // Try to get the latest purchase with ordering (requires index)
    const q = query(
      collection(db, "purchases"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0]?.data() || null;
    }
  } catch (error: unknown) {
    // If index doesn't exist, fall back to getting any purchase
    console.warn("Ordered query failed, falling back to simple query:", error);
  }
  
  // Fallback: get any purchase for this user (no ordering required)
  const fallbackQuery = query(
    collection(db, "purchases"),
    where("userId", "==", userId),
    limit(1)
  );
  const fallbackSnapshot = await getDocs(fallbackQuery);
  return fallbackSnapshot.docs[0]?.data() || null;
}

