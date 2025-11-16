import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(request: Request) {
  try {
    const { userId, email, name } = await request.json();

    if (!email || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user data to personalize the email
    const userDoc = await getDoc(doc(db, "users", userId));
    const userData = userDoc.data();
    const packageTier = userData?.packageTier ?? "your plan";
    const mealPlanStatus = userData?.mealPlanStatus ?? "Not Started";

    const greeting = name ? `Hi ${name},` : "Hi there,";

    let statusMessage = "";
    if (mealPlanStatus === "Not Started") {
      statusMessage = "We're working on your personalized meal plan and will have it ready soon.";
    } else if (mealPlanStatus === "In Progress") {
      statusMessage = "Your meal plan is currently being prepared by our team.";
    } else if (mealPlanStatus === "Delivered") {
      statusMessage = "Your meal plan has been delivered! Don't forget to check your dashboard for updates.";
    } else {
      statusMessage = "We wanted to remind you about your MacroMinded meal plan.";
    }

    await sendEmail({
      to: email,
      subject: "Reminder: Your MacroMinded Meal Plan",
      html: `
        <h2 style="font-weight:600; color:#111;">Meal Plan Reminder</h2>
        <p>${greeting}</p>
        <p>${statusMessage}</p>
        <p>Your ${packageTier} plan is an important part of your fitness journey. Stay consistent and follow the guidance provided.</p>
        <p>You can access your dashboard at any time to view your plan, track progress, and request updates.</p>
        <br>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <br>
        <p>Respectfully,<br><strong>MacroMinded Team</strong></p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send reminder email:", error);
    return NextResponse.json(
      { error: "Failed to send reminder email" },
      { status: 500 }
    );
  }
}

