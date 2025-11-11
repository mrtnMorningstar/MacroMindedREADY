import { Resend } from "resend";

type SendMealPlanPayload = {
  to: string;
  downloadLink: string;
};

const resendApiKey = process.env.RESEND_API_KEY ?? null;
const emailFrom = process.env.EMAIL_FROM ?? null;

let resendClient: Resend | null = null;

function getClient(): Resend {
  if (!resendClient) {
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured.");
    }
    resendClient = new Resend(resendApiKey);
  }
  return resendClient;
}

export async function sendMealPlanEmail({
  to,
  downloadLink,
}: SendMealPlanPayload) {
  if (!emailFrom) {
    throw new Error("EMAIL_FROM is not configured.");
  }
  const client = getClient();

  await client.emails.send({
    from: emailFrom,
    to,
    subject: "Your Custom Meal Plan is Ready ✅",
    html: `
      <h2>Your Meal Plan is Ready!</h2>
      <p>Thank you for trusting MacroMinded.</p>
      <p>Your personalized meal plan is now available in your dashboard and can be downloaded here:</p>
      <a href="${downloadLink}">Download Meal Plan</a>
      <br /><br />
      <p>Stay consistent — you’ve got this.</p>
    `,
  });
}
