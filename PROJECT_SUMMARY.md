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
- **Overview Page** - Personalized welcome, meal plan status, daily targets, referrals summary
- **Meal Plan Page** - Timeline view of plan delivery (In Queue → In Progress → Delivered)
- **Profile Page** - User profile management, BMI calculator, macro goals
- **Referrals Page** - Referral code sharing, credits earned, QR code placeholder
- **Support Page** - FAQ accordion, contact information

### Admin Panel (`/admin`)
- **Dashboard** - Overview statistics, recent clients, pending tasks, activity feed
- **Clients** - List all users, view client details, impersonation feature
- **Sales/Revenue** - Sales metrics and analytics
- **Referrals** - Referral program management
- **Plan Requests** - Manage meal plan update requests from clients
- **Recipes** - Recipe library management
- **Manage Admins** - Grant/revoke admin privileges
- **Settings** - Platform settings (3 tabs: Platform Settings, Admin Controls, Data Management)
- **Analytics** - Data visualization and metrics

### Macro Wizard (`/macro-wizard`)
- Multi-step form to collect user health and dietary information
- Calculates estimated daily macros (calories, protein, carbs, fats)
- Stores data in Firestore user document
- Required before accessing dashboard content

### Payment Flow (`/packages`)
- Package selection (Basic, Pro, Elite tiers)
- Stripe Checkout integration
- Webhook handler for payment confirmation
- Purchase creation in Firestore

### API Routes (`/api`)
- **Admin APIs:**
  - `/api/admin/setAdminRole` - Grant/revoke admin privileges
  - `/api/admin/impersonate` - Generate impersonation tokens
  - `/api/admin/verify-impersonation` - Verify and consume impersonation tokens
  - `/api/admin/update-settings` - Update admin settings
  - `/api/admin/send-reminder-email` - Send reminder emails to users
- **User APIs:**
  - `/api/user/create-user-document` - Create user document on registration
  - `/api/user/submit-macro-wizard` - Submit macro wizard data
  - `/api/user/create-plan-update-request` - Create plan update request
- **Payment APIs:**
  - `/api/checkout` - Create Stripe checkout session
  - `/api/webhook` - Handle Stripe webhooks
- **Other APIs:**
  - `/api/mark-plan-delivered` - Mark meal plan as delivered
  - `/api/notifications/meal-plan` - Send meal plan notifications

### Scripts
- **`scripts/setAdmin.ts`** - TypeScript script to grant admin role to a user (uses dotenv)
- **`setAdminRole.js`** - Node.js script to grant admin role (uses service account JSON)
- **`checkClaims.js`** - Utility to check Firebase custom claims for a user

---

## Firebase Integration

### Authentication
- Email/password authentication via Firebase Auth
- Custom claims used for admin authorization (`admin: true` in token)
- Session management handled client-side via `AppContext`

### Firestore Database
Collections:
- **`users`** - User profiles, meal plan status, macros, referral data
- **`purchases`** - Purchase records linked to Stripe sessions
- **`planUpdateRequests`** - User requests for meal plan modifications
- **`recipes`** - Recipe library accessible to all authenticated users
- **`adminSettings`** - Platform configuration (stored in `adminSettings/global`)
- **`adminActivity`** - Logs for admin actions (e.g., impersonation)

### Firebase Storage
- **Path Structure:** `/mealPlans/{userId}/plan.pdf`, `/mealPlans/{userId}/images/{imageName}`, `/mealPlans/{userId}/groceryList.pdf`
- Users can only download their own meal plans
- Admins have full read/write/delete access
- Directory listing restricted to admins (prevents URL guessing)

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

### Client-Side State Management
- **AppContext** (`src/context/AppContext.tsx`) - Centralized state for:
  - Authentication status
  - User document data
  - Dashboard data
  - Loading states
  - Admin status

### Route Protection
- Multiple guard components for fine-grained access control
- Guards use optimistic rendering to prevent black screens during navigation
- Layout-level guards ensure proper structure rendering

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

