"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useSettingsForm } from "@/hooks/useSettingsForm";
import SettingsTabs from "@/components/admin/SettingsTabs";
import PlatformSettings from "./PlatformSettings";
import AdminControlsSettings from "./AdminControlsSettings";
import DataManagementSettings from "./DataManagementSettings";

type TabType = "platform" | "admin" | "data";

const tabContentVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -20,
  },
};

export default function SettingsPage() {
  const {
    settings,
    loading,
    saving,
    updateField,
    updateNestedField,
    saveSettings,
  } = useSettingsForm();

  const [activeTab, setActiveTab] = useState<TabType>("platform");
  const settingsRef = useRef(settings);

  // Keep ref in sync with settings
  settingsRef.current = settings;

  // Handle tab change with type validation
  const handleTabChange = useCallback((tabId: string) => {
    const validTabs: TabType[] = ["platform", "admin", "data"];
    if (validTabs.includes(tabId as TabType)) {
      setActiveTab(tabId as TabType);
    }
  }, []);

  // Save all current settings - only called explicitly by button click
  const handleSaveAll = useCallback(() => {
    // Use ref to get latest settings without dependency
    const currentSettings = settingsRef.current;
    saveSettings(currentSettings);
  }, [saveSettings]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D7263D] border-t-transparent" />
          <p className="text-sm text-neutral-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        // Prevent any form submissions from bubbling
        const target = e.target as HTMLElement;
        if (target instanceof HTMLButtonElement && target.type === "submit") {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div className="flex flex-col gap-6">
        {/* Tab Navigation */}
        <SettingsTabs activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Tab Content with Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              duration: 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="w-full"
          >
            {activeTab === "platform" && (
              <PlatformSettings
                settings={settings}
                saving={saving}
                onUpdate={updateField}
                onSave={handleSaveAll}
              />
            )}

            {activeTab === "admin" && (
              <AdminControlsSettings
                settings={settings}
                saving={saving}
                activeTab={activeTab}
                onUpdate={updateField}
                onSave={handleSaveAll}
              />
            )}

            {activeTab === "data" && (
              <DataManagementSettings saving={saving} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </form>
  );
}
