"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import PageTransition from "@/components/ui/PageTransition";

type ConditionalLayoutProps = {
  children: ReactNode;
  navbar?: ReactNode;
  footer?: ReactNode;
};

/**
 * Conditionally wraps children based on the current route.
 * - On admin routes: Renders children directly without Navbar/Footer/PageTransition (admin layout handles everything)
 * - On dashboard routes: Renders children directly (DashboardShell handles its own structure)
 * - On other routes: Wraps children in the standard layout structure with Navbar and Footer
 */
export function ConditionalLayout({ children, navbar, footer }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const isDashboardRoute = pathname?.startsWith("/dashboard");

  // On admin routes, render children directly without any wrapping
  // AdminLayout handles its own structure
  if (isAdminRoute) {
    return <>{children}</>;
  }

  // On dashboard routes, include navbar/footer but let DashboardShell handle the main content area
  // DashboardShell has its own layout structure, so don't wrap in another main/PageTransition
  if (isDashboardRoute) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        {navbar}
        {children}
        {footer}
      </div>
    );
  }

  // On regular routes, wrap in standard layout with Navbar and Footer
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {navbar}
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      {footer}
    </div>
  );
}

