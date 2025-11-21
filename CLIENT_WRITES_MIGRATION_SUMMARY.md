# Client-Side Firestore Writes Migration Summary

## Overview
Successfully migrated all direct client-side Firestore writes to secure server-side API routes using Firebase Admin SDK. This ensures proper validation, permission checks, and security.

## Changes Made

### 1. Created Secure API Routes

#### `/api/user/submit-macro-wizard`
- **Purpose**: Submit macro wizard data (profile and estimatedMacros)
- **Security**:
  - Requires authenticated user (Bearer token)
  - Validates profile fields are strings
  - Validates estimatedMacros are non-negative numbers
  - Only allows users to update their own data
- **Validation**: Comprehensive schema validation for all fields

#### `/api/user/create-plan-update-request`
- **Purpose**: Create plan update requests
- **Security**:
  - Requires authenticated user (Bearer token)
  - Validates requestText is non-empty string
  - Validates requestText length (max 5000 characters)
  - Only allows users to create their own requests
- **Validation**: Input sanitization and length limits

#### `/api/user/create-user-document`
- **Purpose**: Create initial user document during registration
- **Security**:
  - Requires authenticated user (Bearer token)
  - Validates email and displayName
  - Validates referral code if provided (prevents invalid codes)
  - Prevents self-referral
  - Only allows users to create their own document once
- **Validation**: Referral code verification, duplicate prevention

### 2. Updated Client-Side Code

#### `src/app/macro-wizard/page.tsx`
- **Before**: Direct Firestore `updateDoc` call
- **After**: Calls `/api/user/submit-macro-wizard` API route
- **Changes**:
  - Removed direct Firestore imports (`doc`, `updateDoc`, `db`)
  - Added authenticated API call with Bearer token
  - Improved error handling

#### `src/app/dashboard/page.tsx`
- **Before**: Direct Firestore `addDoc` call
- **After**: Calls `/api/user/create-plan-update-request` API route
- **Changes**:
  - Removed direct Firestore imports (`addDoc`, `collection`, `serverTimestamp`)
  - Added authenticated API call with Bearer token
  - Improved error handling

#### `src/app/(auth)/register/page.tsx`
- **Before**: Direct Firestore `setDoc` call with client-side referral code generation
- **After**: Calls `/api/user/create-user-document` API route
- **Changes**:
  - Removed direct Firestore imports (`setDoc`, `doc`, `serverTimestamp`)
  - Removed client-side referral code generation
  - Added authenticated API call with Bearer token
  - Server-side referral validation and code generation

### 3. Updated Firestore Security Rules

#### `firestore.rules`

##### `/users/{userId}`
- **Create**: Changed from `allow create: if isOwner(userId) && ...` to `allow create: if false`
  - All user document creation must go through `/api/user/create-user-document`
- **Update**: Changed from allowing users to update `profile`, `estimatedMacros`, `macroWizardCompleted` to `allow update: if false` for regular users
  - All profile/macro updates must go through `/api/user/submit-macro-wizard`
  - Admins can still update directly (though should use API routes for consistency)

##### `/planUpdateRequests/{requestId}`
- **Create**: Changed from `allow create: if isSignedIn() && ...` to `allow create: if false`
  - All plan update request creation must go through `/api/user/create-plan-update-request`

## Security Benefits

1. **Centralized Validation**: All validation logic is centralized in API routes
2. **Permission Checks**: Server-side permission checks ensure users can only modify their own data
3. **Input Sanitization**: All inputs are validated and sanitized before being written to Firestore
4. **Referral Code Security**: Referral codes are validated server-side, preventing invalid or self-referrals
5. **Audit Trail**: All writes go through API routes, making it easier to log and audit
6. **Schema Validation**: Comprehensive schema validation ensures data integrity

## API Route Patterns

All API routes follow this pattern:

```typescript
// 1. Verify authorization header
const authHeader = request.headers.get("authorization");
if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// 2. Verify ID token
const idToken = authHeader.replace("Bearer ", "");
const adminAuth = getAdminAuth();
const decodedToken = await adminAuth.verifyIdToken(idToken);

// 3. Validate input
// ... validation logic ...

// 4. Perform operation via Admin SDK
const adminDb = getAdminDb();
// ... Firestore operations ...

// 5. Return response
return NextResponse.json({ success: true });
```

## Client-Side API Call Pattern

All client-side code follows this pattern:

```typescript
// 1. Get ID token
const idToken = await user.getIdToken();

// 2. Call API route
const response = await fetch("/api/user/...", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${idToken}`,
  },
  body: JSON.stringify({ ... }),
});

// 3. Handle response
if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.error || "Request failed");
}
```

## Files Modified

### API Routes (New)
- `src/app/api/user/submit-macro-wizard/route.ts`
- `src/app/api/user/create-plan-update-request/route.ts`
- `src/app/api/user/create-user-document/route.ts`

### Client-Side Code
- `src/app/macro-wizard/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/(auth)/register/page.tsx`

### Security Rules
- `firestore.rules`

## Testing Checklist

- [ ] Macro wizard submission works correctly
- [ ] Plan update request creation works correctly
- [ ] User registration creates document correctly
- [ ] Referral code validation works
- [ ] Invalid referral codes are rejected
- [ ] Self-referral is prevented
- [ ] Direct Firestore writes are blocked by security rules
- [ ] Error handling works correctly for all API routes
- [ ] Authentication errors are handled properly

## Migration Notes

1. **Backward Compatibility**: All changes are backward compatible - existing functionality remains the same, but now goes through secure API routes
2. **Admin Operations**: Admin operations (like referral credit redemption) could also be migrated to API routes for consistency, but this was out of scope
3. **Firestore Rules**: The rules now deny direct client-side writes, forcing all operations through API routes
4. **Error Handling**: All API routes include comprehensive error handling and Sentry logging

## Next Steps (Optional)

1. Migrate admin operations (referral credit redemption, etc.) to API routes for consistency
2. Add rate limiting to API routes
3. Add request logging for audit trails
4. Add webhook notifications for critical operations (e.g., new plan update requests)

