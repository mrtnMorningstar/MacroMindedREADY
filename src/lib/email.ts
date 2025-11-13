"use server";

import { Resend } from "resend";

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
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

export async function sendEmail({ to, subject, html }: SendEmailArgs) {
  const emailFrom = process.env.EMAIL_FROM;
  if (!emailFrom) {
    throw new Error("EMAIL_FROM is not configured.");
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
  }
}

