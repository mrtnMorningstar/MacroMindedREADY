"use client";

import { useState, useCallback, useEffect } from "react";
import { collection, getDocs, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowDownTrayIcon, TrashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/components/ui/Toast";
import SettingsFormSection from "@/components/admin/SettingsFormSection";
import AppModal from "@/components/ui/AppModal";

type DataManagementSettingsProps = {
  saving: boolean;
};

type CollectionStats = {
  name: string;
  count: number;
};

export default function DataManagementSettings({
  saving,
}: DataManagementSettingsProps) {
  const toast = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [collectionStats, setCollectionStats] = useState<CollectionStats[]>([]);
  const [totalDocuments, setTotalDocuments] = useState(0);

  // Load Firestore collection statistics
  useEffect(() => {
    const loadStats = async () => {
      setLoadingStats(true);
      try {
        const collections = ["users", "planUpdateRequests", "adminActivity", "adminSettings"];
        const stats: CollectionStats[] = [];
        let total = 0;

        for (const collectionName of collections) {
          try {
            const coll = collection(db, collectionName);
            const snapshot = await getCountFromServer(coll);
            const count = snapshot.data().count;
            stats.push({ name: collectionName, count });
            total += count;
          } catch (error) {
            console.warn(`Failed to count ${collectionName}:`, error);
            stats.push({ name: collectionName, count: 0 });
          }
        }

        setCollectionStats(stats);
        setTotalDocuments(total);
      } catch (error) {
        console.error("Failed to load Firestore stats:", error);
        toast.error("Failed to load collection statistics");
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, [toast]);

  const handleBackup = useCallback(async () => {
    try {
      toast.info("Export functionality coming soon");
      // TODO: Implement actual export API call
      // const response = await fetch("/api/admin/export-data", { method: "POST" });
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export data");
    }
  }, [toast]);

  const handleDeleteTestData = useCallback(async () => {
    setShowDeleteConfirm(false);
    try {
      toast.info("Test data deletion functionality coming soon");
      // TODO: Implement actual deletion API call
      // const response = await fetch("/api/admin/delete-test-data", { method: "POST" });
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete test data");
    }
  }, [toast]);

  const handleClearCache = useCallback(async () => {
    try {
      // Clear browser cache and localStorage
      if (typeof window !== "undefined") {
        // Clear localStorage
        localStorage.clear();
        // Clear sessionStorage
        sessionStorage.clear();
        // Clear service worker cache if available
        if ("caches" in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((name) => caches.delete(name)));
        }
        toast.success("Cache cleared successfully");
      }
    } catch (error) {
      console.error("Cache clear failed:", error);
      toast.error("Failed to clear cache");
    }
  }, [toast]);

  return (
    <>
      <SettingsFormSection
        title="Data Management"
        description="Backup, export, and manage application data"
      >
        {/* Backup/Export */}
        <div>
          <div className="block text-sm font-semibold text-white mb-2">
            Data Export
          </div>
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
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleBackup();
                }}
                className="flex items-center gap-2 rounded-lg border border-[#D7263D] bg-[#D7263D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export Data
              </button>
            </div>
          </div>
        </div>

        {/* Firestore Usage Summary */}
        <div>
          <div className="block text-sm font-semibold text-white mb-2">
            Firestore Usage Summary
          </div>
          <div className="p-4 rounded-lg border border-neutral-800 bg-neutral-800/30">
            {loadingStats ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#D7263D] border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-3">
                {collectionStats.map((stat) => (
                  <div
                    key={stat.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-neutral-300 capitalize">
                      {stat.name.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span className="font-semibold text-white">
                      {stat.count.toLocaleString()} documents
                    </span>
                  </div>
                ))}
                <div className="pt-3 border-t border-neutral-700 flex items-center justify-between text-sm font-semibold">
                  <span className="text-white">Total Documents</span>
                  <span className="text-[#D7263D]">
                    {totalDocuments.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete Test Data */}
        <div>
          <div className="block text-sm font-semibold text-white mb-2">
            Test Data Management
          </div>
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
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg border border-red-500 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrashIcon className="h-4 w-4" />
                Delete Test Data
              </button>
            </div>
          </div>
        </div>

        {/* Cache Clear */}
        <div>
          <div className="block text-sm font-semibold text-white mb-2">
            Cache Management
          </div>
          <div className="p-4 rounded-lg border border-neutral-800 bg-neutral-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Clear Cache</p>
                <p className="text-xs text-neutral-400 mt-1">
                  Clear browser cache, localStorage, and service worker cache
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClearCache();
                }}
                className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-700 hover:text-white"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      </SettingsFormSection>

      {/* Delete Confirmation Modal */}
      <AppModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Test Data"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-300">
            Are you sure you want to permanently delete all test data? This
            action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteTestData}
              className="rounded-lg border border-red-500 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500/30"
            >
              Delete Test Data
            </button>
          </div>
        </div>
      </AppModal>
    </>
  );
}
