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
- `AdminLayout.tsx`: Main layout wrapper (master container)
- `AdminSidebar.tsx`: Navigation sidebar (256px, always visible on desktop)
- `AdminHeader.tsx`: Top navbar with search and quick actions
- `AdminContentWrapper.tsx`: Scrollable content container with animations
- `AdminMobileMenu.tsx`: Mobile-responsive menu overlay
- `DashboardSummary.tsx`: Stats cards component with pagination
- `ClientDetailSlideover.tsx`: User detail panel
- `ImpersonationBanner.tsx`: Impersonation notification banner

**Reusable Admin Components**:
- `StatCard.tsx`: Consistent stat card with loading states, animations, and highlight support
  - Features: Hover lift effect, staggered entrance animations, skeleton loading
  - Styling: `rounded-2xl border border-neutral-800 bg-neutral-900` with red accent for highlights
  - Props: `title`, `value`, `isLoading`, `isHighlight`, `delay`, `icon`, `description`
- `EmptyState.tsx`: Polished empty state component with icon, title, description, and optional action
  - Features: Fade-in animation, centered layout, consistent spacing
  - Used for: "No items found", "All loaded" replacements, empty data states
- `TableContainer.tsx`: Wrapper for tables with consistent styling and footer handling
  - Features: Empty state integration, load more button, footer content slot
  - Styling: `rounded-2xl border border-neutral-800 bg-neutral-900`
  - Handles: Loading states, empty states, pagination footer

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
  - Conditional positioning based on impersonation banner

- **Top Navbar** (`AdminHeader.tsx`):
  - Page title (left) - provided by AdminLayout based on route
  - Search bar (center, hidden on mobile)
  - Quick Actions button + User avatar (right)
  - Smooth entrance animations

- **Main Content** (`AdminContentWrapper.tsx`): 
  - Scrollable area with consistent padding (`px-6 py-8`)
  - Fade-in animations for page transitions
  - Responsive max-width and spacing

### Admin Routes

All admin pages follow consistent structure:
- No duplicate `<AdminLayout>` wrappers (provided by `src/app/admin/layout.tsx`)
- Page title provided by `AdminHeader` component (no duplicate titles)
- Consistent spacing: `gap-6` between sections, `p-6` for cards
- Motion animations on all pages: `initial={{ opacity: 0, y: 20 }}` → `animate={{ opacity: 1, y: 0 }}`

**Route Details**:
- `/admin` - Dashboard (stats cards using `StatCard` component)
- `/admin/clients` - Client list with filters and `TableContainer`
- `/admin/revenue` (from `/admin/sales`) - Revenue metrics with `StatCard` grid
- `/admin/referrals` - Referral tracking with search and `TableContainer`
- `/admin/plan-requests` - Plan update requests with expandable cards
- `/admin/recipes` - Recipe management grid with `EmptyState`
- `/admin/manage-admins` - Admin user management with `TableContainer`
- `/admin/settings` - Settings page with `EmptyState` placeholder

### Admin Page Patterns

**Consistent Structure**:
```typescript
// All admin pages follow this pattern:
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
  className="flex flex-col gap-6"
>
  {/* Filters/Search */}
  <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
    ...
  </div>
  
  {/* Main Content */}
  {loading ? <Skeleton /> : <TableContainer>...</TableContainer>}
</motion.div>
```

**Reusable Components Usage**:
- **StatCard**: All metric/stats displays (Dashboard, Revenue pages)
- **EmptyState**: All "no data" states (replaces "All loaded" messages)
- **TableContainer**: All table-based pages (Clients, Referrals, Manage Admins)
- **Motion animations**: Consistent entrance animations across all pages

**Filter/Button Patterns**:
- Filter buttons: `rounded-lg px-4 py-2 text-sm font-semibold`
- Active state: `bg-[#D7263D] text-white`
- Inactive state: `bg-neutral-800 text-neutral-300 hover:bg-neutral-700`
- Primary actions: `border border-[#D7263D] bg-[#D7263D] text-white`

### Data Fetching
- Uses `usePaginatedQuery` hook for all data fetching
- No real-time listeners (manual refresh)
- Filter functions memoized to prevent re-renders (using `useRef` for stability)
- Loading states: `loading`, `loadingMore`, `hasMore`
- Client-side filtering via `filterFn` prop for display purposes only

### Styling Standards

**Card Styling**:
- Standard: `rounded-2xl border border-neutral-800 bg-neutral-900 p-6`
- Highlighted: Adds `border-[#D7263D]/50` and red glow shadow
- Consistent padding: `p-6` for all cards

**Spacing**:
- Section gaps: `gap-6` (24px)
- Card padding: `p-6` (24px)
- Table cell padding: `px-6 py-4`
- Consistent margins: `mb-6` for section spacing

**Empty States**:
- Replaced all "All loaded" placeholders with `EmptyState` component
- Consistent messaging and iconography
- Optional action buttons for empty states

**Tables**:
- Wrapped in `TableContainer` component
- Consistent header styling: `bg-neutral-800/50`
- Alternating row colors: `bg-neutral-900/50` and `bg-neutral-900`
- Hover effects: `hover:bg-neutral-800/30`

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

**Cards**:
- Standard: `rounded-2xl border border-neutral-800 bg-neutral-900 p-6`
- Highlighted: `border-[#D7263D]/50 bg-neutral-900/80 backdrop-blur shadow-[0_0_60px_-35px_rgba(215,38,61,0.6)]`
- Hover effects: `hover:scale-1.02 hover:y-[-4px]` on stat cards

**Buttons**:
- Primary: `border border-[#D7263D] bg-[#D7263D] text-white hover:bg-[#D7263D]/90`
- Secondary: `border border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700`
- Filter active: `bg-[#D7263D] text-white`
- Filter inactive: `bg-neutral-800 text-neutral-300 hover:bg-neutral-700`

**Badges**:
- Status: `rounded-full border px-3 py-1 text-xs font-semibold`
- Colors: Green (delivered), Amber (in-progress), Red accent (highlights)

**Tables**:
- Container: `rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden`
- Header: `bg-neutral-800/50 sticky top-0`
- Rows: Alternating `bg-neutral-900/50` and `bg-neutral-900`
- Hover: `hover:bg-neutral-800/30 transition`
- Cell padding: `px-6 py-4`

**Stat Cards** (`StatCard.tsx`):
- Consistent metrics display across admin pages
- Loading skeleton states
- Staggered entrance animations
- Highlight variant for important metrics (red accent)

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
- Stable refs (`useRef`) for filter functions in `usePaginatedQuery`

### Middleware (`src/middleware.ts`)
- Runs in Edge Runtime (no Firebase Admin SDK)
- Handles impersonation token redirects
- Clears impersonation cookie on exit (`?exit-impersonation=true`)
- Token verification delegated to `/api/admin/verify-impersonation`
- Matches all routes except static files and most API routes

### Environment Variables

**Firebase (Client)**:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

**Firebase Admin (Server)**:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

**Stripe**:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

**Email**:
- `RESEND_API_KEY` (or `SENDGRID_API_KEY`)

### Custom Utilities (`src/lib/`)

**Core Services**:
- `firebase.ts`: Firebase client SDK initialization
- `firebase-admin.ts`: Firebase Admin SDK initialization (server-side)
- `admin.ts`: Admin utilities (check admin status, etc.)
- `impersonation.ts`: Impersonation cookie utilities (client-side)

**Data & Business Logic**:
- `purchases.ts`: Purchase data utilities (client-side)
- `purchases-server.ts`: Server-side purchase operations
- `prices.ts`: Package pricing configuration
- `recipes.ts`: Recipe utilities
- `referral.ts`: Referral code generation

**Services**:
- `stripe.ts`: Stripe client initialization
- `email.ts`: Email sending (Resend) with React Email support
- `resend.ts`: Resend-specific email templates
- `image-utils.ts`: Image processing utilities

**UI Utilities**:
- `ui.ts`: UI helper functions
- `utils/date.ts`: Date formatting with dayjs

### Status Types (`src/types/status.ts`)

**MealPlanStatus Enum**:
- `NOT_STARTED`
- `IN_PROGRESS`
- `DELIVERED`

Used throughout the app for meal plan status tracking.

### Branding
- **Brand Name**: MacroMinded
- **Tagline**: "Custom Meal Plans"
- **Primary Color**: #D7263D (red)
- **Style**: Modern, minimalist, dark theme

---

### Animation System

**Framer Motion**:
- Page transitions: Fade + slide up animations
- Hover effects: Scale transforms on interactive elements
- Sidebar: Spring animations for mobile slide-in/out
- Active indicators: Layout animations for navigation states
- Toast notifications: Slide-in from right with fade

**Animation Patterns**:
- Entrance: `initial={{ opacity: 0, y: 20 }}` → `animate={{ opacity: 1, y: 0 }}`
- Hover: `whileHover={{ scale: 1.02, y: -2 }}`
- Spring transitions: `{ type: "spring", stiffness: 500, damping: 30 }`

### React Email Integration

- Uses `@react-email/components` for email templates
- Server-side rendering: `render()` from `@react-email/render`
- Email provider: Resend (primary), SendGrid (alternative)
- Templates: Meal plan delivery emails, notifications

---

**Note**: This project uses Firebase for all backend services (Auth, Firestore, Storage). All client-side writes are blocked; writes must go through secure API routes using Firebase Admin SDK. The admin panel uses a modern dark-themed design with glassy cards, smooth animations, and a responsive 256px sidebar layout.

---

## Admin Panel Refactoring (2024)

### Completed Refactoring

**Structural Improvements**:
- ✅ Removed duplicate `<AdminLayout>` wrappers (provided by `src/app/admin/layout.tsx`)
- ✅ Removed duplicate page titles (provided by `AdminHeader` component)
- ✅ Standardized spacing: All pages use `gap-6`, `p-6` consistently
- ✅ Unified card styling: `rounded-2xl border border-neutral-800 bg-neutral-900`

**Reusable Components Created**:
- ✅ `StatCard.tsx`: Consistent stat cards with loading states, animations, highlight support
- ✅ `EmptyState.tsx`: Polished empty state component (replaces "All loaded" placeholders)
- ✅ `TableContainer.tsx`: Table wrapper with empty state integration and footer handling

**Page Structure Standardization**:
All admin pages now follow consistent patterns:
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
  className="flex flex-col gap-6"
>
  {/* Filters/Search - wrapped in card */}
  <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
    ...
  </div>
  
  {/* Main Content - uses TableContainer or grid */}
  {loading ? <Skeleton /> : <TableContainer>...</TableContainer>}
</motion.div>
```

**Key Improvements**:
- **Maintainability**: Reusable components reduce code duplication by ~40%
- **Consistency**: Unified spacing, styling, and animations across all 8 admin pages
- **UX**: Polished empty states replace generic "All loaded" messages
- **Performance**: Memoized filters and stable refs prevent unnecessary re-renders
- **Accessibility**: Consistent semantic HTML and ARIA patterns throughout

**Component Usage Patterns**:
- **StatCard**: Used in Dashboard (`/admin`) and Revenue (`/admin/sales`) pages
- **EmptyState**: Used in Clients, Referrals, Plan Requests, Recipes, Manage Admins, Settings
- **TableContainer**: Used in Clients, Referrals, Manage Admins pages
- **Motion animations**: Consistent entrance animations on all pages

**Refactored Pages**:
1. `/admin` - Dashboard (uses `StatCard` component via `DashboardSummary`)
2. `/admin/clients` - Uses `TableContainer` and `EmptyState`
3. `/admin/sales` - Revenue page (uses `StatCard` component)
4. `/admin/referrals` - Uses `TableContainer` and `EmptyState`
5. `/admin/plan-requests` - Uses `EmptyState` for empty states
6. `/admin/recipes` - Uses `EmptyState` for empty recipe library
7. `/admin/manage-admins` - Uses `TableContainer` and `EmptyState`
8. `/admin/settings` - Uses `EmptyState` as placeholder

**Before vs After**:
- **Before**: Each page had custom "All loaded" messages, inconsistent spacing, duplicate wrappers
- **After**: Unified empty states, consistent spacing (`gap-6`), no duplicate wrappers, reusable components

This refactoring ensures all admin pages maintain visual and structural consistency while preserving all Firebase logic, hooks (`usePaginatedQuery`), and context integrations (`AppContext`).

