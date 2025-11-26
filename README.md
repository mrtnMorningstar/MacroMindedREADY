# MacroMinded Project Summary

## Project Overview

**MacroMinded** is a Next.js-based web application that provides personalized meal planning services. The platform allows users to purchase custom meal plans, complete a macro wizard to provide their health and dietary information, and access their meal plans through a client dashboard. Admins manage the entire system through an admin panel, creating meal plans, managing users, and processing orders.

### Key Technologies
- **Next.js 16.0.1** (App Router, React 19.2.0) - Frontend framework
- **Firebase 12.5.0** - Authentication and Firestore database
- **Firebase Admin SDK 12.5.0** - Server-side Firebase operations
- **Stripe 19.3.0** - Payment processing
- **Tailwind CSS 4** - Styling
- **Framer Motion 12.23.24** - Animations
- **TypeScript 5** - Type safety
- **Recharts 3.4.1** - Data visualization (admin charts)
- **Resend** - Email delivery service
- **React Email** - Email template system

---

## Folder Structure

```
macromindedready/
├── src/                          # Main source code
│   ├── app/                      # Next.js App Router pages and routes
│   │   ├── (auth)/              # Authentication routes (login, register)
│   │   ├── admin/               # Admin panel routes
│   │   ├── api/                 # API routes (Next.js API handlers)
│   │   ├── dashboard/           # Client dashboard routes
│   │   ├── macro-wizard/        # Macro calculation wizard
│   │   ├── packages/            # Package selection and checkout
│   │   ├── recipes/             # Recipe library
│   │   └── page.tsx             # Homepage
│   ├── components/              # React components
│   │   ├── admin/               # Admin panel components
│   │   ├── dashboard/           # Client dashboard components
│   │   ├── guards/              # Route protection components
│   │   ├── layouts/             # Layout wrappers
│   │   └── ui/                  # Reusable UI components
│   ├── context/                 # React context providers
│   │   └── AppContext.tsx       # Global app state management
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility libraries and helpers
│   │   └── utils/               # Utility functions
│   └── types/                   # TypeScript type definitions
├── scripts/                     # Utility scripts
│   └── setAdmin.ts              # Script to grant admin privileges
├── emails/                      # React Email templates
│   ├── meal-plan-delivered.tsx  # Meal plan delivery email
│   ├── reminder-email.tsx       # Reminder emails
│   └── admin-notification.tsx   # Admin notifications
├── public/                      # Static assets
├── checkClaims.js               # Utility to check Firebase custom claims
├── setAdminRole.js              # Script to set admin role
├── firestore.rules              # Firestore security rules
├── storage.rules                # Firebase Storage security rules
├── firebase.json                # Firebase configuration
├── next.config.ts               # Next.js configuration
├── tsconfig.json                # TypeScript configuration
├── instrumentation.ts           # Next.js instrumentation (currently no-op)
└── package.json                 # Dependencies and scripts
```

---

## Core Functionality

### Authentication & Authorization
- **Firebase Authentication** - Email/password authentication
- **Custom Claims** - Admin status stored in Firebase Auth custom claims (`admin: true`)
- **Route Guards** - Multiple guard components protect routes:
  - `RequireAuth` - Ensures user is authenticated
  - `RequireAdmin` - Ensures user has admin privileges
  - `RequireWizard` - Ensures macro wizard is completed
  - `RequireProfileCompletion` - Ensures profile is complete
  - `RequirePackage` - Ensures user has purchased a package

### Client Dashboard (`/dashboard`)
- **Overview Page** (`/dashboard`) - Personalized welcome header, modular grid layout with:
  - Meal Plan Progress card
  - Daily Targets (macro overview)
  - Progress Tracker card
  - Referrals Summary card
  - Recipe Library preview card
  - Coach Contact card
  - Quick Action buttons
- **Meal Plan Page** (`/dashboard/plan`) - Step timeline view (In Queue → In Progress → Delivered), progress bar animation, estimated delivery date, download zone, previous plans list
- **Profile Page** (`/dashboard/profile`) - Two-column layout with profile info, goals/progress, BMI calculator, macro wheel charts (Recharts)
- **Referrals Page** (`/dashboard/referrals`) - Referral summary stat cards (Total Referrals, Credits Earned), shareable referral link, QR code placeholder, leaderboard placeholder
- **Support Page** (`/dashboard/support`) - FAQ accordion, contact information cards, emergency info, chat widget placeholder
- **Locked Dashboard** - Preview shown when user hasn't purchased a package, encourages plan selection

### Admin Panel (`/admin`)
- **Dashboard** - Overview statistics, recent clients, pending tasks, activity feed
- **Clients** (`/admin/clients`) - Filterable list of all users with advanced filtering (all, needs-plan, delivered, in-progress), view client details in slideover, impersonation feature
- **Users** (`/admin/users`) - Alternative user listing page with package tier filtering
- **Requests** (`/admin/requests`) - Shows users with pending meal plans
- **Plan Requests** (`/admin/plan-requests`) - Manage meal plan update requests from clients (different from /admin/requests)
- **Plan Updates** (`/admin/updates`) - View and manage plan update requests, mark as handled
- **Wizard** (`/admin/wizard`) - View and verify macro wizard completions for all users
- **Sales/Revenue** (`/admin/sales`) - Sales metrics and analytics
- **Referrals** (`/admin/referrals`) - Referral program management and statistics
- **Recipes** (`/admin/recipes`) - Recipe library management (create, edit, delete recipes)
- **Manage Admins** (`/admin/manage-admins`) - Grant/revoke admin privileges
- **Settings** (`/admin/settings`) - Platform settings with 3 tabs:
  - **Platform Settings** - General platform configuration
  - **Admin Controls** - Admin-specific settings
  - **Data Management** - Export and data management tools
- **Analytics** (`/admin/analytics`) - Data visualization and metrics

### Macro Wizard (`/macro-wizard`)
- Multi-step form to collect user health and dietary information:
  - Body stats (height, weight, age, gender)
  - Activity level
  - Goals (cut, bulk, maintenance/recomp)
  - Dietary restrictions and preferences
  - Food likes and dislikes
- Calculates estimated daily macros (calories, protein, carbs, fats) based on inputs
- Stores data in Firestore user document (`profile` object and `estimatedMacros`)
- Sets `macroWizardCompleted: true` flag
- Required before accessing dashboard content
- Admin can verify wizard completions via `/admin/wizard`

### Payment Flow (`/packages`)
- **Package Selection Page** (`/packages`) - Professional card-based UI with:
  - Three professional tiers:
    - **Essential** ($69) - Delivery within 3-5 business days, personal dashboard access, 1 meal plan update included, weekly shopping list, fully customized meal plan
    - **Professional** ($99) - Delivery within 24-48 hours, includes all Essential features, recipe library access, priority email support, 2 meal plan updates included
    - **Premium** ($149) - Express delivery within 24 hours, includes all Professional features, 3 meal plan updates included, priority support access, exclusive premium features
  - Centered pricing display
  - Gradient accents and hover animations
  - "Most Popular" badge on Professional plan
  - Current selection indicator
- **Stripe Integration:**
  - Uses Stripe Price IDs mapped in `src/lib/prices.ts`
  - Internal Stripe names: Basic, Pro, Elite (display names are Essential, Professional, Premium)
  - Secure checkout session creation via `/api/checkout`
  - Webhook handler processes payment confirmation
- **Post-Payment:**
  - Purchase record created in Firestore `purchases` collection
  - User document updated with `packageTier` and `purchaseDate`
  - Referral credits processed if user was referred
  - Redirects to `/packages/success` on success, `/packages/cancel` on cancel
- **Success/Cancel Pages:**
  - `/packages/success` - Confirmation page after successful payment
  - `/packages/cancel` - Canceled payment page
  - `/payment/success` - Alternative success route
  - `/payment/cancel` - Alternative cancel route

### API Routes (`/api`)

#### Admin APIs
- **`/api/admin/setAdminRole`** - Grant/revoke admin privileges via custom claims and Firestore role field
- **`/api/admin/impersonate`** - Generate secure one-time impersonation tokens for admin user testing
- **`/api/admin/verify-impersonation`** - Verify and consume impersonation tokens, set impersonation cookie
- **`/api/admin/update-settings`** - Update platform settings stored in `adminSettings/global` Firestore document
- **`/api/admin/send-reminder-email`** - Send reminder emails to users about their meal plan status

#### User APIs
- **`/api/user/create-user-document`** - Create user document on registration with referral code generation if referral link used
- **`/api/user/submit-macro-wizard`** - Submit macro wizard data with validation, stores profile and estimatedMacros, sets macroWizardCompleted flag
- **`/api/user/create-plan-update-request`** - Create plan update request (stored in `planUpdateRequests` collection, triggers admin notification)

#### Payment APIs
- **`/api/checkout`** - Create Stripe checkout session with authentication verification, validates plan tier, sets up success/cancel URLs
- **`/api/webhook`** - Main Stripe webhook handler for `checkout.session.completed` events
  - Updates user document with package tier and purchase date
  - Processes referral credits (increments referrer's `referralCredits` field)
  - Sets meal plan status to NOT_STARTED
- **`/api/webhook/stripe`** - Additional Stripe webhook route (may handle other Stripe events)

#### Meal Plan APIs
- **`/api/mark-plan-delivered`** - Admin-only route to mark meal plan as delivered
  - Updates user document with delivery status and URLs
  - Uploads meal plan files to Firebase Storage
  - Sends delivery email notification to user
- **`/api/notifications/meal-plan`** - Send meal plan-related notifications

### Additional Pages

#### Public Pages
- **Homepage** (`/`) - Landing page with:
  - Hero section with animated background gradients
  - Features showcase (Macro-Perfect Plans, Recipe Library, Progress Tracking, Expert Coaching)
  - Workflow steps (Pick Your Speed, Share Your Stats, Get Your Plan)
  - Deliverables list (10 key features)
  - Dashboard features preview
  - Package overview cards (Basic, Pro, Elite with delivery times)
  - Call-to-action sections

#### Recipe Pages
- **Recipe Library** (`/recipes`) - Requires package purchase:
  - Grid layout with recipe cards
  - Search functionality (by title)
  - Tag filtering (High Protein, Low Carb, Vegetarian, Vegan, Quick Prep, Gluten Free, Dairy Free)
  - Recipe cards show image, title, description, calories, macros
- **Individual Recipe** (`/recipes/[id]`) - Detailed recipe view with:
  - Full recipe image
  - Ingredients list
  - Step-by-step instructions
  - Macro breakdown (calories, protein, carbs, fats)
  - Tags/categories

#### Legal Pages
- **Privacy Policy** (`/privacy`) - Privacy policy page
- **Terms of Service** (`/terms`) - Terms of service page

#### Payment Result Pages
- **Success Pages** (`/success`, `/packages/success`, `/payment/success`) - Payment confirmation pages
- **Cancel Pages** (`/cancel`, `/payment/cancel`, `/packages/cancel`) - Payment cancellation pages

### Referral Program
- **Automatic Code Generation** (`src/lib/referral.ts`):
  - Unique referral codes generated on user registration
  - Format: `PREFIX-RANDOM` (e.g., `MACRO-A83F` or `JOHN-XY9Z`)
  - Prefix based on user's first name (sanitized, max 6 chars)
  - Checks Firestore for uniqueness before assignment
  - Fallback to timestamp-based code if conflicts persist
- **Referral Tracking:**
  - Users can share referral links: `/register?ref=CODE`
  - Referral code stored in user document `referredBy` field during registration
  - Referral link automatically generated on dashboard referrals page
- **Credit System:**
  - Referrers earn 1 credit (`referralCredits` field) when a referred user completes a purchase
  - Credits automatically incremented via Stripe webhook handler (`/api/webhook`)
  - Credits displayed on both client dashboard and admin panel
- **User Features:**
  - View total referrals and credits earned
  - Share referral link via copy button
  - QR code placeholder for future implementation
  - Referral stats visible in admin panel
- **Credit Usage:** Credits can be used for meal plan updates (exact redemption mechanism determined by admin workflow)

### Scripts
- **`scripts/setAdmin.ts`** - TypeScript script to grant admin role to a user (uses dotenv for credentials)
  - Usage: `ts-node scripts/setAdmin.ts <USER_UID>`
  - Sets both Firestore `role` field and Firebase Auth custom claim
- **`setAdminRole.js`** - Node.js script to grant admin role (uses service account JSON file)
  - Usage: `node setAdminRole.js <USER_UID>`
  - Requires `FIREBASE_ADMIN_SDK_PATH` env var or `serviceAccountKey.json` file
- **`checkClaims.js`** - Utility to check Firebase custom claims for a user
  - Hardcoded UID for testing, shows custom claims, email, and UID

---

## Firebase Integration

### Authentication
- Email/password authentication via Firebase Auth
- Custom claims used for admin authorization (`admin: true` in token)
- Session management handled client-side via `AppContext`

### Firestore Database

#### Collections

**`users`** - User profiles and data:
- Profile information (height, weight, age, gender, activity level, goals, dietary preferences)
- `estimatedMacros` object (calories, protein, carbs, fats)
- `packageTier` (Essential/Professional/Premium, stored as Basic/Pro/Elite)
- `mealPlanStatus` (NOT_STARTED, IN_QUEUE, IN_PROGRESS, DELIVERED)
- `mealPlanFileURL`, `mealPlanImageURLs`, `groceryListURL`
- `mealPlanDeliveredAt`, `purchaseDate`, `createdAt`
- `macroWizardCompleted` (boolean flag)
- `wizardVerified` (admin verification flag)
- `referralCode` (unique code for sharing)
- `referralCredits` (number of credits earned)
- `referredBy` (referral code that referred this user)
- `role` (display-only, "admin" for admins - NOT used for authorization)
- `displayName`, `email`

**`purchases`** - Purchase records:
- Linked to Stripe checkout sessions
- Contains `userId`, `planType`, `status`, `stripeSessionId`
- Tracks purchase amount and email

**`planUpdateRequests`** - Meal plan modification requests:
- `userId`, `requestText` (user's description)
- `handled` (boolean), `date` (timestamp)
- Created via secure API route, admins can mark as handled

**`recipes`** - Recipe library:
- Recipe metadata: `title`, `description`, `calories`, `protein`, `carbs`, `fats`
- `ingredients` (array), `steps` (array)
- `imageURL` (optional), `tags` (array for filtering)
- Accessible to all authenticated users, managed by admins

**`adminSettings`** - Platform configuration:
- Single document: `adminSettings/global`
- Contains platform-wide settings (notifications, payments, security settings)
- Persisted across admin panel settings updates

**`adminActivity`** - Admin action logs:
- Logs admin actions (e.g., impersonation events)
- Immutable (no updates/deletes allowed)
- Admin-only read access

### Firebase Storage
- **Path Structure:**
  - `/mealPlans/{userId}/plan.pdf` - Main meal plan PDF file
  - `/mealPlans/{userId}/images/{imageName}` - Meal plan preview images
  - `/mealPlans/{userId}/groceryList.pdf` - Optional grocery shopping list
- **Access Rules:**
  - Users can only download files in their own `/mealPlans/{userId}/**` path
  - Users cannot upload anything (upload blocked by security rules)
  - Admins have full read/write/delete/list access to all paths
  - Directory listing restricted to admins only (prevents URL guessing attacks)
- **File Upload:** Admin uses `CardUpload` component to upload meal plan files via admin panel

### Security Rules
- **Firestore:** Rules enforce admin-only writes for sensitive collections, user-owned reads for personal data
- **Storage:** Rules prevent user uploads, restrict downloads to own files, admin-only directory listing
- All authorization based on Firebase Auth custom claims, not Firestore fields

---

## Build and Development Setup

### Prerequisites
- Node.js (version compatible with Next.js 16)
- Firebase project with Authentication, Firestore, and Storage enabled
- Stripe account for payment processing
- Resend account for email delivery

### Installation
```bash
npm install
```

### Environment Variables (`.env.local`)
Required variables:
```env
# Firebase
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin SDK (server-side only)
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-publishable-key
STRIPE_SECRET_KEY=your-secret-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# Resend (email)
RESEND_API_KEY=your-resend-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Development
```bash
npm run dev        # Start development server (uses webpack)
```

### Production Build
```bash
npm run build      # Build for production (uses webpack)
npm start          # Start production server
```

### Key Configuration Files
- **`next.config.ts`** - Next.js config with Firebase Storage image domains
- **`tsconfig.json`** - TypeScript config with path aliases (`@/*` → `./src/*`)
- **`firebase.json`** - Firebase CLI config (rules, indexes)
- **`.firebaserc`** - Firebase project aliases (if using Firebase CLI)

---

## Dependencies

### Core Dependencies
- **`next@16.0.1`** - Next.js framework (App Router)
- **`react@19.2.0`** / **`react-dom@19.2.0`** - React library
- **`firebase@12.5.0`** - Firebase client SDK
- **`firebase-admin@12.5.0`** - Firebase Admin SDK (server-side)

### UI & Styling
- **`tailwindcss@4`** - Utility-first CSS framework
- **`framer-motion@12.23.24`** - Animation library
- **`@heroicons/react@2.2.0`** - Icon library
- **`recharts@3.4.1`** - Charting library (admin dashboard)

### Payment & Email
- **`stripe@19.3.0`** / **`@stripe/stripe-js@8.3.0`** - Stripe payment processing
- **`resend@3.5.0`** - Email delivery service
- **`@react-email/components@0.0.27`** / **`@react-email/render@0.0.14`** - Email templates

### Utilities
- **`dayjs@1.11.19`** - Date manipulation
- **`dotenv@17.2.3`** - Environment variable loading

### Dev Dependencies
- **`typescript@5`** - TypeScript compiler
- **`eslint@9`** / **`eslint-config-next@16.0.1`** - Linting
- **`firebase-tools@14.24.2`** - Firebase CLI tools
- **`ts-node@10.9.2`** - TypeScript execution for scripts

---

## Configuration and Environment

### Environment Files
- **`.env.local`** - Local development environment variables (git-ignored)
- Contains all Firebase, Stripe, and Resend API keys
- Firebase Admin SDK credentials for server-side operations

### Firebase Configuration
- **`.firebaserc`** - Firebase project aliases (if using Firebase CLI)
- **`firebase.json`** - Firebase CLI configuration
  - Firestore rules path
  - Storage rules path
  - Firestore indexes path

### Service Account
- **`serviceAccountKey.json`** - Firebase Admin SDK service account key (git-ignored)
- Used by server-side scripts (`setAdminRole.js`, `checkClaims.js`)
- Can be replaced with environment variables in TypeScript scripts

---

## Security / Rules

### Firestore Security Rules (`firestore.rules`)

**Key Principles:**
1. Admin authorization via custom claims only (`request.auth.token.admin == true`)
2. Users can only read their own data (except public collections like recipes)
3. All writes to sensitive collections (users, purchases, planUpdateRequests) must go through API routes
4. Schema validation functions ensure data integrity

**Collection Rules:**
- **`users`** - Read: own data or admin. Create/Update: Denied client-side (must use API routes). Delete: own data or admin.
- **`purchases`** - Read: own purchases or admin. Create: authenticated users (with validation). Update/Delete: admin only.
- **`planUpdateRequests`** - Read: own requests or admin. Create: Denied client-side (must use API). Update/Delete: admin only.
- **`recipes`** - Read: authenticated users. Write: admin only.
- **`adminSettings`** - Admin only (all operations).
- **`adminActivity`** - Admin read/create only (no updates/deletes).

### Storage Security Rules (`storage.rules`)

**Key Principles:**
1. Users can ONLY download files in `/mealPlans/{their-uid}/**`
2. Users CANNOT upload anything
3. Admins have full access (read/write/delete/list)
4. Directory listing restricted to admins (prevents URL guessing)

**Path Rules:**
- `/mealPlans/{userId}/plan.pdf` - User can download own file, admin full access
- `/mealPlans/{userId}/images/{imageName}` - User can download own images, admin full access
- `/mealPlans/{userId}/groceryList.pdf` - User can download own file, admin full access
- Directory listings at any level restricted to admins only

---

## Instrumentation / Monitoring

### `instrumentation.ts`
Currently a no-op function (Sentry removed). Previously used for telemetry/monitoring setup. Can be extended for:
- Error tracking (Sentry, LogRocket, etc.)
- Analytics (Google Analytics, Mixpanel, etc.)
- Performance monitoring

**Current implementation:**
```typescript
export async function register() {
  // No-op: Sentry removed
}
```

---

## Future Improvements / TODOs

### Found in Codebase:
1. **Data Management Settings** (`src/components/admin/settings/DataManagementSettings.tsx`):
   - TODO: Implement actual export API call
   - TODO: Implement actual deletion API call

### Potential Improvements:
1. **Error Tracking** - Implement comprehensive error tracking (Sentry, LogRocket)
2. **Analytics** - Add user analytics and conversion tracking
3. **Testing** - Add unit tests, integration tests, E2E tests
4. **Performance** - Implement caching strategies, image optimization
5. **Email Templates** - Expand email template library
6. **Admin Features** - Add more admin analytics, bulk operations
7. **Client Features** - Recipe recommendations, meal plan customization UI
8. **Mobile App** - Consider React Native mobile app
9. **Internationalization** - Multi-language support
10. **Accessibility** - Enhanced ARIA labels, keyboard navigation improvements

---

## Key Architecture Decisions

### Layout System
- **ConditionalLayout** (`src/components/ConditionalLayout.tsx`) - Route-aware layout wrapper:
  - Admin routes: No extra wrapping (AdminLayout handles everything)
  - Dashboard routes: Includes Navbar/Footer, but DashboardShell handles main content
  - Regular routes: Standard layout with Navbar, Footer, and PageTransition animations
- **AdminLayout** (`src/components/admin/AdminLayout.tsx`) - Self-contained admin layout:
  - Fixed sidebar (256px desktop, overlay mobile)
  - AdminHeader (page title)
  - AdminContentWrapper (animated content area)
  - No global Navbar dependency
- **DashboardShell** (`src/components/layouts/DashboardShell.tsx`) - Client dashboard layout:
  - Fixed sidebar (264px desktop, slide-in mobile)
  - Main content area with padding
  - Mobile menu button
  - Loading overlay support
- **Navbar** (`src/components/Navbar.tsx`) - Global navigation:
  - Visible on public routes and dashboard
  - Hidden on admin routes (admin has own navigation)
  - Responsive mobile menu

### Design System
- **Brand Colors:**
  - Background: Black (`#000000`, `bg-black`)
  - Accent: Red (`#D7263D`, `accent`)
  - Neutral tones: `neutral-800`, `neutral-900`, `neutral-950` for cards and borders
- **Typography:**
  - Headings: Anton font (`font-display`) - uppercase, tracking-wider
  - Body: Geist Sans (default) - clean, readable
- **Card Styling:**
  - Standard: `rounded-2xl border border-neutral-800 bg-neutral-900 p-6`
  - Hover effects: `hover:border-[#D7263D]/30`, scale animations
  - Shadows: Red glow effects for emphasis (`shadow-[0_0_40px_-20px_rgba(215,38,61,0.6)]`)
- **Animations:**
  - Framer Motion for page transitions and component animations
  - Subtle hover effects (scale 1.02, y -2)
  - Smooth fade and slide transitions

### Client-Side State Management
- **AppContext** (`src/context/AppContext.tsx`) - Centralized state for:
  - Authentication status (`user`, `loadingAuth`, `loadingUserDoc`)
  - User document data (`userDoc`, `data`)
  - Dashboard data (`purchase`, `macros`, `packageTier`, `isUnlocked`)
  - Loading states (aggregated `loading` flag)
  - Admin status (`isAdmin`, `loadingAdmin`)
  - Error states (`error`, `sessionExpired`)
  - Actions (`refresh`, `signOutAndRedirect`)

### Route Protection
- Multiple guard components for fine-grained access control:
  - `RequireAuth` - Blocks unauthenticated users
  - `RequireAdmin` - Blocks non-admin users
  - `RequireWizard` - Redirects if macro wizard not completed
  - `RequireProfileCompletion` - Ensures profile is complete
  - `RequirePackage` - Blocks users without purchased package
- Guards use optimistic rendering to prevent black screens during navigation
- Layout-level guards ensure proper structure rendering
- Guards track "has rendered before" state to allow instant navigation after initial load

### Data Flow
1. **User Registration** → API route creates user document → Firestore
2. **Macro Wizard** → API route validates and stores → Firestore user document
3. **Purchase** → Stripe Checkout → Webhook creates purchase → Firestore
4. **Meal Plan Delivery** → Admin uploads to Storage → Updates user document → Sends email
5. **Plan Updates** → User submits request → API route creates request → Admin reviews

### Security Model
- **Authorization:** Firebase Auth custom claims (not Firestore fields)
- **Client-Side Writes:** Blocked for sensitive operations (must use API routes)
- **Server-Side Validation:** All writes validated in API routes
- **Storage Access:** Path-based restrictions, no directory listing for users

---

## Email System

### Templates (`emails/`)
- **`meal-plan-delivered.tsx`** - Sent when meal plan is delivered
- **`reminder-email.tsx`** - Sent as reminders about meal plan status
- **`admin-notification.tsx`** - Generic admin notifications
- **`base-email.tsx`** - Base template with consistent branding

All templates use React Email components, are responsive, and follow MacroMinded branding (red accent `#D7263D`).

---

## Middleware

### `src/middleware.ts`
Next.js middleware handles:
- **Impersonation token verification** - Redirects to API route for verification
- **Exit impersonation** - Cleans up impersonation cookie
- Runs on all routes except API routes, static files, and public assets

---

This summary provides a comprehensive overview of the MacroMinded project structure, functionality, and architecture. For specific implementation details, refer to the source code and inline comments.

