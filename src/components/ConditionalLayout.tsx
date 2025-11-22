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
 * - On other routes: Wraps children in the standard layout structure with Navbar and Footer
 */
export function ConditionalLayout({ children, navbar, footer }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  // On admin routes, render children directly without any wrapping
  // AdminLayout handles its own structure
  if (isAdminRoute) {
    return <>{children}</>;
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

