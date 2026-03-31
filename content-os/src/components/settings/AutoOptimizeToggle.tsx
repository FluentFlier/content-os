"use client";

import { Zap } from "lucide-react";

interface AutoOptimizeToggleProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}

export default function AutoOptimizeToggle({
  enabled,
  onChange,
  onSave,
  saving,
  saved,
}: AutoOptimizeToggleProps) {
  return (
    <>
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-[#6366F1]/12 flex items-center justify-center">
          <Zap className="w-4 h-4 text-[#818CF8]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#FAFAFA] font-medium">
                Auto-generate platform variants when saving a post
              </p>
              <p className="text-xs text-[#71717A] mt-1">
                When enabled, saving or updating a post with script or caption
                changes will automatically create optimized variants for all
                connected platforms.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => onChange(!enabled)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                enabled ? "bg-[#6366F1]" : "bg-[#27272A]"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          className="px-5 py-2 rounded-lg bg-[#6366F1] text-white font-medium text-sm hover:bg-[#6366F1]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && (
          <span className="text-sm text-[#3B6D11] animate-fade-in">Saved!</span>
        )}
      </div>
    </>
  );
}
