"use client";

import React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-[#D7263D] text-white border-[#D7263D] hover:bg-[#D7263D]/90 hover:shadow-[0_0_30px_-10px_rgba(215,38,61,0.8)]",
  secondary: "border-neutral-800 bg-transparent text-neutral-300 hover:border-[#D7263D]/50 hover:text-white hover:bg-neutral-900/50",
  ghost: "border-transparent bg-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/30",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg border font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#D7263D]/50 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

