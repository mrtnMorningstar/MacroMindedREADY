import { useToast } from "@/components/ui/Toast";

export function useFriendlyError() {
  const toast = useToast();

  return (error: any) => {
    const message = error?.message || "Something went wrong.";

    // Firebase auth errors
    if (message.includes("auth/user-not-found")) {
      toast.error("No account found with this email.");
      return;
    }
    if (message.includes("auth/wrong-password")) {
      toast.error("Incorrect password. Try again.");
      return;
    }
    if (message.includes("auth/email-already-in-use")) {
      toast.error("This email is already taken.");
      return;
    }
    if (message.includes("auth/weak-password")) {
      toast.error("Password too weak. Use at least 6 characters.");
      return;
    }
    if (message.includes("auth/invalid-email")) {
      toast.error("Invalid email address.");
      return;
    }
    if (message.includes("auth/network-request-failed")) {
      toast.error("Network error. Check your connection.");
      return;
    }

    // Firestore errors
    if (message.includes("permission-denied")) {
      toast.error("You don't have permission to do that.");
      return;
    }
    if (message.includes("not-found")) {
      toast.error("Resource not found.");
      return;
    }
    if (message.includes("unavailable")) {
      toast.error("Service temporarily unavailable. Please try again.");
      return;
    }

    // Stripe-related
    if (message.includes("stripe") || message.includes("payment")) {
      toast.error("Payment failed. Try again.");
      return;
    }

    // Network errors
    if (message.includes("network") || message.includes("fetch")) {
      toast.error("Network error. Please check your connection.");
      return;
    }

    // Default fallback
    toast.error("Something went wrong. Please try again.");
  };
}

