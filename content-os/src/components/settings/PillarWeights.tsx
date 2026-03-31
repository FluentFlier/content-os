"use client";

import type { ContentPillarConfig } from "@/types/database";

interface PillarWeightsProps {
  pillars: ContentPillarConfig[];
  pillarWeights: Record<string, number>;
  onWeightChange: (weights: Record<string, number>) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}

export default function PillarWeights({
  pillars,
  pillarWeights,
  onWeightChange,
  onSave,
  saving,
  saved,
}: PillarWeightsProps) {
  return (
    <>
      <p className="text-sm text-[#71717A] mb-4">
        Set how many posts per week for each content pillar (0-7).
      </p>
      <div className="space-y-4 mb-4">
        {pillars.map((pillar) => {
          if (!pillar.name) return null;
          const weight = pillarWeights[pillar.name] ?? 3;
          return (
            <div key={pillar.name} className="flex items-center gap-4">
              <div className="flex items-center gap-2 min-w-[140px]">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: pillar.color }}
                />
                <span className="text-sm text-[#FAFAFA] truncate">
                  {pillar.name}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={7}
                value={weight}
                onChange={(e) =>
                  onWeightChange({
                    ...pillarWeights,
                    [pillar.name]: parseInt(e.target.value, 10),
                  })
                }
                className="flex-1 accent-[#6366F1] h-2 cursor-pointer"
              />
              <span className="text-sm text-[#71717A] w-16 text-right">
                {weight}/week
              </span>
            </div>
          );
        })}
      </div>
      <SaveButton onClick={onSave} loading={saving} saved={saved} />
    </>
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
        className="px-5 py-2 rounded-lg bg-[#6366F1] text-white font-medium text-sm hover:bg-[#6366F1]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Saving..." : "Save"}
      </button>
      {saved && (
        <span className="text-sm text-[#3B6D11] animate-fade-in">Saved!</span>
      )}
    </div>
  );
}
