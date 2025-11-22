"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  HomeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  GiftIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  UsersIcon as UsersIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  SparklesIcon as SparklesIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  ShieldCheckIcon as ShieldCheckIconSolid,
  GiftIcon as GiftIconSolid,
} from "@heroicons/react/24/solid";

type AdminSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const navLinks = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: HomeIcon,
    iconSolid: HomeIconSolid,
  },
  {
    label: "Clients",
    href: "/admin/clients",
    icon: UsersIcon,
    iconSolid: UsersIconSolid,
  },
  {
    label: "Revenue",
    href: "/admin/sales",
    icon: ChartBarIcon,
    iconSolid: ChartBarIconSolid,
  },
  {
    label: "Referrals",
    href: "/admin/referrals",
    icon: GiftIcon,
    iconSolid: GiftIconSolid,
  },
  {
    label: "Plan Requests",
    href: "/admin/plan-requests",
    icon: ClipboardDocumentListIcon,
    iconSolid: ClipboardDocumentListIconSolid,
  },
  {
    label: "Recipes",
    href: "/admin/recipes",
    icon: SparklesIcon,
    iconSolid: SparklesIconSolid,
  },
];

const settingsLinks = [
  {
    label: "Manage Admins",
    href: "/admin/manage-admins",
    icon: ShieldCheckIcon,
    iconSolid: ShieldCheckIconSolid,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Cog6ToothIcon,
    iconSolid: Cog6ToothIconSolid,
  },
];

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Always visible on desktop, animated on mobile */}
      <aside 
        className={`fixed left-0 top-0 z-50 h-full w-64 border-r border-neutral-800 bg-neutral-900 lg:relative lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="flex h-full flex-col">
          {/* Brand */}
          <div className="border-b border-neutral-800 px-6 py-6">
            <h2 className="text-xl font-bold uppercase tracking-wide text-white">
              MacroMinded
            </h2>
            <p className="mt-1 text-xs uppercase tracking-wide text-neutral-500">
              Admin Panel
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-1">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                const Icon = active ? link.iconSolid : link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
                    className={`group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-[#D7263D]/20 text-[#D7263D]"
                        : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-[#D7263D]"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    <Icon className="h-5 w-5" />
                    <span>{link.label}</span>
                    {active && (
                      <div className="absolute inset-0 rounded-lg bg-[#D7263D]/10" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Settings Section */}
            <div className="mt-8 pt-8 border-t border-neutral-800">
              <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Settings
              </p>
              <div className="space-y-1">
                {settingsLinks.map((link) => {
                  const active = isActive(link.href);
                  const Icon = active ? link.iconSolid : link.icon;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onClose}
                      className={`group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                        active
                          ? "bg-[#D7263D]/20 text-[#D7263D]"
                          : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeIndicatorSettings"
                          className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-[#D7263D]"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                      <Icon className="h-5 w-5" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}
