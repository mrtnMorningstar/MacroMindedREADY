import { NextResponse } from "next/server";
import Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";

import { getStripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const relevantEvents = new Set(["checkout.session.completed"]);

export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Webhook signature missing." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (!relevantEvents.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
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

      if (!plan) {
        throw new Error("Missing plan metadata on session.");
      }

      let resolvedUserId: string | null = null;

      if (userId) {
        resolvedUserId = userId;
      } else if (email) {
        const usersSnapshot = await adminDb
          .collection("users")
          .where("email", "==", email)
          .limit(1)
          .get();
        
        if (!usersSnapshot.empty) {
          resolvedUserId = usersSnapshot.docs[0].id;
        }
      }

      if (!resolvedUserId) {
        throw new Error("No user found for completed checkout session.");
      }

      console.log("Updating user document:", resolvedUserId);

      // Get user document to check for referredBy
      const userDoc = await adminDb.collection("users").doc(resolvedUserId).get();
      const userData = userDoc.data();
      const referredBy = userData?.referredBy;

      await adminDb.collection("users").doc(resolvedUserId).set(
        {
          packageTier: plan,
          mealPlanStatus: "Not Started",
          purchaseDate: FieldValue.serverTimestamp(),
          email,
        },
        { merge: true }
      );

      console.log("User document updated successfully");

      // Handle referral credit
      if (referredBy) {
        console.log("Processing referral credit for referrer:", referredBy);
        
        // Find referrer
        const refQuery = await adminDb
          .collection("users")
          .where("referralCode", "==", referredBy)
          .get();

        if (!refQuery.empty) {
          const refDoc = refQuery.docs[0];
          const currentCredits = refDoc.data().referralCredits || 0;
          
          await refDoc.ref.update({
            referralCredits: currentCredits + 1,
          });
          
          console.log(`Referral credit added. Referrer now has ${currentCredits + 1} credits.`);
        } else {
          console.warn(`Referrer with code ${referredBy} not found.`);
        }
      }

      const planType = plan === "Basic" || plan === "Pro" || plan === "Elite" ? plan : "Basic";

      console.log("Creating purchase document");

      await adminDb.collection("purchases").add({
        userId: resolvedUserId,
        planType,
        status: "paid",
        mealPlanUrl: null,
        createdAt: FieldValue.serverTimestamp(),
        deliveredAt: null,
        stripeSessionId: session.id,
        email,
        amount: session.amount_total ? session.amount_total / 100 : null,
      });

      console.log("Purchase document created successfully");
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handling failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to handle webhook.";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log detailed error for debugging
    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      eventType: event?.type,
      sessionId: (event?.data?.object as Stripe.Checkout.Session)?.id,
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

