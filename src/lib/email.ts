"use server";

import { Resend } from "resend";
import { render } from "@react-email/render";
import type { ReactElement } from "react";

type SendEmailArgs = {
  to: string;
  subject: string;
  html?: string;
  react?: ReactElement;
};

// Lazy initialization to avoid errors during build
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured.");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Send an email using Resend
 * Can use either HTML string or React Email component
 */
export async function sendEmail({ to, subject, html, react }: SendEmailArgs) {
  const emailFrom = process.env.EMAIL_FROM;
  if (!emailFrom) {
    throw new Error("EMAIL_FROM is not configured.");
  }

  // If React component is provided, render it to HTML
  if (react) {
    html = await render(react);
  }

  if (!html) {
    throw new Error("Either html or react must be provided.");
  }

  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: emailFrom, // must be support@macrominded.net
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Email send error:", err);
    throw err;
  }
}

