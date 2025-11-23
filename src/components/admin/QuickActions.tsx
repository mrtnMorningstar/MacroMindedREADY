"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  PlusIcon,
  UserPlusIcon,
  DocumentTextIcon,
  ChartBarIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

type QuickAction = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

const quickActions: QuickAction[] = [
  {
    label: "Add Recipe",
    href: "/admin/recipes",
    icon: SparklesIcon,
    color: "bg-[#D7263D]",
  },
  {
    label: "View Clients",
    href: "/admin/clients",
    icon: UserPlusIcon,
    color: "bg-blue-600",
  },
  {
    label: "Plan Requests",
    href: "/admin/plan-requests",
    icon: DocumentTextIcon,
    color: "bg-amber-600",
  },
  {
    label: "Revenue Report",
    href: "/admin/sales",
    icon: ChartBarIcon,
    color: "bg-green-600",
  },
];

export default function QuickActions() {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href={action.href}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-neutral-800 bg-neutral-800/30 hover:bg-neutral-800/50 transition-all duration-200 group"
              >
                <div
                  className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-semibold text-white text-center">
                  {action.label}
                </p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

