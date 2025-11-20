"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { loading, isAdmin, firebaseUser } = useUser();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="animate-pulse text-sm">Checking admin access…</div>
      </div>
    );
  }

  if (!firebaseUser || !isAdmin) {
    router.replace("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {children}
    </div>
  );
}
