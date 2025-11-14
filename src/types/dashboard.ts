"use client";

import type { Timestamp } from "firebase/firestore";

export const progressSteps = ["Not Started", "In Progress", "Delivered"] as const;
export type MealPlanStatus = (typeof progressSteps)[number];

export type Profile = {
  height?: string;
  weight?: string;
  age?: string;
  gender?: string;
  activityLevel?: string;
  goal?: string;
  dietaryRestrictions?: string;
  allergies?: string;
  preferences?: string;
};

export type UserDashboardData = {
  displayName?: string | null;
  packageTier?: string | null;
  mealPlanStatus?: MealPlanStatus | null;
  profile?: Profile | null;
  mealPlanFileURL?: string | null;
  mealPlanImageURLs?: string[] | null;
  mealPlanDeliveredAt?:
    | Timestamp
    | { seconds: number; nanoseconds: number }
    | Date
    | null;
  groceryListURL?: string | null;
  referralCode?: string | null;
  referralCredits?: number | null;
};

