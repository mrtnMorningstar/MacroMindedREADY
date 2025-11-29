"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAppContext } from "@/context";
import { useToast } from "@/components/ui/Toast";

export type AdminSettings = {
  brandName?: string;
  logoURL?: string;
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
  defaultPricing?: {
    basic?: number;
    pro?: number;
    elite?: number;
  };
  twoFactorEnabled?: boolean;
  impersonationEnabled?: boolean;
  sessionTimeout?: number;
  stripeWebhookLastSuccess?: Date | string;
};

const DEFAULT_SETTINGS: AdminSettings = {
  brandName: "MacroMinded",
  logoURL: "",
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
  defaultPricing: {
    basic: 0,
    pro: 0,
    elite: 0,
  },
  twoFactorEnabled: false,
  impersonationEnabled: true,
  sessionTimeout: 24,
};

export function useSettingsForm() {
  const { user } = useAppContext();
  const toast = useToast();
  
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const settingsRef = useRef<AdminSettings>(DEFAULT_SETTINGS);
  const lastSavedSettingsRef = useRef<AdminSettings>(DEFAULT_SETTINGS);
  const hasShownErrorRef = useRef(false);

  // Load settings from Firestore
  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const settingsDocRef = doc(db, "adminSettings", "global");
        const snapshot = await getDoc(settingsDocRef);

        if (!isMounted) return;

        if (snapshot.exists()) {
          const data = snapshot.data();
          const loadedSettings = {
            ...DEFAULT_SETTINGS,
            ...data,
            emailAlerts: {
              ...DEFAULT_SETTINGS.emailAlerts,
              ...data.emailAlerts,
            },
            defaultPricing: {
              ...DEFAULT_SETTINGS.defaultPricing,
              ...data.defaultPricing,
            },
            stripeWebhookLastSuccess: data.stripeWebhookLastSuccess?.toDate?.() || data.stripeWebhookLastSuccess,
          } as AdminSettings;
          
          setSettings(loadedSettings);
          settingsRef.current = loadedSettings;
          lastSavedSettingsRef.current = loadedSettings;
        } else {
          // Use defaults if document doesn't exist
          setSettings(DEFAULT_SETTINGS);
          settingsRef.current = DEFAULT_SETTINGS;
          lastSavedSettingsRef.current = DEFAULT_SETTINGS;
        }
        setLoading(false);
      } catch (error: any) {
        if (!isMounted) return;
        
        // Set defaults on error so page is still usable
        setSettings(DEFAULT_SETTINGS);
        settingsRef.current = DEFAULT_SETTINGS;
        lastSavedSettingsRef.current = DEFAULT_SETTINGS;
        setLoading(false);

        // Only show error once
        if (!hasShownErrorRef.current) {
          const errorCode = error?.code;
          if (errorCode === "permission-denied") {
            toast.error("Permission denied. You may not have access to admin settings.");
          } else if (errorCode === "unavailable") {
            toast.error("Firestore is unavailable. Please check your connection.");
          } else {
            console.error("Failed to load settings:", error);
            toast.error("Failed to load settings. Using defaults.");
          }
          hasShownErrorRef.current = true;
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  // Update local state only (don't save immediately)
  const updateField = useCallback((key: string, value: any) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      settingsRef.current = updated;
      return updated;
    });
  }, []);

  // Update nested field (e.g., emailAlerts.newSignups)
  const updateNestedField = useCallback(
    (parentKey: string, childKey: string, value: any) => {
      setSettings((prev) => {
        const parent = prev[parentKey as keyof AdminSettings];
        const parentValue =
          parent && typeof parent === "object" && !Array.isArray(parent)
            ? parent
            : {};
        const updated = {
          ...prev,
          [parentKey]: {
            ...parentValue,
            [childKey]: value,
          },
        };
        settingsRef.current = updated;
        return updated;
      });
    },
    []
  );

  // Save settings to Firestore
  const saveSettings = useCallback(
    async (updates: Partial<AdminSettings>) => {
      if (!user) {
        toast.error("You must be logged in to update settings");
        return;
      }

      const currentSettingsState = settingsRef.current;
      const comparisonTarget = Object.keys(updates).length === Object.keys(currentSettingsState).length
        ? lastSavedSettingsRef.current
        : currentSettingsState;

      // Check if any value actually changed
      const hasChanges = Object.keys(updates).some((key) => {
        const updatedValue = updates[key as keyof AdminSettings];
        const comparisonValue = comparisonTarget[key as keyof AdminSettings];

        // Deep comparison for objects (like emailAlerts)
        if (
          typeof updatedValue === "object" &&
          updatedValue !== null &&
          typeof comparisonValue === "object" &&
          comparisonValue !== null
        ) {
          return JSON.stringify(updatedValue) !== JSON.stringify(comparisonValue);
        }
        return updatedValue !== comparisonValue;
      });

      if (!hasChanges) {
        console.warn("No changes detected - skipping save");
        return;
      }

      setSaving(true);

      // Update local state immediately
      const mergedSettings = { ...currentSettingsState, ...updates };
      setSettings(mergedSettings);
      settingsRef.current = mergedSettings;

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
        lastSavedSettingsRef.current = mergedSettings;
      } catch (error) {
        console.error("Failed to save settings:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to save settings"
        );
        // Revert local state on error
        setSettings(lastSavedSettingsRef.current);
        settingsRef.current = lastSavedSettingsRef.current;
      } finally {
        setSaving(false);
      }
    },
    [user, toast]
  );

  return {
    settings,
    loading,
    saving,
    updateField,
    updateNestedField,
    saveSettings,
  };
}

