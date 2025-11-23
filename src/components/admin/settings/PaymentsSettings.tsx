"use client";

import { AdminSettings } from "@/hooks/useSettingsForm";
import SettingsFormSection from "@/components/admin/SettingsFormSection";
import SaveButton from "./SaveButton";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

type PaymentsSettingsProps = {
  settings: AdminSettings;
  saving: boolean;
  onUpdate: (key: string, value: any) => void;
  onSave: () => void;
};

const formatWebhookDate = (date: Date | string | undefined) => {
  if (!date) return "Never";
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString();
};

export default function PaymentsSettings({
  settings,
  saving,
  onUpdate,
  onSave,
}: PaymentsSettingsProps) {
  return (
    <>
      <SettingsFormSection
        title="Payment Settings"
        description="Configure payment processing and tax settings"
      >
        {/* Stripe Status */}
        <div>
          <div className="block text-sm font-semibold text-white mb-2">
            Stripe API Status
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg border border-neutral-800 bg-neutral-800/30">
            {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? (
              <>
                <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Connected</p>
                  <p className="text-xs text-neutral-400">
                    Stripe API key is configured
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Not Connected</p>
                  <p className="text-xs text-neutral-400">
                    Stripe API key is not configured
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Webhook Last Success */}
        <div>
          <div className="block text-sm font-semibold text-white mb-2">
            Last Webhook Success
          </div>
          <div className="flex items-center gap-2 p-4 rounded-lg border border-neutral-800 bg-neutral-800/30">
            <ClockIcon className="h-5 w-5 text-neutral-400 flex-shrink-0" />
            <p className="text-sm text-neutral-300">
              {formatWebhookDate(settings.stripeWebhookLastSuccess)}
            </p>
          </div>
        </div>

        {/* Tax Toggle */}
        <div>
          <div className="block text-sm font-semibold text-white mb-3">
            Tax/VAT Settings
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-800 bg-neutral-800/30 cursor-pointer hover:bg-neutral-800/50 transition-colors">
              <label
                htmlFor="taxEnabled"
                className="text-sm font-medium text-white cursor-pointer flex-1"
              >
                Enable Tax/VAT
              </label>
              <button
                id="taxEnabled"
                type="button"
                aria-label="Toggle Tax/VAT"
                onClick={() => {
                  onUpdate("taxEnabled", !settings.taxEnabled);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.taxEnabled ? "bg-[#D7263D]" : "bg-neutral-700"
                }`}
                role="switch"
                aria-checked={settings.taxEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.taxEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {settings.taxEnabled && (
              <div className="pl-4">
                <label
                  htmlFor="taxRate"
                  className="block text-sm font-semibold text-white mb-2"
                >
                  Tax Rate (%)
                </label>
                <input
                  id="taxRate"
                  name="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={settings.taxRate || 0}
                  onChange={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onUpdate("taxRate", parseFloat(e.target.value) || 0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-[#D7263D] focus:outline-none transition-all"
                  placeholder="0.00"
                />
              </div>
            )}
          </div>
        </div>
      </SettingsFormSection>
      <div className="flex justify-end mt-6">
        <SaveButton saving={saving} onSave={onSave} />
      </div>
    </>
  );
}

