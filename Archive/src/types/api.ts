/**
 * Type definitions for API routes
 */

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  error: string;
  message?: string;
}

/**
 * Standard API success response
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message?: string;
  data?: T;
}

/**
 * Decoded Firebase ID token with custom claims
 */
export interface DecodedIdToken {
  uid: string;
  email?: string;
  admin?: boolean;
  [key: string]: unknown;
}

/**
 * Request body for creating user document
 */
export interface CreateUserDocumentRequest {
  displayName: string;
  referredBy?: string | null;
}

/**
 * Request body for submitting macro wizard
 */
export interface SubmitMacroWizardRequest {
  profile: {
    age?: string;
    height?: string;
    weight?: string;
    gender?: string;
    activityLevel?: string;
    goal?: string;
    allergies?: string;
    preferences?: string;
    dietaryRestrictions?: string;
  };
  estimatedMacros?: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  } | null;
}

/**
 * Request body for creating plan update request
 */
export interface CreatePlanUpdateRequestRequest {
  requestText: string;
}

/**
 * Request body for marking plan as delivered
 */
export interface MarkPlanDeliveredRequest {
  userId: string;
  email: string;
  mealPlanUrl?: string;
  name?: string;
}

