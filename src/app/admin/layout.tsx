"use client";

import { type ReactNode } from "react";
import { RequireAuth } from "@/components/auth";
import { RequireAdmin } from "@/components/auth";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RequireAuth>
      <RequireAdmin>
        {children}
      </RequireAdmin>
    </RequireAuth>
  );
}

