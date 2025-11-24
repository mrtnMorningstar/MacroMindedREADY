"use client";

export default function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black text-white">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#D7263D]/30 border-t-transparent"></div>
          <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-[#D7263D]"></div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold uppercase tracking-[0.3em] text-white mb-2 font-display">
            MacroMinded
          </h2>
          <p className="text-sm uppercase tracking-[0.2em] text-neutral-400">
            Loading your experience...
          </p>
        </div>
      </div>
    </div>
  );
}
