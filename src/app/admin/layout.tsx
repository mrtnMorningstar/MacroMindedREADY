"use client";

import { type ReactNode } from "react";
import AdminLayoutWrapper from "@/components/admin/AdminLayout";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}
