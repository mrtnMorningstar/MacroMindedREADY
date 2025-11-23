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

type SecuritySettingsProps = {
  settings: AdminSettings;
  saving: boolean;
  activeTab: string;
  onUpdate: (key: string, value: any) => void;
  onSave: () => void;
};

export default function SecuritySettings({
  settings,
  saving,
  activeTab,
  onUpdate,
  onSave,
}: SecuritySettingsProps) {
  const [impersonationLogs, setImpersonationLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Load impersonation logs only when Security tab is active
  useEffect(() => {
    if (activeTab !== "security") {
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

        {/* Impersonation Logs */}
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
      </SettingsFormSection>
      <div className="flex justify-end mt-6">
        <SaveButton saving={saving} onSave={onSave} />
      </div>
    </>
  );
}

