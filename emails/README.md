# Email Templates

This directory contains React Email templates for MacroMinded. All templates use consistent branding, are responsive, and work in both light and dark email clients.

## Templates

### `meal-plan-delivered.tsx`
Email sent when a meal plan is delivered to a user.

**Props:**
- `name?: string` - User's name
- `mealPlanUrl?: string` - Direct download link for the meal plan
- `dashboardUrl?: string` - Link to user's dashboard (defaults to `https://macrominded.net/dashboard`)

**Usage:**
```typescript
import { MealPlanDeliveredEmail } from "../../emails/meal-plan-delivered";
import { sendEmail } from "@/lib/email";

await sendEmail({
  to: userEmail,
  subject: "Your Custom Meal Plan is Ready",
  react: MealPlanDeliveredEmail({
    name: userName,
    mealPlanUrl: downloadUrl,
  }),
});
```

### `reminder-email.tsx`
Reminder email sent to users about their meal plan status.

**Props:**
- `name?: string` - User's name
- `packageTier?: string` - User's package tier (e.g., "Basic", "Pro", "Elite")
- `mealPlanStatus?: string` - Current meal plan status
- `dashboardUrl?: string` - Link to user's dashboard

**Usage:**
```typescript
import { ReminderEmail } from "../../emails/reminder-email";

await sendEmail({
  to: userEmail,
  subject: "Reminder: Your MacroMinded Meal Plan",
  react: ReminderEmail({
    name: userName,
    packageTier: "Pro",
    mealPlanStatus: "In Progress",
  }),
});
```

### `admin-notification.tsx`
Generic admin notification email template.

**Props:**
- `title: string` - Email title
- `message: string` - Main message content
- `actionUrl?: string` - Optional CTA button URL
- `actionLabel?: string` - CTA button label (default: "View Details")
- `details?: Array<{ label: string; value: string }>` - Optional details array

**Usage:**
```typescript
import { AdminNotificationEmail } from "../../emails/admin-notification";

await sendEmail({
  to: adminEmail,
  subject: "New Plan Update Request",
  react: AdminNotificationEmail({
    title: "New Plan Update Request",
    message: "A user has requested an update to their meal plan.",
    actionUrl: "https://macrominded.net/admin/requests",
    actionLabel: "View Request",
    details: [
      { label: "User", value: "John Doe" },
      { label: "Package", value: "Pro" },
    ],
  }),
});
```

### `base-email.tsx`
Base template component with consistent branding (header, footer, styles).

**Props:**
- `children: React.ReactNode` - Email content
- `preview?: string` - Preview text for email clients

## Branding

All templates use consistent branding:
- **Primary Color:** `#D7263D` (MacroMinded red)
- **Font:** System fonts (-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto)
- **Max Width:** 600px
- **Background:** Light gray (`#f6f6f6`) with white content area

## Features

- ✅ Responsive design
- ✅ Consistent branding
- ✅ Works in light/dark email clients
- ✅ Proper typography and spacing
- ✅ CTA buttons with brand colors
- ✅ Preview text support
- ✅ Accessible markup

## Development

To preview emails locally:

```bash
# Install React Email CLI
npm install -g react-email

# Start email preview server
npx react-email dev
```

## Adding New Templates

1. Create a new `.tsx` file in this directory
2. Import and use `BaseEmail` as the wrapper
3. Use components from `@react-email/components`
4. Follow the existing pattern for props and styling
5. Export from `index.ts`

