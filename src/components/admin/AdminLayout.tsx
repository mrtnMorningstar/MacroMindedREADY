"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminSidebar, useSidebar } from "./AdminSidebar";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireAdmin } from "@/components/auth/RequireAdmin";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayoutWrapper({ children }: AdminLayoutProps) {
  const { isOpen } = useSidebar();
  const pathname = usePathname();

  return (
    <RequireAuth>
      <RequireAdmin>
        <div className="flex min-h-screen bg-black text-white">
          <AdminSidebar />

          {/* Main Content Area */}
          <div
            className={`flex-1 transition-all duration-300 ${
              isOpen ? "lg:ml-64" : "lg:ml-20"
            }`}
          >
            {/* Top Bar */}
            <header className="sticky top-0 z-30 border-b border-neutral-800 bg-neutral-900 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Link href="/admin" className="text-xl font-bold uppercase tracking-wide text-white">
                    MacroMinded
                  </Link>
                  <span className="text-sm text-neutral-400">Admin Panel</span>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href="/recipes"
                    className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-700"
                  >
                    View Site
                  </Link>
                  <Link
                    href="/admin/recipes"
                    className="rounded-lg border border-[#D7263D] bg-[#D7263D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90"
                  >
                    Create Recipe
                  </Link>
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main className="p-6">
              {children}
            </main>
          </div>
        </div>
      </RequireAdmin>
    </RequireAuth>
  );
}

