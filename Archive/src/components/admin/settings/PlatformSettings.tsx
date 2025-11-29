"use client";

import { useState, useCallback, ChangeEvent } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { AdminSettings } from "@/hooks/useSettingsForm";
import SettingsFormSection from "@/components/admin/SettingsFormSection";
import SaveButton from "./SaveButton";
import { CardUpload } from "@/components/admin/CardUpload";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "@/components/ui/Toast";

type PlatformSettingsProps = {
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

export default function PlatformSettings({
  settings,
  saving,
  onUpdate,
  onSave,
}: PlatformSettingsProps) {
  const toast = useToast();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoProgress, setLogoProgress] = useState(0);

  const handleLogoUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      setUploadingLogo(true);
      setLogoProgress(0);

      try {
        const logoRef = ref(storage, `admin/logo/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(logoRef, file, {
          contentType: file.type,
        });

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setLogoProgress(Math.round(progress));
          },
          (error) => {
            console.error("Logo upload error:", error);
            toast.error("Failed to upload logo");
            setUploadingLogo(false);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              onUpdate("logoURL", downloadURL);
              toast.success("Logo uploaded successfully");
            } catch (error) {
              console.error("Error getting download URL:", error);
              toast.error("Failed to get logo URL");
            } finally {
              setUploadingLogo(false);
              setLogoProgress(0);
            }
          }
        );
      } catch (error) {
        console.error("Logo upload error:", error);
        toast.error("Failed to upload logo");
        setUploadingLogo(false);
      }
    },
    [onUpdate, toast]
  );

  return (
    <>
      <SettingsFormSection
        title="Platform Settings"
        description="Configure branding, localization, and payment settings for your platform"
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

        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Brand Logo
          </label>
          <CardUpload
            title="Upload Logo"
            description="Recommended: PNG or SVG, transparent background"
            accept="image/*"
            onChange={handleLogoUpload}
            currentUrl={settings.logoURL || undefined}
            status={
              uploadingLogo
                ? `Uploading... ${logoProgress}%`
                : settings.logoURL
                ? "Logo uploaded"
                : null
            }
            onDelete={
              settings.logoURL
                ? () => {
                    onUpdate("logoURL", "");
                    toast.info("Logo removed. Save changes to apply.");
                  }
                : undefined
            }
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

        {/* Currency & Date Format */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
        </div>

        {/* Stripe Connection Status */}
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

        {/* Tax/VAT Settings */}
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

        {/* Default Pricing */}
        <div>
          <div className="block text-sm font-semibold text-white mb-3">
            Default Pricing
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {["basic", "pro", "elite"].map((tier) => (
              <div key={tier}>
                <label
                  htmlFor={`price-${tier}`}
                  className="block text-xs font-medium text-neutral-400 mb-2 uppercase"
                >
                  {tier}
                </label>
                <input
                  id={`price-${tier}`}
                  name={`price-${tier}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.defaultPricing?.[tier as keyof typeof settings.defaultPricing] || 0}
                  onChange={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onUpdate("defaultPricing", {
                      ...settings.defaultPricing,
                      [tier]: parseFloat(e.target.value) || 0,
                    });
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
            ))}
          </div>
        </div>
      </SettingsFormSection>
      <div className="flex justify-end mt-6">
        <SaveButton saving={saving} onSave={onSave} />
      </div>
    </>
  );
}

