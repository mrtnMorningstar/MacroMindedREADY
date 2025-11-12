import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, Timestamp } from "firebase/firestore";

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
  // Get all purchases for this user (no ordering to avoid index requirement)
  const q = query(
    collection(db, "purchases"),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  // Sort in memory to get the latest purchase
  const purchases = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt,
    };
  });
  
  // Sort by createdAt descending (latest first)
  purchases.sort((a, b) => {
    const aCreatedAt = a.createdAt as { toMillis?: () => number; seconds?: number } | undefined;
    const bCreatedAt = b.createdAt as { toMillis?: () => number; seconds?: number } | undefined;
    const aTime = aCreatedAt?.toMillis?.() ?? aCreatedAt?.seconds ?? 0;
    const bTime = bCreatedAt?.toMillis?.() ?? bCreatedAt?.seconds ?? 0;
    return bTime - aTime;
  });
  
  return purchases[0] || null;
}

