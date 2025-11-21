# Sentry Integration Setup

This project uses Sentry for error tracking and performance monitoring across frontend and backend.

## Configuration

### Environment Variables

Add the following to your `.env.local` file:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_DSN=your_sentry_dsn_here  # Optional, falls back to NEXT_PUBLIC_SENTRY_DSN
SENTRY_ORG=macrominded  # Default: macrominded (can be overridden via env var)
SENTRY_PROJECT=javascript-nextjs  # Default: javascript-nextjs (can be overridden via env var)
SENTRY_AUTH_TOKEN=your_auth_token  # For source map uploads
```

**Note:** The org and project are pre-configured as `macrominded` and `javascript-nextjs` respectively. You can override them with environment variables if needed.

### Getting Your Sentry DSN

1. Go to [Sentry.io](https://sentry.io) and create an account or log in
2. Create a new project (select Next.js)
3. Copy your DSN from the project settings
4. Add it to your environment variables

## Features

### Frontend Error Tracking
- Automatic error capture from React components
- Error boundaries for graceful error handling
- User session replay on errors
- Performance monitoring

### Backend Error Tracking
- All API routes are instrumented with Sentry
- Webhook errors are captured with context
- Sensitive data is automatically stripped

### Data Scrubbing
The following sensitive data is automatically removed:
- Authorization headers
- Cookies
- API keys
- Stripe webhook signatures
- Passwords and tokens
- User email addresses (from user context)

## Error Boundaries

- **Global Error Boundary**: Wraps the entire app in `src/app/layout.tsx`
- **Page Error Boundary**: `src/app/error.tsx` handles page-level errors
- **Component Error Boundary**: `src/components/ErrorBoundary.tsx` for component-level errors

## API Route Instrumentation

All API routes automatically capture errors to Sentry. The following routes are instrumented:
- `/api/checkout`
- `/api/webhook/stripe`
- `/api/webhook`
- `/api/admin/*`
- `/api/mark-plan-delivered`
- `/api/notifications/*`

## Webhook Error Tracking

Stripe webhook errors are captured with full context:
- Event ID
- Event type
- Session ID
- Error message and stack trace

## Performance Monitoring

- Traces sample rate: 10% in production, 100% in development
- Session replay: 10% of sessions, 100% on errors

## Manual Error Reporting

You can manually capture errors:

```typescript
import * as Sentry from "@sentry/nextjs";

try {
  // Your code
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      custom_tag: "value",
    },
    extra: {
      additional_data: "value",
    },
  });
}
```

## User Context

User context is automatically set when users log in via `AuthContext`. To manually set user context:

```typescript
import { setSentryUser, clearSentryUser } from "@/lib/sentry";

setSentryUser({
  id: userId,
  email: userEmail,
  username: userName,
});

// Clear when user logs out
clearSentryUser();
```

## Source Maps

Source maps are automatically uploaded during build when `SENTRY_AUTH_TOKEN` is configured. This enables readable stack traces in Sentry.

## Monitoring Route

Sentry uses a tunnel route at `/monitoring` to bypass ad-blockers. This route is configured in `next.config.ts`.

