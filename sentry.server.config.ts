import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  
  integrations: [
    Sentry.nodeProfilingIntegration(),
  ],
  
  // Filter out sensitive data
  beforeSend(event, hint) {
    // Remove sensitive data from event
    if (event.request) {
      // Remove sensitive headers
      if (event.request.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
        delete event.request.headers["x-api-key"];
        delete event.request.headers["stripe-signature"];
      }
      
      // Remove sensitive query params
      if (event.request.query_string) {
        const params = new URLSearchParams(event.request.query_string);
        params.delete("token");
        params.delete("key");
        params.delete("secret");
        params.delete("apiKey");
        event.request.query_string = params.toString();
      }
      
      // Remove sensitive body data
      if (event.request.data) {
        const data = event.request.data;
        if (typeof data === "object") {
          delete data.password;
          delete data.token;
          delete data.apiKey;
          delete data.secret;
          delete data.privateKey;
          delete data.accessToken;
          delete data.refreshToken;
          delete data.authorization;
          // Remove Stripe webhook signature
          if (data.stripeSignature) {
            delete data.stripeSignature;
          }
        }
      }
    }
    
    // Remove sensitive user data
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    
    // Remove sensitive tags
    if (event.tags) {
      delete event.tags.email;
      delete event.tags.token;
    }
    
    return event;
  },
  
  // Filter out certain errors
  ignoreErrors: [
    // Firebase errors that are expected
    "auth/user-not-found",
    "auth/wrong-password",
    "auth/email-already-in-use",
    "auth/network-request-failed",
    // Network errors
    "ECONNREFUSED",
    "ETIMEDOUT",
    "ENOTFOUND",
  ],
});

