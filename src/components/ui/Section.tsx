"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const maxWidthStyles: Record<NonNullable<SectionProps["maxWidth"]>, string> = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  "2xl": "max-w-[90rem]",
  full: "max-w-full",
};

export function Section({ 
  className, 
  children, 
  maxWidth = "lg",
  ...props 
}: SectionProps) {
  return (
    <section
      className={cn(
        "mx-auto px-6 py-24",
        maxWidthStyles[maxWidth],
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

