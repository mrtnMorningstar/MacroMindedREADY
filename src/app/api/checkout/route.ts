import { NextResponse } from "next/server";

import { getStripe } from "@/lib/stripe";
import { PRICE_IDS } from "@/lib/prices";

type PlanTier = "Basic" | "Pro" | "Elite";

function getBaseUrl(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) return origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { plan } = body as { plan?: PlanTier };

    if (!plan || !(plan in PRICE_IDS)) {
      return NextResponse.json(
        { error: "Invalid or missing plan tier." },
        { status: 400 }
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
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/packages/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/packages/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Failed to create checkout session:", error);
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

