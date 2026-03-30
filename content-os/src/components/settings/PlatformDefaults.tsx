"use client";

import type { Platform } from "@/lib/constants";
import { PLATFORMS } from "@/lib/constants";

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  twitter: "X / Twitter",
  threads: "Threads",
};

interface PlatformDefaultsProps {
  defaultPlatform: Platform;
  onDefaultPlatformChange: (platform: Platform) => void;
  crossPostReminders: boolean;
  onCrossPostRemindersChange: (value: boolean) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}

export default function PlatformDefaults({
  defaultPlatform,
  onDefaultPlatformChange,
  crossPostReminders,
  onCrossPostRemindersChange,
  onSave,
  saving,
  saved,
}: PlatformDefaultsProps) {
  return (
    <>
      <div className="space-y-4 mb-4">
        <div>
          <label className="block text-sm text-[#8C857D] mb-1.5">
            Default platform
          </label>
          <select
            value={defaultPlatform}
            onChange={(e) =>
              onDefaultPlatformChange(e.target.value as Platform)
            }
            className="w-full bg-[#F4F2EF] border-[0.5px] border-[#1A1714]/12 rounded-[7px] px-3 py-2 text-sm text-[#1A1714] focus:outline-none focus:border-[#1A1714]/40 transition-colors"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {PLATFORM_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#1A1714]">
            Cross-post reminders
          </span>
          <Toggle
            enabled={crossPostReminders}
            onChange={onCrossPostRemindersChange}
          />
        </div>
      </div>
      <SaveButton onClick={onSave} loading={saving} saved={saved} />
    </>
  );
}

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-[#EB5E55]" : "bg-[#EDECEA]"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function SaveButton({
  onClick,
  loading,
  saved,
}: {
  onClick: () => void;
  loading: boolean;
  saved: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={loading}
        onClick={onClick}
        className="px-5 py-2 rounded-lg bg-[#EB5E55] text-white font-medium text-sm hover:bg-[#EB5E55]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Saving..." : "Save"}
      </button>
      {saved && (
        <span className="text-sm text-[#3B6D11] animate-fade-in">Saved!</span>
      )}
    </div>
  );
}
