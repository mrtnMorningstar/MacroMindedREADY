import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

import { sendMealPlanEmail } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email as string | undefined;
    const downloadLink = body?.downloadLink as string | undefined;

    if (!email || !downloadLink) {
      return NextResponse.json(
        { error: "Missing email or download link." },
        { status: 400 }
      );
    }

    await sendMealPlanEmail({ to: email, downloadLink });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send meal plan email", error);
    
    // Capture error to Sentry
    Sentry.captureException(error, {
      tags: {
        route: "/api/notifications/meal-plan",
        type: "email_error",
      },
    });
    
    return NextResponse.json(
      { error: "Failed to send meal plan email." },
      { status: 500 }
    );
  }
}
