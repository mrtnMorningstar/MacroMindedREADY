# Admin Authorization Refactor Summary

## Overview
Refactored the entire codebase to use Firebase Custom Claims (`request.auth.token.admin === true`) for admin authorization instead of Firestore document fields (`role === "admin"`).

**Key Principle**: The Firestore `role` field is now **display-only** and **NEVER used for authorization**. All authorization checks use Firebase Custom Claims.

---

## Changes Made

### 1. New Admin Utility Library
**File**: `src/lib/admin.ts` (NEW)
- Created helper functions to check admin status via custom claims
- `isAdmin(user: User): Promise<boolean>` - Main async function
- `isAdminFromClaims(claims: any): boolean` - For API routes with decoded tokens

### 2. AuthContext Updates
**File**: `src/context/AuthContext.tsx`
- Added `isAdmin: boolean` to context value
- Added `loadingAdmin: boolean` state
- Now checks admin status via custom claims when user changes
- Firestore `role` field still loaded but not used for authorization

### 3. RequireAdmin Component
**File**: `src/components/auth/RequireAdmin.tsx`
- **Before**: Checked `userDoc.role === "admin"` from Firestore
- **After**: Uses `isAdmin(user)` which checks custom claims
- No longer depends on Firestore document loading for admin check

### 4. API Routes

#### setAdminRole Route
**File**: `src/app/api/admin/setAdminRole/route.ts`
- **Before**: Verified admin status by checking Firestore document `requesterData?.role !== "admin"`
- **After**: Checks `decodedToken.admin === true` (custom claims)
- Still updates Firestore `role` field for display purposes
- Updated comments to clarify authorization source

#### send-reminder-email Route
**File**: `src/app/api/admin/send-reminder-email/route.ts`
- **Added**: Admin authorization check via custom claims
- Now requires valid ID token with `admin: true` in claims
- Previously had no authorization check (security issue fixed)

### 5. Client Components

#### Navbar
**File**: `src/components/Navbar.tsx`
- **Before**: Checked admin via Firestore document query
- **After**: Uses `isAdmin` from `useAuth()` context (which uses custom claims)
- Simplified code by using shared context state

#### AuthGate
**File**: `src/components/AuthGate.tsx`
- **Before**: Checked admin via `userDoc.role === "admin"`
- **After**: Uses `isAdmin(user)` helper function (custom claims)
- Now properly async for admin checks

#### useUser Hook
**File**: `src/hooks/useUser.ts`
- **Before**: Checked admin via `userDoc.role === "admin"`
- **After**: Uses `isAdmin(user)` helper function (custom claims)
- Updated comments to clarify role field is display-only

### 6. Admin Pages

#### Admin User Detail Page
**File**: `src/app/admin/users/[userId]/page.tsx`
- **Before**: Checked admin via Firestore document `adminDoc.data()?.role === "admin"`
- **After**: Uses `isAdmin(currentUser)` helper (custom claims)

#### Manage Admins Page
**File**: `src/app/admin/manage-admins/page.tsx`
- **Before**: Direct Firestore write: `updateDoc(doc(db, "users", userId), { role: newRole })`
- **After**: Uses API route `/api/admin/setAdminRole` which updates both custom claims AND Firestore
- Role field still used for display/filtering (display-only)

#### Client Detail Slideover
**File**: `src/components/admin/ClientDetailSlideover.tsx`
- **Before**: Direct Firestore write for role changes
- **After**: Uses API route `/api/admin/setAdminRole` for role changes
- Ensures custom claims are updated when role changes

### 7. Display-Only Role Filtering

The following pages still use the `role` field for filtering/display purposes (NOT authorization):
- `src/app/admin/page.tsx` - Filters out admins from user list
- `src/app/admin/wizard/page.tsx` - Filters out admins
- `src/app/admin/referrals/page.tsx` - Filters out admins
- `src/app/admin/requests/page.tsx` - Filters out admins
- `src/app/admin/users/page.tsx` - Filters out admins
- `src/app/admin/clients/page.tsx` - Filters out admins
- `src/app/admin/manage-admins/page.tsx` - Filters by role for display
- `src/components/admin/DashboardSummary.tsx` - Filters out admins

**All of these have comments clarifying that the role field is display-only and NOT used for authorization.**

---

## Security Improvements

1. **Single Source of Truth**: Admin authorization now comes from Firebase Custom Claims, which are:
   - Server-side controlled
   - Cannot be manipulated by clients
   - Included in ID tokens
   - Verified on both client and server

2. **API Route Protection**: All admin API routes now verify admin status via custom claims from the ID token

3. **No Client-Side Manipulation**: Clients can no longer modify their admin status by manipulating Firestore documents

4. **Consistent Authorization**: All admin checks use the same mechanism (custom claims)

---

## Migration Notes

### For Existing Admins
Existing admin users need to have custom claims set. This can be done via:
1. The `/api/admin/setAdminRole` API route (requires an existing admin)
2. The `scripts/setAdmin.ts` script
3. Firebase Admin SDK directly

### For Firestore Rules
The Firestore rules already use custom claims (`request.auth.token.admin == true`), so no changes needed there.

### For Storage Rules
The Storage rules already use custom claims (`request.auth.token.admin == true`), so no changes needed there.

---

## Files Modified

### New Files
- `src/lib/admin.ts` - Admin utility functions

### Modified Files
1. `src/context/AuthContext.tsx`
2. `src/components/auth/RequireAdmin.tsx`
3. `src/components/Navbar.tsx`
4. `src/components/AuthGate.tsx`
5. `src/hooks/useUser.ts`
6. `src/app/api/admin/setAdminRole/route.ts`
7. `src/app/api/admin/send-reminder-email/route.ts`
8. `src/app/admin/users/[userId]/page.tsx`
9. `src/app/admin/manage-admins/page.tsx`
10. `src/components/admin/ClientDetailSlideover.tsx`
11. `src/app/admin/page.tsx` (comments only)
12. `src/app/admin/wizard/page.tsx` (comments only)
13. `src/app/admin/referrals/page.tsx` (comments only)
14. `src/app/admin/requests/page.tsx` (comments only)
15. `src/app/admin/users/page.tsx` (comments only)
16. `src/app/admin/clients/page.tsx` (comments only)
17. `src/components/admin/DashboardSummary.tsx` (comments only)

---

## Testing Checklist

- [ ] Admin pages are accessible only to users with `admin: true` custom claim
- [ ] Non-admin users are redirected from admin pages
- [ ] Admin API routes require valid admin token
- [ ] Admin role changes via API route update both custom claims and Firestore
- [ ] Firestore `role` field is still visible/editable for display purposes
- [ ] User filtering by role still works for display purposes
- [ ] All admin checks use custom claims, not Firestore role field

---

## Breaking Changes

**None** - This is a security enhancement. Existing functionality should continue to work, but now uses more secure authorization methods.

---

## Future Considerations

1. Consider removing the Firestore `role` field entirely if it's only used for display (though it's currently useful for filtering)
2. Add admin status caching to reduce ID token refreshes
3. Consider adding admin status to the user object in AuthContext for easier access


