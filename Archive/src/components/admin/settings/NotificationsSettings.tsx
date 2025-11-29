"use client";

import { AdminSettings } from "@/hooks/useSettingsForm";
import SettingsFormSection from "@/components/admin/SettingsFormSection";
import SaveButton from "./SaveButton";

type NotificationsSettingsProps = {
  settings: AdminSettings;
  saving: boolean;
  onUpdate: (key: string, value: any) => void;
  onSave: () => void;
};

export default function NotificationsSettings({
  settings,
  saving,
  onUpdate,
  onSave,
}: NotificationsSettingsProps) {
  return (
    <>
      <SettingsFormSection
        title="Notification Settings"
        description="Configure email alerts for admin notifications"
      >
        {/* Admin Email */}
        <div>
          <label
            htmlFor="adminEmail"
            className="block text-sm font-semibold text-white mb-2"
          >
            Admin Contact Email
          </label>
          <input
            id="adminEmail"
            name="adminEmail"
            type="email"
            value={settings.adminEmail || ""}
            onChange={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onUpdate("adminEmail", e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
              }
            }}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-[#D7263D] focus:outline-none transition-all"
            placeholder="admin@macrominded.com"
          />
        </div>

        {/* Email Alerts */}
        <div>
          <div className="block text-sm font-semibold text-white mb-3">
            Email Alert Preferences
          </div>
          <div className="space-y-3">
            {[
              { key: "newSignups", label: "New client sign-ups" },
              { key: "planRequests", label: "Plan update requests" },
              { key: "payments", label: "Payments received" },
            ].map((alert) => {
              const toggleId = `emailAlert-${alert.key}`;
              const currentValue =
                settings.emailAlerts?.[
                  alert.key as keyof typeof settings.emailAlerts
                ] ?? false;

              return (
                <div
                  key={alert.key}
                  className="flex items-center justify-between p-4 rounded-lg border border-neutral-800 bg-neutral-800/30 cursor-pointer hover:bg-neutral-800/50 transition-colors"
                >
                  <label
                    htmlFor={toggleId}
                    className="text-sm font-medium text-white cursor-pointer flex-1"
                  >
                    {alert.label}
                  </label>
                  <button
                    id={toggleId}
                    type="button"
                    aria-label={`Toggle ${alert.label}`}
                    onClick={() => {
                      const parent = settings.emailAlerts || {};
                      onUpdate("emailAlerts", {
                        ...parent,
                        [alert.key]: !currentValue,
                      });
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      currentValue ? "bg-[#D7263D]" : "bg-neutral-700"
                    }`}
                    role="switch"
                    aria-checked={currentValue}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        currentValue ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </SettingsFormSection>
      <div className="flex justify-end mt-6">
        <SaveButton saving={saving} onSave={onSave} />
      </div>
    </>
  );
}

