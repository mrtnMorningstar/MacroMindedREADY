"use client";

import { AdminSettings } from "@/hooks/useSettingsForm";
import SettingsFormSection from "@/components/admin/SettingsFormSection";
import SaveButton from "./SaveButton";

type GeneralSettingsProps = {
  settings: AdminSettings;
  saving: boolean;
  onUpdate: (key: string, value: any) => void;
  onSave: () => void;
};

export default function GeneralSettings({
  settings,
  saving,
  onUpdate,
  onSave,
}: GeneralSettingsProps) {
  return (
    <>
      <SettingsFormSection
        title="General Settings"
        description="Configure basic application settings and branding"
      >
        {/* Brand Name */}
        <div>
          <label
            htmlFor="brandName"
            className="block text-sm font-semibold text-white mb-2"
          >
            Brand Name
          </label>
          <input
            id="brandName"
            name="brandName"
            type="text"
            value={settings.brandName || "MacroMinded"}
            onChange={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onUpdate("brandName", e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-[#D7263D] focus:outline-none transition-all"
            placeholder="MacroMinded"
          />
        </div>

        {/* Accent Color */}
        <div>
          <label
            htmlFor="accentColor"
            className="block text-sm font-semibold text-white mb-2"
          >
            Accent Color
          </label>
          <div className="flex items-center gap-3">
            <input
              id="accentColorPicker"
              name="accentColorPicker"
              type="color"
              value={settings.accentColor || "#D7263D"}
              onChange={(e) => onUpdate("accentColor", e.target.value)}
              className="h-12 w-24 rounded-lg border border-neutral-800 bg-neutral-800/50 cursor-pointer"
              aria-label="Accent color picker"
            />
            <input
              id="accentColor"
              name="accentColor"
              type="text"
              value={settings.accentColor || "#D7263D"}
              onChange={(e) => onUpdate("accentColor", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              className="flex-1 rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-2.5 text-sm text-white font-mono focus:border-[#D7263D] focus:outline-none transition-all"
              placeholder="#D7263D"
            />
          </div>
        </div>

        {/* Timezone */}
        <div>
          <label
            htmlFor="timezone"
            className="block text-sm font-semibold text-white mb-2"
          >
            Timezone
          </label>
          <select
            id="timezone"
            name="timezone"
            value={settings.timezone || "America/New_York"}
            onChange={(e) => onUpdate("timezone", e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-2.5 text-sm text-white focus:border-[#D7263D] focus:outline-none transition-all"
          >
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>

        {/* Currency */}
        <div>
          <label
            htmlFor="currency"
            className="block text-sm font-semibold text-white mb-2"
          >
            Default Currency
          </label>
          <select
            id="currency"
            name="currency"
            value={settings.currency || "USD"}
            onChange={(e) => onUpdate("currency", e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-2.5 text-sm text-white focus:border-[#D7263D] focus:outline-none transition-all"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="CAD">CAD (C$)</option>
          </select>
        </div>

        {/* Date Format */}
        <div>
          <label
            htmlFor="dateFormat"
            className="block text-sm font-semibold text-white mb-2"
          >
            Date Format
          </label>
          <select
            id="dateFormat"
            name="dateFormat"
            value={settings.dateFormat || "MM/DD/YYYY"}
            onChange={(e) => onUpdate("dateFormat", e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-2.5 text-sm text-white focus:border-[#D7263D] focus:outline-none transition-all"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
      </SettingsFormSection>
      <div className="flex justify-end mt-6">
        <SaveButton saving={saving} onSave={onSave} />
      </div>
    </>
  );
}

