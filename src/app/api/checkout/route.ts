import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";

type PlanTier = "Basic" | "Pro" | "Elite";

const priceMap: Record<PlanTier, string> = {
  Basic: "price_basic_placeholder",
  Pro: "price_pro_placeholder",
  Elite: "price_elite_placeholder",
};

function getBaseUrl(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) return origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { plan } = body as { plan?: PlanTier };

    if (!plan || !(plan in priceMap)) {
      return NextResponse.json(
        { error: "Invalid or missing plan tier." },
        { status: 400 }
      );
    }

    const priceId = priceMap[plan];
    if (!priceId || priceId.includes("placeholder")) {
      return NextResponse.json(
        { error: "Stripe price ID not configured for this plan." },
        { status: 500 }
      );
    }

    const baseUrl = getBaseUrl(request);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
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
    return NextResponse.json(
      { error: "Unable to create checkout session." },
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

