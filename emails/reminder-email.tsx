import * as React from "react";
import { BaseEmail } from "./base-email";
import { Button, Heading, Section, Text } from "@react-email/components";

type ReminderEmailProps = {
  name?: string;
  packageTier?: string;
  mealPlanStatus?: string;
  dashboardUrl?: string;
};

export function ReminderEmail({
  name,
  packageTier = "your plan",
  mealPlanStatus = "Not Started",
  dashboardUrl = "https://macrominded.net/dashboard",
}: ReminderEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi there,";

  let statusMessage = "";
  if (mealPlanStatus === "Not Started") {
    statusMessage =
      "We're working on your personalized meal plan and will have it ready soon.";
  } else if (mealPlanStatus === "In Progress") {
    statusMessage =
      "Your meal plan is currently being prepared by our team.";
  } else if (mealPlanStatus === "Delivered") {
    statusMessage =
      "Your meal plan has been delivered! Don't forget to check your dashboard for updates.";
  } else {
    statusMessage = "We wanted to remind you about your MacroMinded meal plan.";
  }

  return (
    <BaseEmail preview="A friendly reminder about your MacroMinded meal plan">
      <Heading
        style={{
          fontSize: "24px",
          fontWeight: "600",
          color: "#111111",
          margin: "0 0 20px 0",
          lineHeight: "1.4",
        }}
      >
        Meal Plan Reminder
      </Heading>

      <Text
        style={{
          fontSize: "16px",
          color: "#333333",
          margin: "0 0 16px 0",
          lineHeight: "1.6",
        }}
      >
        {greeting}
      </Text>

      <Text
        style={{
          fontSize: "16px",
          color: "#333333",
          margin: "0 0 16px 0",
          lineHeight: "1.6",
        }}
      >
        {statusMessage}
      </Text>

      <Text
        style={{
          fontSize: "16px",
          color: "#333333",
          margin: "0 0 24px 0",
          lineHeight: "1.6",
        }}
      >
        Your <strong>{packageTier}</strong> plan is an important part of your
        fitness journey. Stay consistent and follow the guidance provided.
      </Text>

      <Section
        style={{
          margin: "24px 0",
          textAlign: "center",
        }}
      >
        <Button
          href={dashboardUrl}
          style={{
            backgroundColor: "#D7263D",
            color: "#ffffff",
            padding: "14px 28px",
            borderRadius: "6px",
            textDecoration: "none",
            fontSize: "16px",
            fontWeight: "600",
            display: "inline-block",
          }}
        >
          View Your Dashboard
        </Button>
      </Section>

      <Text
        style={{
          fontSize: "16px",
          color: "#333333",
          margin: "24px 0 16px 0",
          lineHeight: "1.6",
        }}
      >
        You can access your dashboard at any time to view your plan, track
        progress, and request updates.
      </Text>

      <Text
        style={{
          fontSize: "16px",
          color: "#333333",
          margin: "24px 0 0 0",
          lineHeight: "1.6",
        }}
      >
        If you have any questions, feel free to reach out to our support team.
      </Text>

      <Text
        style={{
          fontSize: "16px",
          color: "#333333",
          margin: "24px 0 0 0",
          lineHeight: "1.6",
        }}
      >
        Respectfully,
        <br />
        <strong>MacroMinded Team</strong>
      </Text>
    </BaseEmail>
  );
}

