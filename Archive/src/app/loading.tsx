import FullScreenLoader from "@/components/FullScreenLoader";

/**
 * Root loading state - only used on initial page load, not during navigation.
 * Keep full-screen for the initial load experience.
 */
export default function Loading() {
  return <FullScreenLoader />;
}

