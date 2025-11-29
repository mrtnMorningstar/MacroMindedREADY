/**
 * Loading state for admin routes.
 * Shows a subtle loading indicator that doesn't block the layout.
 */
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px] w-full">
      <div className="text-center">
        <div className="h-8 w-8 border-2 border-[#D7263D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-neutral-400">Loading...</p>
      </div>
    </div>
  );
}

