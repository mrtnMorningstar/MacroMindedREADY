# MacroMinded Ready - Technical Summary

## Framework & Architecture

**Next.js 16.0.1** with **App Router**
- React 19.2.0
- TypeScript 5.x (strict mode)
- Path aliases: `@/*` → `./src/*`
- Webpack build system (explicit `--webpack` flag)

## Dependencies & Libraries

### Core
- **next**: 16.0.1
- **react**: 19.2.0
- **react-dom**: 19.2.0
- **typescript**: ^5

### UI & Styling
- **tailwindcss**: ^4 (PostCSS 4)
- **framer-motion**: ^12.23.24 (animations)
- **@heroicons/react**: ^2.2.0 (icons)

### Backend & Database
- **firebase**: ^12.5.0 (client SDK)
- **firebase-admin**: ^12.5.0 (server SDK)
- **stripe**: ^19.3.0 (payments)

### Utilities
- **dayjs**: ^1.11.19 (date handling)
- **recharts**: ^3.4.1 (charts)
- **@sendgrid/mail**: ^8.1.6 (email)
- **resend**: ^3.0.0 (alternative email)

### Dev Tools
- **eslint**: ^9 with eslint-config-next
- **firebase-tools**: ^14.24.2
- **ts-node**: ^10.9.2

## Styling Setup

### Tailwind CSS 4
- **Config**: Inline theme in `globals.css` (no separate config file)
- **PostCSS**: `@tailwindcss/postcss` plugin
- **Custom Properties**:
  ```css
  --background: #000000
  --foreground: #f5f5f5
  --muted: #1a1a1a
  --accent: #d7263d (brand red)
  --border: #262626
  ```

### Typography
- **Sans**: Geist (variable: `--font-geist-sans`)
- **Display**: Anton (variable: `--font-anton`) - uppercase headings
- **Mono**: Geist Mono (variable: `--font-geist-mono`)

### Color Palette
- **Background**: Black (#000000)
- **Foreground**: Off-white (#f5f5f5)
- **Accent**: Red (#D7263D) - primary brand color
- **Neutral tones**: Dark grays (800-900) for cards/borders
- **Theme**: Dark mode only (no light mode toggle)

### Global CSS (`src/app/globals.css`)
- Custom scrollbar styling (dark theme)
- Box-sizing reset
- Custom CSS variables for theme tokens
- Font family configuration

## Layout Structure

### Root Layout (`src/app/layout.tsx`)
```typescript
<ErrorBoundaryWrapper>
  <AppProvider>
    <ToastProvider>
      <ConditionalLayout navbar={<Navbar />} footer={<Footer />}>
        <ImpersonationBanner />
        {children}
      </ConditionalLayout>
    </ToastProvider>
  </AppProvider>
</ErrorBoundaryWrapper>
```

**ConditionalLayout** (`src/components/ConditionalLayout.tsx`):
- Admin routes (`/admin/*`): Renders children directly (no Navbar/Footer)
- Regular routes: Wraps with Navbar, Footer, PageTransition

### Admin Layout (`src/app/admin/layout.tsx`)
- Wraps all `/admin/*` routes
- Uses `RequireAdmin` guard
- Wraps with `AdminLayoutWrapper` component

### Dashboard Layout (`src/app/dashboard/layout.tsx`)
- Protected by `RequireAuth` and `RequireProfileCompletion`
- Includes sidebar navigation
- Uses `useAppContext` for data

## State Management

### AppContext (`src/context/AppContext.tsx`)
Unified context replacing AuthContext + DashboardContext:

**State Provided:**
- `user`: Firebase Auth user object
- `userDoc`: Firestore user document
- `isAdmin`: boolean (from custom claims)
- `purchase`: User purchase data
- `data`: User dashboard data
- `macros`: Estimated macros
- `packageTier`: User's package tier
- `isUnlocked`: Whether user has active package
- `loadingAuth`, `loadingUserDoc`, `loadingAdmin`, `loadingPurchase`: Loading states
- `loading`: Overall loading state
- `error`: Error message
- `sessionExpired`: Session expiry flag

**Actions:**
- `refresh()`: Reload user data
- `signOutAndRedirect()`: Sign out and redirect
- `setSessionExpired()`: Set session expiry state

**Legacy Hooks** (for backward compatibility):
- `useAuth()`: Returns auth-related state
- `useDashboard()`: Returns dashboard-related state

## Authentication & Authorization

### Auth System
- **Firebase Authentication**: Email/password
- **Custom Claims**: Admin role stored in `request.auth.token.admin === true`
- **Firestore Role Field**: Display-only (`role: "admin"`), NOT used for authorization

### Authorization Flow
1. User authenticates via Firebase Auth
2. Admin status checked via `getIdTokenResult()` → `claims.admin`
3. Custom claims set via Firebase Admin SDK (`setCustomUserClaims`)
4. Firestore `role` field updated for display purposes only

### Route Guards (`src/components/guards/`)
- **RequireAuth**: Ensures user is authenticated
- **RequireAdmin**: Checks `isAdmin` from AppContext (custom claims)
- **RequirePackage**: Ensures user has active package
- **RequireProfileCompletion**: Ensures profile is complete
- **RequireWizard**: Ensures macro wizard is completed

All guards show `FullScreenLoader` during transitions (never return null).

### Impersonation
- Admins can impersonate users via `/api/admin/impersonate`
- Token-based system with HTTP-only cookies
- `ImpersonationBanner` component shows when active
- Middleware handles token verification redirects

## API Routes (REST)

### Server-Side Routes (`src/app/api/`)

**Admin Routes** (`/api/admin/*`):
- `setAdminRole`: Set/remove admin custom claims
- `impersonate`: Generate impersonation token
- `verify-impersonation`: Verify and consume token (GET/POST)
- `send-reminder-email`: Send email notifications

**User Routes** (`/api/user/*`):
- `create-user-document`: Create initial user doc (registration)
- `submit-macro-wizard`: Update profile + macros
- `create-plan-update-request`: Submit plan change request

**Payment Routes**:
- `checkout`: Create Stripe checkout session
- `webhook/stripe`: Handle Stripe webhooks
- `mark-plan-delivered`: Mark meal plan as delivered

**Notification Routes**:
- `notifications/meal-plan`: Send meal plan notifications

### API Route Patterns
- All routes use **Firebase Admin SDK** (server-side)
- Authentication via `Authorization: Bearer <idToken>` header
- Token verification via `adminAuth.verifyIdToken()`
- Input validation before processing
- Structured error responses: `{ error: string, message?: string }`

## Data Handling

### Firebase Services
- **Auth**: Firebase Authentication
- **Firestore**: Database (collections: `users`, `purchases`, `planUpdateRequests`, `recipes`)
- **Storage**: File uploads (meal plans, images)

### Data Flow
1. **Client-side reads**: Direct Firestore queries (with security rules)
2. **Client-side writes**: BLOCKED - all writes go through API routes
3. **Server-side writes**: Firebase Admin SDK via API routes

### Firestore Collections
- **users**: User profiles (read: own/admin, write: API only)
- **purchases**: Purchase history (read: own/admin, write: API only)
- **planUpdateRequests**: Plan change requests (create: API only)
- **recipes**: Recipe library (read: authenticated, write: admin only)

### Pagination
- Custom hook: `usePaginatedQuery` (`src/hooks/usePaginatedQuery.ts`)
- Uses `limit` + `startAfter` for pagination
- Client-side filtering via `filterFn`
- No real-time listeners (manual refresh)

## Component Structure

### Naming Conventions
- Components: PascalCase (e.g., `AdminLayout.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `usePaginatedQuery.ts`)
- Utilities: camelCase (e.g., `date.ts`, `admin.ts`)
- Types: PascalCase (e.g., `UserRecord`, `AppContextValue`)

### Component Organization

**Admin Components** (`src/components/admin/`):
- `AdminLayout.tsx`: Main layout wrapper (sidebar + header)
- `AdminSidebar.tsx`: Navigation sidebar
- `DashboardSummary.tsx`: Stats cards component
- `ClientDetailSlideover.tsx`: User detail panel
- `ImpersonationBanner.tsx`: Impersonation notification

**Guard Components** (`src/components/guards/`):
- Route protection components (all use `useAppContext`)

**Dashboard Components** (`src/components/dashboard/`):
- Card components: `MealPlanStatusCard`, `MacrosOverviewCard`, etc.
- `LockedDashboard.tsx`: Locked state view

**UI Components** (`src/components/ui/`):
- `Toast.tsx`: Toast notification system
- `PageTransition.tsx`: Page transition animations
- `Slideover.tsx`: Slide-out panel component
- `AppModal.tsx`: Modal component
- `OptimizedImage.tsx`: Image optimization

**Common Components** (`src/components/common/`):
- `Skeleton.tsx`: Loading skeleton components

### Reusable Patterns

**Loading States**:
- `FullScreenLoader`: Full-page loading overlay
- `SkeletonTable`, `SkeletonCard`, `SkeletonText`: Skeleton placeholders

**Error States**:
- `ErrorBoundary.tsx`: React error boundary
- Error pages: `src/app/error.tsx`, `src/app/global-error.tsx`
- Inline error messages in components

**Empty States**:
- Custom empty state messages per page
- No dedicated empty state component

**Toast Notifications**:
- Context-based: `ToastProvider` + `useToast()` hook
- Types: `success`, `error`, `info`
- Auto-dismiss after 4 seconds
- Position: Fixed top-right, z-index 9999

## Folder Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth route group
│   ├── admin/             # Admin routes (layout wrapper)
│   ├── api/               # API routes
│   ├── dashboard/         # User dashboard (layout wrapper)
│   ├── layout.tsx         # Root layout
│   └── ...
├── components/
│   ├── admin/             # Admin-specific components
│   ├── dashboard/         # Dashboard components
│   ├── guards/            # Route guards
│   ├── ui/                # Reusable UI components
│   └── ...
├── context/
│   └── AppContext.tsx     # Unified app context
├── hooks/
│   ├── usePaginatedQuery.ts
│   └── ...
├── lib/
│   ├── firebase.ts        # Client SDK
│   ├── firebase-admin.ts  # Admin SDK
│   ├── admin.ts           # Admin utilities
│   ├── purchases.ts       # Purchase logic
│   └── ...
├── types/
│   ├── api.ts             # API request/response types
│   ├── dashboard.ts       # Dashboard types
│   ├── status.ts          # Status enums
│   └── ...
└── middleware.ts          # Next.js middleware
```

## Admin Dashboard Structure

### Current Admin Layout
- **Sidebar** (`AdminSidebar.tsx`): Always visible on desktop (256px wide)
  - Navigation links with icons (solid when active)
  - Settings section at bottom
  - Mobile: Overlay with slide animation

- **Top Navbar** (`AdminLayout.tsx`):
  - Page title (left)
  - Search bar (center, hidden on mobile)
  - Quick Actions button + User avatar (right)

- **Main Content**: Scrollable area with padding

### Admin Routes
- `/admin` - Dashboard (stats cards)
- `/admin/clients` - Client list
- `/admin/revenue` - Sales & revenue (aliased from `/admin/sales`)
- `/admin/referrals` - Referral tracking
- `/admin/plan-requests` - Plan update requests
- `/admin/recipes` - Recipe management
- `/admin/manage-admins` - Admin user management
- `/admin/settings` - Admin settings

### Data Fetching
- Uses `usePaginatedQuery` hook for all data fetching
- No real-time listeners (manual refresh)
- Filter functions memoized to prevent re-renders
- Loading states: `loading`, `loadingMore`, `hasMore`

## Security & Permissions

### Firestore Security Rules
- User writes: BLOCKED (must use API routes)
- Admin writes: Allowed for admins via custom claims
- Reads: Users can read own data, admins can read all
- Custom claims checked: `request.auth.token.admin == true`

### API Route Security
- All routes verify JWT token via Firebase Admin SDK
- Admin routes check `decodedToken.admin === true`
- User routes verify `uid` matches authenticated user
- Input validation on all requests

### Authorization Model
- **Admin**: Firebase custom claim (`admin: true`) - SOURCE OF TRUTH
- **Firestore role field**: Display-only, NOT used for authorization
- Custom claims checked client-side via `getIdTokenResult()`
- Custom claims checked server-side via `verifyIdToken()`

## Design System

### Color Tokens
- Primary Accent: `#D7263D` (red)
- Background: Black (`#000000`)
- Foreground: Off-white (`#f5f5f5`)
- Muted: Dark gray (`#1a1a1a`)
- Border: Gray (`#262626`)

### Typography
- Body: Geist Sans
- Headings: Anton (uppercase, letter-spaced)
- Code: Geist Mono
- Sizes: Standard Tailwind scale

### Spacing & Layout
- Standard Tailwind spacing scale
- Border radius: `rounded-lg` (8px), `rounded-2xl` (16px), `rounded-3xl` (24px)
- Shadows: Custom red glow: `shadow-[0_0_60px_-35px_rgba(215,38,61,0.6)]`

### Component Patterns
- Cards: `rounded-2xl border border-neutral-800 bg-neutral-900`
- Buttons: Primary (red bg), Secondary (transparent border)
- Badges: Rounded full with colored borders
- Tables: Dark theme with alternating row colors

## Accessibility & Dark Mode

- **Dark Mode**: Only mode (no light mode toggle)
- **Color Contrast**: High contrast (white on black)
- **Focus States**: Visible focus rings
- **Keyboard Navigation**: Standard HTML semantics
- **Screen Readers**: Semantic HTML, ARIA labels on interactive elements

## Important Notes

### Routing & Protection
- Admin routes: Protected by `RequireAdmin` guard in layout
- Dashboard routes: Protected by `RequireAuth` + `RequireProfileCompletion`
- Middleware: Handles impersonation token redirects (Edge Runtime compatible)

### Performance
- Paginated queries (no full collection listeners)
- Memoized filter functions to prevent re-renders
- Image optimization via `OptimizedImage` component
- Client-side data transformation (date parsing, etc.)

### Current Issues (To Fix)
- Admin pages should NOT wrap with `<AdminLayout>` (layout already provides it)
- ConditionalLayout isolates admin routes from Navbar/Footer
- Sidebar always visible on desktop via CSS classes

### Branding
- **Brand Name**: MacroMinded
- **Tagline**: "Custom Meal Plans"
- **Primary Color**: #D7263D (red)
- **Style**: Modern, minimalist, dark theme

---

**Note**: This project uses Firebase for all backend services (Auth, Firestore, Storage). All client-side writes are blocked; writes must go through secure API routes using Firebase Admin SDK.

