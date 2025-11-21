import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

import { getStripe } from "@/lib/stripe";
import { PRICE_IDS } from "@/lib/prices";
import { getAdminAuth } from "@/lib/firebase-admin";
import type { DecodedIdToken } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlanTier = "Basic" | "Pro" | "Elite";

function getBaseUrl(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) return origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * Secure API route to create a Stripe checkout session
 * 
 * Requirements:
 * - Only authenticated users can create checkout sessions
 * - Validates plan tier and user information
 * - Creates Stripe checkout session with proper metadata
 */
export async function POST(request: Request) {
  let decodedToken: DecodedIdToken | undefined;
  let body: { plan?: PlanTier; userId?: string; email?: string } | undefined;

  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized. Missing or invalid authorization header." },
        { status: 401 }
      );
    }

    const idToken = authHeader.replace("Bearer ", "");

    // Verify the token and get the user
    const adminAuth = getAdminAuth();
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken) as DecodedIdToken;
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json(
        { error: "Unauthorized. Invalid token." },
        { status: 401 }
      );
    }

    // Parse request body
    body = await request.json() as { plan?: PlanTier; userId?: string; email?: string };
    const { plan, userId, email } = body;

    // Validate input
    if (!plan || typeof plan !== "string" || !(plan in PRICE_IDS)) {
      return NextResponse.json(
        { error: "Invalid or missing plan tier." },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Missing user information." },
        { status: 400 }
      );
    }

    // Verify userId matches the authenticated user
    if (userId !== decodedToken.uid) {
      return NextResponse.json(
        { error: "Forbidden. Cannot create checkout session for another user." },
        { status: 403 }
      );
    }

    const priceId = PRICE_IDS[plan];
    if (!priceId || priceId.includes("placeholder")) {
      return NextResponse.json(
        { error: "Stripe price ID not configured for this plan." },
        { status: 500 }
      );
    }

    const baseUrl = getBaseUrl(request);

    const stripe = getStripe();

    const price = await stripe.prices.retrieve(priceId);

    if (!price.active) {
      return NextResponse.json(
        { error: "Selected plan is currently unavailable." },
        { status: 400 }
      );
    }

    const mode = price.type === "recurring" ? "subscription" : "payment";

    const session = await stripe.checkout.sessions.create({
      mode,
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        plan,
        userId,
        email: email ?? "",
      },
      success_url: `${baseUrl}/packages/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/packages/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    
    // Capture error to Sentry
    Sentry.captureException(error, {
      tags: {
        route: "/api/checkout",
        type: "checkout_error",
      },
      extra: {
        plan: body?.plan,
        userId: body?.userId,
        requesterUid: decodedToken?.uid,
      },
    });
    
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create checkout session.";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json(
    { message: "Method not allowed" },
    { status: 405, headers: { Allow: "POST" } }
  );
}

