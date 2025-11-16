"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const links = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
];

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="border-t border-border/60 bg-background/80 backdrop-blur footer-component"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <div className="font-display text-xs uppercase tracking-[0.45em] text-foreground/70">
          MacroMinded
        </div>
        <nav className="flex flex-col items-center gap-4 text-xs uppercase tracking-[0.32em] text-foreground/60 sm:flex-row sm:gap-8">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="transition hover:text-accent"
            >
              {label}
            </Link>
          ))}
          <span className="select-none text-foreground/50">|</span>
          <a
            href="mailto:support@macrominded.net"
            className="transition hover:text-accent"
          >
            support@macrominded.net
          </a>
        </nav>
        <p className="text-[0.55rem] uppercase tracking-[0.32em] text-foreground/40">
          © {new Date().getFullYear()} MacroMinded. All rights reserved.
        </p>
      </div>
    </motion.footer>
  );
}

