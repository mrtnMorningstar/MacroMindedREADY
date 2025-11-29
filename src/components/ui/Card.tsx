"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

export function Card({ className, children, hover = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-800 bg-neutral-900 p-6",
        hover && "transition-all hover:border-[#D7263D]/30 hover:shadow-[0_0_40px_-20px_rgba(215,38,61,0.3)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

