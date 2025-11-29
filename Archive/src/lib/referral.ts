import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Generates a unique referral code based on the user's name
 * Format: PREFIX-RANDOM (e.g., MACRO-A83F)
 */
export function generateReferralCode(name: string): string {
  if (!name || typeof name !== "string") {
    // Fallback if name is invalid
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `MACRO-${random}`;
  }
  
  const firstPart = name.split(" ")[0] || name;
  const prefix = firstPart.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 6) || "MACRO";
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${random}`;
}

/**
 * Checks if a referral code already exists in Firestore
 */
export async function referralCodeExists(code: string): Promise<boolean> {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("referralCode", "==", code));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking referral code:", error);
    return false;
  }
}

/**
 * Generates a unique referral code that doesn't exist in Firestore
 */
export async function generateUniqueReferralCode(name: string): Promise<string> {
  try {
    let code = generateReferralCode(name);
    let attempts = 0;
    const maxAttempts = 10;

    while (await referralCodeExists(code) && attempts < maxAttempts) {
      code = generateReferralCode(name);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      // Fallback: add timestamp to ensure uniqueness
      const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
      const prefix = name && typeof name === "string" 
        ? (name.split(" ")[0] || name).toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 6) || "MACRO"
        : "MACRO";
      code = `${prefix}-${timestamp}`;
    }

    return code;
  } catch (error) {
    console.error("Error generating unique referral code:", error);
    // Ultimate fallback
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    return `MACRO-${timestamp}`;
  }
}

/**
 * Validates if a referral code exists in Firestore
 */
export async function validateReferralCode(code: string): Promise<boolean> {
  return await referralCodeExists(code);
}

