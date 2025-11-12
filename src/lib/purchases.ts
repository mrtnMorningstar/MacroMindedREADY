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
  const q = query(
    collection(db, "purchases"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(1)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs[0]?.data() || null;
}

