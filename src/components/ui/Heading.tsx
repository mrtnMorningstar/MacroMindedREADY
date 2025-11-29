"use client";

import React from "react";
import { cn } from "@/lib/utils";

type HeadingLevel = "h1" | "h2" | "h3" | "h4";

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as: HeadingLevel;
  children: React.ReactNode;
}

const headingStyles: Record<HeadingLevel, string> = {
  h1: "text-4xl sm:text-5xl lg:text-6xl font-display font-bold",
  h2: "text-3xl sm:text-4xl lg:text-5xl font-display font-bold",
  h3: "text-2xl sm:text-3xl font-display font-bold",
  h4: "text-xl sm:text-2xl font-display font-semibold",
};

export function Heading({ as, className, children, ...props }: HeadingProps) {
  const Component = as;
  
  return (
    <Component
      className={cn(
        headingStyles[as],
        "text-white",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

