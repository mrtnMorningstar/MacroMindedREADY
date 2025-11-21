/**
 * Date utility functions to avoid duplication
 */

import type { Timestamp } from "firebase/firestore";

/**
 * Parse a Firestore timestamp or date-like value to a JavaScript Date
 */
export function parseFirestoreDate(
  date?: Timestamp | { seconds: number; nanoseconds: number } | Date | null
): Date | null {
  if (!date) return null;
  if (date instanceof Date) return date;
  if (typeof (date as Timestamp).toDate === "function") {
    return (date as Timestamp).toDate();
  }
  if (typeof (date as { seconds: number }).seconds === "number") {
    const value = date as { seconds: number; nanoseconds: number };
    return new Date(value.seconds * 1000 + Math.floor(value.nanoseconds / 1_000_000));
  }
  return null;
}

/**
 * Get timestamp in milliseconds for sorting
 */
export function getTimestampMillis(
  timestamp?: Timestamp | { seconds?: number; toMillis?: () => number } | null
): number {
  if (!timestamp) return 0;
  if (typeof timestamp.toMillis === "function") {
    return timestamp.toMillis();
  }
  if (typeof timestamp.seconds === "number") {
    return timestamp.seconds * 1000;
  }
  return 0;
}

