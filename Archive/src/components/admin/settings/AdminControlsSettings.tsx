"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  orderBy,
  limit,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AdminSettings } from "@/hooks/useSettingsForm";
import SettingsFormSection from "@/components/admin/SettingsFormSection";
import SaveButton from "./SaveButton";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

type AdminControlsSettingsProps = {
  settings: AdminSettings;
  saving: boolean;
  activeTab: string;
  onUpdate: (key: string, value: any) => void;
  onSave: () => void;
};

export default function AdminControlsSettings({
  settings,
  saving,
  activeTab,
  onUpdate,
  onSave,
}: AdminControlsSettingsProps) {
  const [impersonationLogs, setImpersonationLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Load impersonation logs only when Admin Controls tab is active
  useEffect(() => {
    if (activeTab !== "admin") {
      setImpersonationLogs([]);
      return;
    }

    let isMounted = true;
    const loadLogs = async () => {
      setLoadingLogs(true);
      try {
        let q;
        try {
          q = query(
            collection(db, "adminActivity"),
            where("action", "==", "impersonate"),
            orderBy("timestamp", "desc"),
            limit(10)
          );
        } catch (indexError) {
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
            timestamp: data.timestamp?.toDate?.() || data.timestamp,
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
  }, [activeTab]);

  return (
    <>
      <SettingsFormSection
        title="Admin Controls"
        description="Manage admin notifications, security features, and access controls"
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
          <p className="text-xs text-neutral-400 mt-2">
            Email address for receiving admin notifications and alerts
          </p>
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

        {/* Impersonation Toggle */}
        <div>
          <div className="block text-sm font-semibold text-white mb-3">
            Impersonation
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-800 bg-neutral-800/30 cursor-pointer hover:bg-neutral-800/50 transition-colors">
            <div className="flex-1">
              <span
                id="impersonationLabel"
                className="text-sm font-medium text-white block cursor-pointer"
              >
                Enable Admin Impersonation
              </span>
              <span className="text-xs text-neutral-400 mt-1 block">
                Allow admins to view the app as other users
              </span>
            </div>
            <button
              id="impersonationEnabled"
              type="button"
              aria-labelledby="impersonationLabel"
              onClick={() => {
                onUpdate("impersonationEnabled", !settings.impersonationEnabled);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.impersonationEnabled ? "bg-[#D7263D]" : "bg-neutral-700"
              }`}
              role="switch"
              aria-checked={settings.impersonationEnabled}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.impersonationEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Recent Impersonation Activity */}
        <div>
          <div className="block text-sm font-semibold text-white mb-3">
            Recent Impersonation Activity
          </div>
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
              <p className="text-sm text-neutral-400">
                No impersonation activity
              </p>
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
                        {log.timestamp instanceof Date
                          ? log.timestamp.toLocaleString()
                          : log.timestamp?.toDate
                          ? log.timestamp.toDate().toLocaleString()
                          : log.timestamp
                          ? new Date(log.timestamp).toLocaleString()
                          : new Date().toLocaleString()}
                      </p>
                    </div>
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Two-Factor Authentication */}
        <div>
          <div className="block text-sm font-semibold text-white mb-3">
            Security Features
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-800 bg-neutral-800/30 cursor-pointer hover:bg-neutral-800/50 transition-colors">
            <div className="flex-1">
              <span
                id="twoFactorLabel"
                className="text-sm font-medium text-white block cursor-pointer"
              >
                Two-Factor Authentication
              </span>
              <span className="text-xs text-neutral-400 mt-1 block">
                Require 2FA for all admin accounts
              </span>
            </div>
            <button
              id="twoFactorEnabled"
              type="button"
              aria-labelledby="twoFactorLabel"
              onClick={() => {
                onUpdate("twoFactorEnabled", !settings.twoFactorEnabled);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.twoFactorEnabled ? "bg-[#D7263D]" : "bg-neutral-700"
              }`}
              role="switch"
              aria-checked={settings.twoFactorEnabled}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.twoFactorEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Session Timeout */}
        <div>
          <label
            htmlFor="sessionTimeout"
            className="block text-sm font-semibold text-white mb-2"
          >
            Session Timeout (hours)
          </label>
          <input
            id="sessionTimeout"
            name="sessionTimeout"
            type="number"
            min="1"
            max="168"
            value={settings.sessionTimeout || 24}
            onChange={(e) =>
              onUpdate("sessionTimeout", parseInt(e.target.value) || 24)
            }
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
      </SettingsFormSection>
      <div className="flex justify-end mt-6">
        <SaveButton saving={saving} onSave={onSave} />
      </div>
    </>
  );
}

