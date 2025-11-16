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
    const { plan, userId, email, profile } = body as {
      plan?: PlanTier;
      userId?: string;
      email?: string;
      profile?: {
        age?: string;
        height?: string;
        weight?: string;
        gender?: string;
        activityLevel?: string;
        goal?: string;
        allergies?: string;
        foodsLove?: string;
        foodsHate?: string;
      };
    };

    if (!plan || !(plan in PRICE_IDS) || !userId) {
      return NextResponse.json(
        { error: "Invalid or missing plan tier or user information." },
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

    // Store profile data in Firestore before checkout (temporary storage)
    // This will be merged with the user document after payment
    let profileData = null;
    if (profile && userId) {
      try {
        const { getAdminDb } = await import("@/lib/firebase-admin");
        const adminDb = getAdminDb();
        await adminDb.collection("users").doc(userId).set(
          {
            profile: {
              age: profile.age,
              height: profile.height,
              weight: profile.weight,
              gender: profile.gender,
              activityLevel: profile.activityLevel,
              goal: profile.goal,
              allergies: profile.allergies || null,
              preferences: profile.foodsLove || null,
              dietaryRestrictions: profile.foodsHate || null,
            },
          },
          { merge: true }
        );
        profileData = profile;
      } catch (profileError) {
        console.error("Failed to save profile data:", profileError);
        // Continue with checkout even if profile save fails
      }
    }

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
        hasProfile: profileData ? "true" : "false",
      },
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

