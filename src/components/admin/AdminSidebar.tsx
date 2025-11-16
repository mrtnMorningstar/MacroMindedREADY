"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

type NavLink = {
  label: string;
  href: string;
};

type AdminSidebarProps = {
  links?: NavLink[];
};

const defaultLinks: NavLink[] = [
  { label: "Users", href: "/admin" },
  { label: "Referrals", href: "/admin/referrals" },
  { label: "Recipes", href: "/admin/recipes" },
  { label: "Sales / Revenue", href: "/admin/sales" },
  { label: "Plan Requests", href: "/admin/requests" },
  { label: "Manage Admins", href: "/admin/manage-admins" },
];

export function AdminSidebar({ links }: AdminSidebarProps) {
  const pathname = usePathname();
  const navLinks = links ?? defaultLinks;

  return (
    <motion.aside
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="hidden h-[calc(100vh-5rem)] w-64 flex-col border-r border-border/70 bg-muted/40 px-6 py-10 shadow-[0_0_80px_-40px_rgba(215,38,61,0.6)] backdrop-blur lg:fixed lg:left-0 lg:top-20 lg:flex"
    >
      <span className="font-bold uppercase tracking-[0.48em] text-foreground">
        MacroMinded
      </span>
      <p className="mt-2 text-[0.65rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
        Admin navigation
      </p>

      <nav className="mt-10 flex-1 overflow-y-auto pr-1">
        <div className="flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full border px-4 py-2 text-left text-[0.65rem] uppercase tracking-[0.3em] transition ${
                pathname === link.href
                  ? "border-accent/60 bg-accent/20 text-accent"
                  : "border-border/70 text-foreground/70 hover:border-accent hover:text-accent"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </motion.aside>
  );
}

