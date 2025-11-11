import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  setDoc,
  where,
  serverTimestamp,
  type DocumentReference,
} from "firebase/firestore";

import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/firebase";

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

      if (!plan) {
        throw new Error("Missing plan metadata on session.");
      }

      let userDocRef: DocumentReference | null = null;

      if (userId) {
        userDocRef = doc(db, "users", userId);
      } else if (email) {
        const usersRef = collection(db, "users");
        const userQuery = query(
          usersRef,
          where("email", "==", email),
          limit(1)
        );
        const snapshot = await getDocs(userQuery);
        const match = snapshot.docs[0];
        if (match) {
          userDocRef = doc(db, "users", match.id);
        }
      }

      if (!userDocRef) {
        throw new Error("No user found for completed checkout session.");
      }

      const resolvedUserId = userDocRef.id;

      await setDoc(
        userDocRef,
        {
          packageTier: plan,
          mealPlanStatus: "Not Started",
          purchaseDate: serverTimestamp(),
          email,
        },
        { merge: true }
      );

      const planType = plan === "Basic" || plan === "Pro" || plan === "Elite" ? plan : "Basic";
      const purchasesRef = collection(db, "purchases");
      const purchaseRef = doc(purchasesRef);

      await setDoc(purchaseRef, {
        userId: resolvedUserId,
        planType,
        status: "paid",
        mealPlanUrl: null,
        createdAt: serverTimestamp(),
        deliveredAt: null,
        stripeSessionId: session.id,
        email,
        amount: session.amount_total ? session.amount_total / 100 : null,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handling failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to handle webhook.",
      },
      { status: 500 }
    );
  }
}

