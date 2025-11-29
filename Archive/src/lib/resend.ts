import { sendEmail } from "./email";
import { MealPlanDeliveredEmail } from "../../emails/meal-plan-delivered";

type SendMealPlanPayload = {
  to: string;
  downloadLink: string;
  name?: string;
};

/**
 * Send meal plan delivery email using React Email template
 * @deprecated Use sendEmail with MealPlanDeliveredEmail directly instead
 */
export async function sendMealPlanEmail({
  to,
  downloadLink,
  name,
}: SendMealPlanPayload) {
  await sendEmail({
    to,
    subject: "Your Custom Meal Plan is Ready ✅",
    react: MealPlanDeliveredEmail({
      name: name || undefined,
      mealPlanUrl: downloadLink,
      dashboardUrl: process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
        : undefined,
    }),
  });
}
