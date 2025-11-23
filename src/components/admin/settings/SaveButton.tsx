"use client";

type SaveButtonProps = {
  saving: boolean;
  onSave: () => void;
};

export default function SaveButton({ saving, onSave }: SaveButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSave();
      }}
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
  );
}

