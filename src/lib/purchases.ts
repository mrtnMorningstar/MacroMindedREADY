import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp } from "firebase/firestore";
import { getTimestampMillis } from "./utils/date";

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

/**
 * Get the latest purchase for a user
 * 
 * Performance: Uses efficient query with orderBy and limit instead of fetching all purchases
 */
export async function getUserPurchase(userId: string) {
  try {
    // Use efficient query with orderBy and limit to get the latest purchase
    // This requires a composite index on (userId, createdAt) but is much more efficient
    const q = query(
      collection(db, "purchases"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    // Return the first (and only) result
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt,
    };
  } catch (error) {
    // If the query fails due to missing index, fall back to client-side sorting
    // This should be logged and the index should be created
    if (error instanceof Error && error.message.includes("index")) {
      console.warn(
        "Missing Firestore index for getUserPurchase. Falling back to client-side sorting. " +
        "Please create a composite index on purchases (userId, createdAt)."
      );
      
      // Fallback: fetch all purchases and sort in memory (less efficient)
      const q = query(
        collection(db, "purchases"),
        where("userId", "==", userId)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
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
        const aTime = getTimestampMillis(a.createdAt);
        const bTime = getTimestampMillis(b.createdAt);
        return bTime - aTime;
      });
      
      return purchases[0] || null;
    }
    
    // Re-throw unexpected errors
    throw error;
  }
}

