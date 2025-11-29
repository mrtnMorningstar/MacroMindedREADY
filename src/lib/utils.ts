/**
 * Utility function to merge Tailwind CSS classes
 * Simple implementation for class name merging
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

