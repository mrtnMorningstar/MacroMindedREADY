"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, getDocs, orderBy, limit, where } from "firebase/firestore";
import { useAppContext } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";
import SettingsTabs from "@/components/admin/SettingsTabs";
import SettingsFormSection from "@/components/admin/SettingsFormSection";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrashIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import AppModal from "@/components/ui/AppModal";

type AdminSettings = {
  brandName?: string;
  accentColor?: string;
  timezone?: string;
  currency?: string;
  dateFormat?: string;
  adminEmail?: string;
  emailAlerts?: {
    newSignups?: boolean;
    planRequests?: boolean;
    payments?: boolean;
  };
  taxEnabled?: boolean;
  taxRate?: number;
  impersonationEnabled?: boolean;
  sessionTimeout?: number;
  stripeWebhookLastSuccess?: Date | string;
};

type TabType = "general" | "notifications" | "payments" | "security" | "data";

export default function AdminSettingsPage() {
  const { user } = useAppContext();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("general");

  // Handle tab change with type validation
  const handleTabChange = useCallback((tabId: string) => {
    const validTabs: TabType[] = ["general", "notifications", "payments", "security", "data"];
    if (validTabs.includes(tabId as TabType)) {
      setActiveTab(tabId as TabType);
    }
  }, []);
  const [settings, setSettings] = useState<AdminSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const hasShownErrorRef = useRef(false);

  // Load settings from Firestore (one-time load, no real-time listener to avoid errors)
  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const settingsRef = doc(db, "adminSettings", "global");
        const snapshot = await getDoc(settingsRef);

        if (!isMounted) return;

        if (snapshot.exists()) {
          const data = snapshot.data();
          setSettings({
            ...data,
            stripeWebhookLastSuccess: data.stripeWebhookLastSuccess?.toDate?.() || data.stripeWebhookLastSuccess,
          } as AdminSettings);
        } else {
          // Initialize with defaults if document doesn't exist
          setSettings({
            brandName: "MacroMinded",
            accentColor: "#D7263D",
            timezone: "America/New_York",
            currency: "USD",
            dateFormat: "MM/DD/YYYY",
            emailAlerts: {
              newSignups: true,
              planRequests: true,
              payments: true,
            },
            taxEnabled: false,
            taxRate: 0,
            impersonationEnabled: true,
            sessionTimeout: 24,
          });
        }
        setLoading(false);
      } catch (error: any) {
        if (!isMounted) return;
        
        // Always set defaults on error so page is still usable
        setSettings({
          brandName: "MacroMinded",
          accentColor: "#D7263D",
          timezone: "America/New_York",
          currency: "USD",
          dateFormat: "MM/DD/YYYY",
          emailAlerts: {
            newSignups: true,
            planRequests: true,
            payments: true,
          },
          taxEnabled: false,
          taxRate: 0,
          impersonationEnabled: true,
          sessionTimeout: 24,
        });

        // Only show error once
        if (!hasShownErrorRef.current) {
          const errorCode = error?.code;
          if (errorCode === "permission-denied") {
            toast.error("Permission denied. You may not have access to admin settings.");
          } else if (errorCode === "unavailable") {
            toast.error("Firestore is unavailable. Please check your connection.");
          } else {
            console.error("Error loading settings:", error);
            // Don't show toast for other errors - just use defaults
          }
          hasShownErrorRef.current = true;
        }
        setLoading(false);
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []); // Remove toast from dependencies to prevent re-runs

  // Save settings - ref is used to always get latest settings without dependency
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const saveSettings = useCallback(
    async (updates: Partial<AdminSettings>) => {
      // DEBUG: Log to see if this is being called unexpectedly
      console.log("🔒 saveSettings called - this should ONLY happen when Save button is clicked", updates);
      
      if (!user) {
        toast.error("You must be logged in to update settings");
        return;
      }

      // Only save if there are actual updates
      if (Object.keys(updates).length === 0) {
        console.warn("⚠️ saveSettings called with empty updates - ignoring");
        return;
      }

      // Check if any value actually changed
      const hasChanges = Object.keys(updates).some(
        (key) => updates[key as keyof AdminSettings] !== settingsRef.current[key as keyof AdminSettings]
      );

      if (!hasChanges) {
        // No actual changes, don't save
        console.warn("⚠️ saveSettings called but no actual changes detected - ignoring");
        return;
      }

      console.log("✅ saveSettings proceeding with save");
      setSaving(true);
      
      // Update local state immediately
      const mergedSettings = { ...settingsRef.current, ...updates };
      setSettings(mergedSettings);

      try {
        const idToken = await user.getIdToken();

        const response = await fetch("/api/admin/update-settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            settings: mergedSettings,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to update settings");
        }

        toast.success("Settings saved successfully");
      } catch (error) {
        console.error("Failed to save settings:", error);
        toast.error(error instanceof Error ? error.message : "Failed to save settings");
        // Revert on error
        setSettings(settingsRef.current);
      } finally {
        setSaving(false);
      }
    },
    [user, toast]
  );

  // Update local state only (don't save immediately)
  const updateField = useCallback(
    (key: string, value: any) => {
      // ONLY update local state - NEVER save
      // This function should NEVER call saveSettings or saveField
      setSettings((prev) => {
        const updated = { ...prev, [key]: value };
        // Update ref synchronously
        settingsRef.current = updated;
        return updated;
      });
    },
    []
  );

  // Save a specific field to Firestore (called on blur or immediate action)
  const saveField = useCallback(
    (key: string, value: any) => {
      // Only save if the value actually changed from current ref
      const currentValue = settingsRef.current[key as keyof AdminSettings];
      if (value !== currentValue) {
        saveSettings({ [key]: value });
      }
    },
    [saveSettings]
  );

  // Update nested field (e.g., emailAlerts.newSignups)
  const updateNestedField = useCallback(
    (parentKey: string, childKey: string, value: any) => {
      const parent = settings[parentKey as keyof AdminSettings];
      const parentValue = parent && typeof parent === "object" && !Array.isArray(parent)
        ? parent
        : {};
      saveSettings({
        [parentKey]: {
          ...parentValue,
          [childKey]: value,
        },
      });
    },
    [settings, saveSettings]
  );

  // Load impersonation logs for Security tab (only when Security tab is active)
  const [impersonationLogs, setImpersonationLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (activeTab !== "security") {
      setImpersonationLogs([]);
      return;
    }

    let isMounted = true;
    const loadLogs = async () => {
      setLoadingLogs(true);
      try {
        // Try to query with filters - if index doesn't exist, fall back to simple query
        let q;
        try {
          q = query(
            collection(db, "adminActivity"),
            where("action", "==", "impersonate"),
            orderBy("timestamp", "desc"),
            limit(10)
          );
        } catch (indexError) {
          // Index might not exist - try without orderBy
          console.warn("Firestore index may not exist, querying without orderBy:", indexError);
          q = query(
            collection(db, "adminActivity"),
            where("action", "==", "impersonate"),
            limit(10)
          );
        }
        
        const snapshot = await getDocs(q);
        
        if (!isMounted) return;
        
        const logs: any[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          logs.push({ 
            id: doc.id, 
            ...data,
            timestamp: data.timestamp?.toDate?.() || data.timestamp
          });
        });
        
        // Sort manually if we couldn't use orderBy
        logs.sort((a, b) => {
          const aTime = a.timestamp?.getTime?.() || 0;
          const bTime = b.timestamp?.getTime?.() || 0;
          return bTime - aTime;
        });
        
        setImpersonationLogs(logs.slice(0, 10));
      } catch (error: any) {
        if (!isMounted) return;
        // Collection might not exist or query might fail - that's okay
        if (error?.code !== "failed-precondition" && error?.code !== "not-found") {
          console.error("Error loading impersonation logs:", error);
        }
        setImpersonationLogs([]);
      } finally {
        if (isMounted) {
          setLoadingLogs(false);
        }
      }
    };

    loadLogs();
    return () => {
      isMounted = false;
    };
  }, [activeTab, db]);

  // Format webhook date
  const formatWebhookDate = (date: Date | string | undefined) => {
    if (!date) return "Never";
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleString();
  };

  // Save all current settings - only called explicitly by button click
  const handleSaveAll = useCallback(() => {
    // Use ref to get latest settings without dependency
    const currentSettings = settingsRef.current;
    saveSettings(currentSettings);
  }, [saveSettings]);

  // General Settings Tab
  const GeneralSettings = () => (
    <>
      <SettingsFormSection
        title="General Settings"
        description="Configure basic application settings and branding"
      >
      {/* Brand Name */}
      <div>
        <label htmlFor="brandName" className="block text-sm font-semibold text-white mb-2">
          Brand Name
        </label>
        <input
          id="brandName"
          name="brandName"
          type="text"
          value={settings.brandName || "MacroMinded"}
          onChange={(e) => updateField("brandName", e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
            }
          }}
          className="w-full rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-[#D7263D] focus:outline-none transition-all"
          placeholder="MacroMinded"
        />
      </div>

      {/* Accent Color */}
      <div>
        <label htmlFor="accentColor" className="block text-sm font-semibold text-white mb-2">
          Accent Color
        </label>
        <div className="flex items-center gap-3">
          <input
            id="accentColorPicker"
            name="accentColorPicker"
            type="color"
            value={settings.accentColor || "#D7263D"}
            onChange={(e) => updateField("accentColor", e.target.value)}
            className="h-12 w-24 rounded-lg border border-neutral-800 bg-neutral-800/50 cursor-pointer"
            aria-label="Accent color picker"
          />
          <input
            id="accentColor"
            name="accentColor"
            type="text"
            value={settings.accentColor || "#D7263D"}
            onChange={(e) => updateField("accentColor", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
              }
            }}
            className="flex-1 rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-2.5 text-sm text-white font-mono focus:border-[#D7263D] focus:outline-none transition-all"
            placeholder="#D7263D"
          />
        </div>
      </div>

      {/* Timezone */}
      <div>
        <label htmlFor="timezone" className="block text-sm font-semibold text-white mb-2">
          Timezone
        </label>
        <select
          id="timezone"
          name="timezone"
          value={settings.timezone || "America/New_York"}
          onChange={(e) => updateField("timezone", e.target.value)}
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
        <label htmlFor="currency" className="block text-sm font-semibold text-white mb-2">
          Default Currency
        </label>
        <select
          id="currency"
          name="currency"
          value={settings.currency || "USD"}
          onChange={(e) => updateField("currency", e.target.value)}
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
        <label htmlFor="dateFormat" className="block text-sm font-semibold text-white mb-2">
          Date Format
        </label>
        <select
          id="dateFormat"
          name="dateFormat"
          value={settings.dateFormat || "MM/DD/YYYY"}
          onChange={(e) => updateField("dateFormat", e.target.value)}
          className="w-full rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-2.5 text-sm text-white focus:border-[#D7263D] focus:outline-none transition-all"
        >
          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
        </select>
      </div>
      </SettingsFormSection>
      <div className="flex justify-end mt-6">
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg border border-[#D7263D] bg-[#D7263D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </button>
      </div>
    </>
  );

  // Notifications Settings Tab
  const NotificationsSettings = () => (
    <>
      <SettingsFormSection
        title="Notification Settings"
        description="Configure email alerts for admin notifications"
      >
      {/* Admin Email */}
      <div>
        <label htmlFor="adminEmail" className="block text-sm font-semibold text-white mb-2">
          Admin Contact Email
        </label>
        <input
          id="adminEmail"
          name="adminEmail"
          type="email"
          value={settings.adminEmail || ""}
          onChange={(e) => {
            // ONLY update local state - NEVER save automatically
            const newValue = e.target.value;
            setSettings((prev) => {
              const updated = { ...prev, adminEmail: newValue };
              settingsRef.current = updated;
              return updated;
            });
          }}
          onKeyDown={(e) => {
            // Prevent form submission on Enter
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
  return (
              <div
                key={alert.key}
                className="flex items-center justify-between p-4 rounded-lg border border-neutral-800 bg-neutral-800/30 cursor-pointer hover:bg-neutral-800/50 transition-colors"
              >
                <label htmlFor={toggleId} className="text-sm font-medium text-white cursor-pointer flex-1">
                  {alert.label}
                </label>
                <button
                  id={toggleId}
                  type="button"
                  aria-label={`Toggle ${alert.label}`}
                  onClick={() => {
                    const currentValue = settings.emailAlerts?.[alert.key as keyof typeof settings.emailAlerts] ?? false;
                    const newValue = !currentValue;
                    const parent = settings.emailAlerts || {};
                    updateField("emailAlerts", {
                      ...parent,
                      [alert.key]: newValue,
                    });
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emailAlerts?.[alert.key as keyof typeof settings.emailAlerts]
                      ? "bg-[#D7263D]"
                      : "bg-neutral-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.emailAlerts?.[alert.key as keyof typeof settings.emailAlerts]
                        ? "translate-x-6"
                        : "translate-x-1"
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
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg border border-[#D7263D] bg-[#D7263D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </button>
      </div>
    </>
  );

  // Payments Settings Tab
  const PaymentsSettings = () => (
    <>
      <SettingsFormSection
      title="Payment Settings"
      description="Configure payment processing and tax settings"
    >
      {/* Stripe Status */}
      <div>
        <label className="block text-sm font-semibold text-white mb-2">
          Stripe API Status
        </label>
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
        <label className="block text-sm font-semibold text-white mb-2">
          Last Webhook Success
        </label>
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
            <label htmlFor="taxEnabled" className="text-sm font-medium text-white cursor-pointer flex-1">
              Enable Tax/VAT
            </label>
            <button
              id="taxEnabled"
              type="button"
              aria-label="Toggle Tax/VAT"
              onClick={() => {
                updateField("taxEnabled", !settings.taxEnabled);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.taxEnabled ? "bg-[#D7263D]" : "bg-neutral-700"
              }`}
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
              <label className="block text-sm font-semibold text-white mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.taxRate || 0}
                onChange={(e) => updateField("taxRate", parseFloat(e.target.value) || 0)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
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
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg border border-[#D7263D] bg-[#D7263D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </button>
      </div>
    </>
  );

  // Security Settings Tab
  const SecuritySettings = () => (
    <>
      <SettingsFormSection
      title="Security Settings"
      description="Configure security features and access controls"
    >
      {/* Impersonation Toggle */}
      <div>
        <div className="block text-sm font-semibold text-white mb-3">
          Impersonation
        </div>
        <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-800 bg-neutral-800/30 cursor-pointer hover:bg-neutral-800/50 transition-colors">
          <div className="flex-1">
            <label htmlFor="impersonationEnabled" className="text-sm font-medium text-white block cursor-pointer">
              Enable Admin Impersonation
            </label>
            <span className="text-xs text-neutral-400 mt-1 block">
              Allow admins to view the app as other users
            </span>
          </div>
          <button
            id="impersonationEnabled"
            type="button"
            aria-label="Toggle Admin Impersonation"
            onClick={() => {
              updateField("impersonationEnabled", !settings.impersonationEnabled);
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.impersonationEnabled ? "bg-[#D7263D]" : "bg-neutral-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.impersonationEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Session Timeout */}
      <div>
        <label htmlFor="sessionTimeout" className="block text-sm font-semibold text-white mb-2">
          Session Timeout (hours)
        </label>
        <input
          id="sessionTimeout"
          name="sessionTimeout"
          type="number"
          min="1"
          max="168"
          value={settings.sessionTimeout || 24}
          onChange={(e) => updateField("sessionTimeout", parseInt(e.target.value) || 24)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
            }
          }}
          className="w-full rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-[#D7263D] focus:outline-none transition-all"
          placeholder="24"
        />
        <p className="text-xs text-neutral-400 mt-2">
          After this many hours of inactivity, users will be logged out
        </p>
      </div>

      {/* Impersonation Logs */}
      <div>
        <label className="block text-sm font-semibold text-white mb-3">
          Recent Impersonation Activity
        </label>
        {loadingLogs ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-lg bg-neutral-800"
              />
            ))}
          </div>
        ) : impersonationLogs.length === 0 ? (
          <div className="p-8 rounded-lg border border-neutral-800 bg-neutral-800/30 text-center">
            <p className="text-sm text-neutral-400">No impersonation activity</p>
          </div>
        ) : (
          <div className="space-y-2">
            {impersonationLogs.slice(0, 5).map((log: any) => (
              <div
                key={log.id}
                className="p-4 rounded-lg border border-neutral-800 bg-neutral-800/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Admin impersonated user
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {log.timestamp?.toDate?.()?.toLocaleString() ||
                        new Date().toLocaleString()}
                    </p>
                  </div>
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </SettingsFormSection>
      <div className="flex justify-end mt-6">
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg border border-[#D7263D] bg-[#D7263D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </button>
      </div>
    </>
  );

  // Data Management Settings Tab
  const DataManagementSettings = () => {
    const handleBackup = useCallback(async () => {
      toast.info("Export functionality coming soon");
    }, [toast]);

    const handleDeleteTestData = useCallback(async () => {
      toast.info("Test data deletion functionality coming soon");
    }, [toast]);

    return (
      <SettingsFormSection
        title="Data Management"
        description="Backup, export, and manage application data"
      >
        {/* Backup/Export */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Data Export
          </label>
          <div className="p-4 rounded-lg border border-neutral-800 bg-neutral-800/30">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-white">
                  Export Application Data
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Download a backup of all application data
                </p>
              </div>
              <button
                onClick={handleBackup}
                className="flex items-center gap-2 rounded-lg border border-[#D7263D] bg-[#D7263D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export Data
              </button>
            </div>
          </div>
        </div>

        {/* Delete Test Data */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Test Data Management
          </label>
          <div className="p-4 rounded-lg border border-red-500/50 bg-red-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">
                  Delete Test Data
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Permanently delete all test users and data
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500/30"
              >
                <TrashIcon className="h-4 w-4" />
                Delete Test Data
              </button>
            </div>
          </div>
        </div>
      </SettingsFormSection>
    );
  };

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralSettings />;
      case "notifications":
        return <NotificationsSettings />;
      case "payments":
        return <PaymentsSettings />;
      case "security":
        return <SecuritySettings />;
      case "data":
        return <DataManagementSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-6"
      >
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl border border-neutral-800 bg-neutral-900"
            />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-6"
    >
      {/* Settings Tabs */}
      <SettingsTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
        </motion.div>
      </AnimatePresence>

      {/* Saving Indicator */}
      {saving && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#D7263D] border-t-transparent" />
            <p className="text-sm font-medium text-white">Saving settings...</p>
          </div>
        </div>
      )}

      {/* Delete Test Data Confirmation Modal */}
      <AppModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Test Data"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-300">
            Are you sure you want to delete all test data? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                // TODO: Implement test data deletion
                toast.info("Test data deletion coming soon");
              }}
              className="rounded-lg border border-red-500/50 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500/30"
            >
              Delete Test Data
            </button>
          </div>
        </div>
      </AppModal>
    </motion.div>
  );
}
