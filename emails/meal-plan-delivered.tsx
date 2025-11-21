import * as React from "react";
import { BaseEmail } from "./base-email";
import { Button, Heading, Section, Text } from "@react-email/components";

type MealPlanDeliveredEmailProps = {
  name?: string;
  mealPlanUrl?: string;
  dashboardUrl?: string;
};

export function MealPlanDeliveredEmail({
  name,
  mealPlanUrl,
  dashboardUrl = "https://macrominded.net/dashboard",
}: MealPlanDeliveredEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi there,";

  return (
    <BaseEmail preview="Your personalized meal plan is ready!">
      <Heading
        style={{
          fontSize: "24px",
          fontWeight: "600",
          color: "#111111",
          margin: "0 0 20px 0",
          lineHeight: "1.4",
        }}
      >
        Your Plan Is Ready ✅
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
        Your personalized meal plan has been completed based on your metrics
        and goals.
      </Text>

      {mealPlanUrl ? (
        <Section
          style={{
            margin: "24px 0",
            textAlign: "center",
          }}
        >
          <Button
            href={mealPlanUrl}
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
            Download Your Meal Plan
          </Button>
        </Section>
      ) : (
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
            View Your Meal Plan
          </Button>
        </Section>
      )}

      <Text
        style={{
          fontSize: "16px",
          color: "#333333",
          margin: "24px 0 16px 0",
          lineHeight: "1.6",
        }}
      >
        Follow the guidance consistently. Progress will follow.
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
        <strong>MacroMinded</strong>
      </Text>
    </BaseEmail>
  );
}

