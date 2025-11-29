"use client";

import { useAppContext } from "@/context";

export default function DebugAuthOverlay() {
  const c = useAppContext();
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="fixed bottom-3 left-3 z-[9999] rounded-lg bg-black/80 px-3 py-2 text-[11px] text-neutral-300">
      <div>auth:{String(c.loadingAuth)} doc:{String(c.loadingUserDoc)} admin:{String(c.loadingAdmin)}</div>
      <div>user:{!!c.user ? "yes" : "no"} unlocked:{String(c.isUnlocked)}</div>
    </div>
  );
}

