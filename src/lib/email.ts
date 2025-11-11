import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const emailFrom = process.env.EMAIL_FROM;

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailArgs) {
  if (!emailFrom) {
    throw new Error("EMAIL_FROM is not configured.");
  }

  try {
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

