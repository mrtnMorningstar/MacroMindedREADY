import { NextResponse } from "next/server";
import Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";

import { getStripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only handle checkout.session.completed events
const HANDLED_EVENT_TYPE = "checkout.session.completed";

// Collection to track processed webhook events for idempotency
const WEBHOOK_EVENTS_COLLECTION = "webhook_events";

/**
 * Check if a webhook event has already been processed
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  try {
    const eventDoc = await adminDb
      .collection(WEBHOOK_EVENTS_COLLECTION)
      .doc(eventId)
      .get();
    return eventDoc.exists;
  } catch (error) {
    console.error("Error checking event processing status:", error);
    // If we can't check, assume not processed to be safe
    return false;
  }
}

/**
 * Mark a webhook event as processed
 */
async function markEventProcessed(
  eventId: string,
  sessionId: string,
  userId: string
): Promise<void> {
  try {
    await adminDb.collection(WEBHOOK_EVENTS_COLLECTION).doc(eventId).set({
      eventId,
      sessionId,
      userId,
      processedAt: FieldValue.serverTimestamp(),
      eventType: HANDLED_EVENT_TYPE,
    });
  } catch (error) {
    console.error("Error marking event as processed:", error);
    // Don't throw - this is not critical for the main flow
  }
}

/**
 * Process checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  // Extract metadata
  const plan = session.metadata?.plan as string | undefined;
  const userId = session.metadata?.userId as string | undefined;
  const email =
    session.metadata?.email ??
    session.customer_details?.email ??
    session.customer_email ??
    "";

  console.log("Processing checkout.session.completed:", {
    sessionId: session.id,
    plan,
    userId,
    email,
  });

  // Validate required metadata
  if (!plan) {
    throw new Error("Missing plan metadata on session.");
  }

  if (!userId) {
    throw new Error("Missing userId metadata on session.");
  }

  // Validate plan tier
  const validPlans = ["Basic", "Pro", "Elite"];
  if (!validPlans.includes(plan)) {
    throw new Error(`Invalid plan tier: ${plan}. Must be one of: ${validPlans.join(", ")}`);
  }

  // Verify user exists
  const userDoc = await adminDb.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    throw new Error(`User document not found for userId: ${userId}`);
  }

  const userData = userDoc.data();
  const referredBy = userData?.referredBy;

  // Update user document with purchase information
  await adminDb.collection("users").doc(userId).set(
    {
      packageTier: plan,
      mealPlanStatus: "Not Started",
      purchaseDate: FieldValue.serverTimestamp(),
      email: email || userData?.email || null,
    },
    { merge: true }
  );

  console.log("User document updated successfully:", userId);

  // Handle referral credit if applicable
  if (referredBy) {
    console.log("Processing referral credit for referrer:", referredBy);

    const refQuery = await adminDb
      .collection("users")
      .where("referralCode", "==", referredBy)
      .limit(1)
      .get();

    if (!refQuery.empty) {
      const refDoc = refQuery.docs[0];
      const currentCredits = refDoc.data()?.referralCredits || 0;

      await refDoc.ref.update({
        referralCredits: currentCredits + 1,
      });

      console.log(
        `Referral credit added. Referrer now has ${currentCredits + 1} credits.`
      );
    } else {
      console.warn(`Referrer with code ${referredBy} not found.`);
    }
  }

  // Create purchase document
  const purchaseData = {
    userId,
    planType: plan,
    status: "paid",
    mealPlanUrl: null,
    createdAt: FieldValue.serverTimestamp(),
    deliveredAt: null,
    stripeSessionId: session.id,
    email: email || null,
    amount: session.amount_total ? session.amount_total / 100 : null,
  };

  await adminDb.collection("purchases").add(purchaseData);

  console.log("Purchase document created successfully for user:", userId);
}

/**
 * POST handler for Stripe webhook
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Validate webhook secret is configured
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured." },
      { status: 500 }
    );
  }

  // Validate signature header
  if (!signature) {
    console.error("Missing Stripe signature header");
    return NextResponse.json(
      { error: "Webhook signature missing." },
      { status: 400 }
    );
  }

  // Get raw body for signature verification
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (error) {
    console.error("Error reading request body:", error);
    return NextResponse.json(
      { error: "Failed to read request body." },
      { status: 400 }
    );
  }

  // Verify webhook signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      { error: "Invalid signature." },
      { status: 400 }
    );
  }

  // Only handle checkout.session.completed events
  if (event.type !== HANDLED_EVENT_TYPE) {
    console.log(`Ignoring event type: ${event.type}`);
    return NextResponse.json({ received: true, ignored: true });
  }

  // Check idempotency - prevent duplicate processing
  const eventId = event.id;
  const isProcessed = await isEventProcessed(eventId);

  if (isProcessed) {
    console.log(`Event ${eventId} already processed, skipping.`);
    return NextResponse.json({
      received: true,
      alreadyProcessed: true,
      eventId,
    });
  }

  // Process the event
  try {
    const session = event.data.object as Stripe.Checkout.Session;

    await handleCheckoutSessionCompleted(session);

    // Mark event as processed for idempotency
    const userId = session.metadata?.userId as string | undefined;
    if (userId) {
      await markEventProcessed(eventId, session.id, userId);
    }

    return NextResponse.json({
      received: true,
      processed: true,
      eventId,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Webhook handling failed:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to handle webhook.";
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Log detailed error for debugging
    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      eventType: event.type,
      eventId: event.id,
      sessionId: (event.data.object as Stripe.Checkout.Session)?.id,
    });

    return NextResponse.json(
      {
        error: errorMessage,
        ...(process.env.NODE_ENV === "development" && { stack: errorStack }),
      },
      { status: 500 }
    );
  }
}

