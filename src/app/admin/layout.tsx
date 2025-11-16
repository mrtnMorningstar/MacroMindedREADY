"use client";

import { type ReactNode } from "react";
import AuthGate from "@/components/AuthGate";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthGate requireAuth requireAdmin>
      {children}
    </AuthGate>
  );
}

