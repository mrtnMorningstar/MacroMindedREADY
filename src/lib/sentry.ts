import * as Sentry from "@sentry/nextjs";

/**
 * Wrap an API route handler with Sentry error tracking
 */
export function withSentryErrorHandling<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  routeName?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      // Capture exception to Sentry
      Sentry.captureException(error, {
        tags: {
          route: routeName || "unknown",
          type: "api_error",
        },
        extra: {
          args: args.map((arg) => {
            // Strip sensitive data from request objects
            if (arg instanceof Request) {
              return {
                url: arg.url,
                method: arg.method,
                headers: Object.fromEntries(
                  Array.from(arg.headers.entries()).filter(
                    ([key]) =>
                      !["authorization", "cookie", "x-api-key", "stripe-signature"].includes(
                        key.toLowerCase()
                      )
                  )
                ),
              };
            }
            return arg;
          }),
        },
      });

      // Re-throw to let Next.js handle the error response
      throw error;
    }
  }) as T;
}

/**
 * Capture a webhook error with context
 */
export function captureWebhookError(
  error: Error | unknown,
  context: {
    webhookType: string;
    eventId?: string;
    eventType?: string;
    [key: string]: any;
  }
) {
  Sentry.captureException(error, {
    tags: {
      type: "webhook_error",
      webhook_type: context.webhookType,
      event_type: context.eventType || "unknown",
    },
    extra: {
      ...context,
      // Remove sensitive data
      signature: undefined,
      secret: undefined,
      webhookSecret: undefined,
    },
  });
}

/**
 * Set user context for Sentry
 */
export function setSentryUser(user: {
  id: string;
  email?: string;
  username?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

