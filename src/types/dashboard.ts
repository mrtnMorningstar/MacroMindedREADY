"use client";

import type { Timestamp } from "firebase/firestore";
import { MealPlanStatus, MEAL_PLAN_STATUSES } from "./status";

export const progressSteps = MEAL_PLAN_STATUSES;
export type MealPlanStatusType = MealPlanStatus;

export type Profile = {
  height?: string;
  weight?: string;
  age?: string;
  gender?: string;
  activityLevel?: string;
  goal?: string;
  dietaryRestrictions?: string;
  allergies?: string;
  likes?: string;
  dislikes?: string;
};

export type EstimatedMacros = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export type UserDashboardData = {
  displayName?: string | null;
  packageTier?: string | null;
  mealPlanStatus?: MealPlanStatusType | null;
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
  purchaseDate?:
    | Timestamp
    | { seconds: number; nanoseconds: number }
    | Date
    | null;
  createdAt?:
    | Timestamp
    | { seconds: number; nanoseconds: number }
    | Date
    | null;
  estimatedMacros?: EstimatedMacros | null;
  macroWizardCompleted?: boolean | null;
};

