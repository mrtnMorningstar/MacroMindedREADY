"use client";

export default function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-[#D7263D] border-t-transparent animate-spin" />
        <p className="text-sm text-neutral-300">Loading…</p>
      </div>
    </div>
  );
}
