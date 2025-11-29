/**
 * Meal plan status enum
 * Used throughout the application to track meal plan delivery status
 */
export enum MealPlanStatus {
  NOT_STARTED = "Not Started",
  IN_PROGRESS = "In Progress",
  DELIVERED = "Delivered",
}

/**
 * Array of all meal plan status values (in order)
 */
export const MEAL_PLAN_STATUSES = [
  MealPlanStatus.NOT_STARTED,
  MealPlanStatus.IN_PROGRESS,
  MealPlanStatus.DELIVERED,
] as const;

/**
 * Type for meal plan status values
 */
export type MealPlanStatusValue = MealPlanStatus | string;

