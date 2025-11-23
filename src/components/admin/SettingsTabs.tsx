"use client";

import { motion } from "framer-motion";
import {
  Cog6ToothIcon,
  BellIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";
import {
  Cog6ToothIcon as Cog6ToothIconSolid,
  BellIcon as BellIconSolid,
  CreditCardIcon as CreditCardIconSolid,
  ShieldCheckIcon as ShieldCheckIconSolid,
  ArchiveBoxIcon as ArchiveBoxIconSolid,
} from "@heroicons/react/24/solid";

type SettingsTab = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconSolid: React.ComponentType<{ className?: string }>;
};

const tabs: SettingsTab[] = [
  {
    id: "general",
    label: "General",
    icon: Cog6ToothIcon,
    iconSolid: Cog6ToothIconSolid,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: BellIcon,
    iconSolid: BellIconSolid,
  },
  {
    id: "payments",
    label: "Payments",
    icon: CreditCardIcon,
    iconSolid: CreditCardIconSolid,
  },
  {
    id: "security",
    label: "Security",
    icon: ShieldCheckIcon,
    iconSolid: ShieldCheckIconSolid,
  },
  {
    id: "data",
    label: "Data Management",
    icon: ArchiveBoxIcon,
    iconSolid: ArchiveBoxIconSolid,
  },
];

type SettingsTabsProps = {
  activeTab: string;
  onTabChange: (tabId: string) => void;
};

export default function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 mb-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = isActive ? tab.iconSolid : tab.icon;

          return (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-[#D7263D] text-white shadow-[0_0_20px_-10px_rgba(215,38,61,0.5)]"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

