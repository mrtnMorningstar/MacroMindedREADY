import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Generates a unique referral code based on the user's name
 * Format: PREFIX-RANDOM (e.g., MACRO-A83F)
 */
export function generateReferralCode(name: string): string {
  const prefix = name.split(" ")[0].toUpperCase();
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
    code = `${name.split(" ")[0].toUpperCase()}-${timestamp}`;
  }

  return code;
}

/**
 * Validates if a referral code exists in Firestore
 */
export async function validateReferralCode(code: string): Promise<boolean> {
  return await referralCodeExists(code);
}

