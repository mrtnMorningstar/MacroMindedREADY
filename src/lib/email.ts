import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM, // must be support@macrominded.net
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Email send error:", err);
  }
}

