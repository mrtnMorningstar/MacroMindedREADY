import * as React from "react";
import { BaseEmail } from "./base-email";
import { Button, Heading, Section, Text, Link } from "@react-email/components";

type AdminNotificationEmailProps = {
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  details?: Array<{ label: string; value: string }>;
};

export function AdminNotificationEmail({
  title,
  message,
  actionUrl,
  actionLabel = "View Details",
  details,
}: AdminNotificationEmailProps) {
  return (
    <BaseEmail preview={title}>
      <Heading
        style={{
          fontSize: "24px",
          fontWeight: "600",
          color: "#111111",
          margin: "0 0 20px 0",
          lineHeight: "1.4",
        }}
      >
        {title}
      </Heading>

      <Text
        style={{
          fontSize: "16px",
          color: "#333333",
          margin: "0 0 16px 0",
          lineHeight: "1.6",
        }}
      >
        {message}
      </Text>

      {details && details.length > 0 && (
        <Section
          style={{
            margin: "24px 0",
            padding: "16px",
            backgroundColor: "#f9f9f9",
            borderRadius: "6px",
          }}
        >
          {details.map((detail, index) => (
            <Text
              key={index}
              style={{
                fontSize: "14px",
                color: "#333333",
                margin: "8px 0",
                lineHeight: "1.6",
              }}
            >
              <strong>{detail.label}:</strong> {detail.value}
            </Text>
          ))}
        </Section>
      )}

      {actionUrl && (
        <Section
          style={{
            margin: "24px 0",
            textAlign: "center",
          }}
        >
          <Button
            href={actionUrl}
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
            {actionLabel}
          </Button>
        </Section>
      )}

      <Text
        style={{
          fontSize: "14px",
          color: "#666666",
          margin: "24px 0 0 0",
          lineHeight: "1.6",
        }}
      >
        This is an automated notification from the MacroMinded admin system.
      </Text>
    </BaseEmail>
  );
}

