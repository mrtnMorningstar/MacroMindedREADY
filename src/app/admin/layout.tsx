"use client";

import { type ReactNode } from "react";
import AdminLayoutWrapper from "@/components/admin/AdminLayout";
import { RequireAdmin } from "@/components/guards";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RequireAdmin>
      <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
    </RequireAdmin>
  );
}
