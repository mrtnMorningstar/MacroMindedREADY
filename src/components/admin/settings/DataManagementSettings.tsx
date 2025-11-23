"use client";

import { useState, useCallback } from "react";
import { ArrowDownTrayIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/components/ui/Toast";
import SettingsFormSection from "@/components/admin/SettingsFormSection";
import AppModal from "@/components/ui/AppModal";

type DataManagementSettingsProps = {
  saving: boolean;
};

export default function DataManagementSettings({
  saving,
}: DataManagementSettingsProps) {
  const toast = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleBackup = useCallback(async () => {
    toast.info("Export functionality coming soon");
  }, [toast]);

  const handleDeleteTestData = useCallback(async () => {
    setShowDeleteConfirm(false);
    toast.info("Test data deletion functionality coming soon");
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

