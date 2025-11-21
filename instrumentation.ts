export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Instrument request errors from nested React Server Components
export async function onRequestError(
  err: Error,
  request: {
    path: string;
    method: string;
    headers: Headers;
  },
  context: {
    routerKind: string;
    routePath: string;
  }
) {
  const { captureRequestError } = await import("@sentry/nextjs");
  captureRequestError(err, request, context);
}

