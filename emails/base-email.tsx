import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Link,
  Button,
} from "@react-email/components";
import * as React from "react";

type BaseEmailProps = {
  children: React.ReactNode;
  preview?: string;
};

export function BaseEmail({ children, preview }: BaseEmailProps) {
  return (
    <Html>
      <Head />
      <Body
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          backgroundColor: "#f6f6f6",
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "20px",
            backgroundColor: "#ffffff",
          }}
        >
          {/* Preview text for email clients */}
          {preview && (
            <Text
              style={{
                display: "none",
                fontSize: "1px",
                color: "#ffffff",
                lineHeight: "1px",
                maxHeight: "0px",
                maxWidth: "0px",
                opacity: 0,
                overflow: "hidden",
              }}
            >
              {preview}
            </Text>
          )}

          {/* Header */}
          <Section
            style={{
              padding: "20px 0",
              textAlign: "center",
              borderBottom: "2px solid #D7263D",
            }}
          >
            <Heading
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#D7263D",
                margin: "0",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              MacroMinded
            </Heading>
          </Section>

          {/* Content */}
          <Section
            style={{
              padding: "30px 20px",
              backgroundColor: "#ffffff",
            }}
          >
            {children}
          </Section>

          {/* Footer */}
          <Hr
            style={{
              borderColor: "#e0e0e0",
              margin: "30px 0",
            }}
          />
          <Section
            style={{
              padding: "20px",
              textAlign: "center",
              backgroundColor: "#fafafa",
            }}
          >
            <Text
              style={{
                fontSize: "12px",
                color: "#666666",
                margin: "8px 0",
                lineHeight: "1.6",
              }}
            >
              © {new Date().getFullYear()} MacroMinded. All rights reserved.
            </Text>
            <Text
              style={{
                fontSize: "12px",
                color: "#666666",
                margin: "8px 0",
                lineHeight: "1.6",
              }}
            >
              If you have any questions, contact us at{" "}
              <Link
                href="mailto:support@macrominded.net"
                style={{
                  color: "#D7263D",
                  textDecoration: "underline",
                }}
              >
                support@macrominded.net
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Re-export components for convenience
export { Button, Heading, Section, Text, Link } from "@react-email/components";
