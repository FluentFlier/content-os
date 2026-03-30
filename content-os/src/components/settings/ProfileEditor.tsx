"use client";

import type { ContentPillarConfig } from "@/types/database";

const PRESET_COLORS = [
  "#EB5E55",
  "#F5C842",
  "#5CB85C",
  "#C77DFF",
  "#4D96FF",
  "#5A5047",
];

interface ProfileEditorProps {
  displayName: string;
  onDisplayNameChange: (value: string) => void;
  bioFacts: string;
  onBioFactsChange: (value: string) => void;
  voiceDescription: string;
  onVoiceDescriptionChange: (value: string) => void;
  voiceRules: string;
  onVoiceRulesChange: (value: string) => void;
  pillars: ContentPillarConfig[];
  onPillarsChange: (pillars: ContentPillarConfig[]) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}

export default function ProfileEditor({
  displayName,
  onDisplayNameChange,
  bioFacts,
  onBioFactsChange,
  voiceDescription,
  onVoiceDescriptionChange,
  voiceRules,
  onVoiceRulesChange,
  pillars,
  onPillarsChange,
  onSave,
  saving,
  saved,
}: ProfileEditorProps) {
  function addPillar() {
    if (pillars.length >= 6) return;
    onPillarsChange([
      ...pillars,
      { name: "", color: PRESET_COLORS[0], description: "", promptTemplate: "" },
    ]);
  }

  function removePillar(index: number) {
    if (pillars.length <= 1) return;
    onPillarsChange(pillars.filter((_, i) => i !== index));
  }

  function updatePillar(
    index: number,
    field: keyof ContentPillarConfig,
    value: string
  ) {
    const updated = [...pillars];
    updated[index] = { ...updated[index], [field]: value };
    onPillarsChange(updated);
  }

  return (
    <>
      <div className="space-y-5 mb-4">
        <div>
          <label className="block text-sm text-[#8C857D] mb-1.5">
            Display name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            placeholder="Your name or brand"
            className="w-full bg-[#F4F2EF] border-[0.5px] border-[#1A1714]/12 rounded-[7px] px-4 py-2.5 text-[#1A1714] placeholder:text-[#8C857D] focus:outline-none focus:border-[#1A1714]/40 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm text-[#8C857D] mb-1.5">
            Bio facts
          </label>
          <textarea
            value={bioFacts}
            onChange={(e) => onBioFactsChange(e.target.value)}
            placeholder="Key facts about you..."
            rows={4}
            className="w-full bg-[#F4F2EF] border-[0.5px] border-[#1A1714]/12 rounded-[7px] px-4 py-2.5 text-[#1A1714] placeholder:text-[#8C857D] focus:outline-none focus:border-[#1A1714]/40 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-[#8C857D] mb-1.5">
            Voice description
          </label>
          <textarea
            value={voiceDescription}
            onChange={(e) => onVoiceDescriptionChange(e.target.value)}
            placeholder="How your content should sound..."
            rows={4}
            className="w-full bg-[#F4F2EF] border-[0.5px] border-[#1A1714]/12 rounded-[7px] px-4 py-2.5 text-[#1A1714] placeholder:text-[#8C857D] focus:outline-none focus:border-[#1A1714]/40 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-[#8C857D] mb-1.5">
            Voice rules
          </label>
          <textarea
            value={voiceRules}
            onChange={(e) => onVoiceRulesChange(e.target.value)}
            placeholder="Hard rules for the AI..."
            rows={3}
            className="w-full bg-[#F4F2EF] border-[0.5px] border-[#1A1714]/12 rounded-[7px] px-4 py-2.5 text-[#1A1714] placeholder:text-[#8C857D] focus:outline-none focus:border-[#1A1714]/40 transition-colors resize-none"
          />
        </div>

        {/* Content Pillars */}
        <div>
          <label className="block text-sm text-[#8C857D] mb-3">
            Content pillars
          </label>
          <div className="space-y-4">
            {pillars.map((pillar, i) => (
              <div
                key={i}
                className="border-[0.5px] border-[#1A1714]/12 rounded-[12px] p-5 space-y-4"
                style={{
                  borderLeftColor: pillar.color,
                  borderLeftWidth: 3,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#8C857D]">
                    Pillar {i + 1}
                  </span>
                  {pillars.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePillar(i)}
                      className="text-xs text-[#8C857D] hover:text-[#EB5E55] transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={pillar.name}
                    onChange={(e) => updatePillar(i, "name", e.target.value)}
                    placeholder="Pillar name"
                    className="flex-1 bg-[#F4F2EF] border-[0.5px] border-[#1A1714]/12 rounded-[7px] px-4 py-2.5 text-[#1A1714] placeholder:text-[#8C857D] focus:outline-none focus:border-[#1A1714]/40 transition-colors"
                  />
                  <div className="flex gap-1.5 items-center">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => updatePillar(i, "color", color)}
                        className={`w-7 h-7 rounded-full transition-transform ${
                          pillar.color === color
                            ? "ring-2 ring-[#1A1714] ring-offset-2 ring-offset-[#FAFAF8] scale-110"
                            : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <textarea
                  value={pillar.description || ""}
                  onChange={(e) =>
                    updatePillar(i, "description", e.target.value)
                  }
                  placeholder="What this pillar covers..."
                  rows={2}
                  className="w-full bg-[#F4F2EF] border-[0.5px] border-[#1A1714]/12 rounded-[7px] px-4 py-2.5 text-[#1A1714] placeholder:text-[#8C857D] focus:outline-none focus:border-[#1A1714]/40 transition-colors resize-none"
                />

                <textarea
                  value={pillar.promptTemplate || ""}
                  onChange={(e) =>
                    updatePillar(i, "promptTemplate", e.target.value)
                  }
                  placeholder="AI prompt template for this pillar..."
                  rows={3}
                  className="w-full bg-[#F4F2EF] border-[0.5px] border-[#1A1714]/12 rounded-[7px] px-4 py-2.5 text-[#1A1714] placeholder:text-[#8C857D] focus:outline-none focus:border-[#1A1714]/40 transition-colors resize-none"
                />
              </div>
            ))}

            {pillars.length < 6 && (
              <button
                type="button"
                onClick={addPillar}
                className="w-full border-[0.5px] border-dashed border-[#1A1714]/12 rounded-[12px] py-3 text-sm text-[#8C857D] hover:border-[#EB5E55] hover:text-[#EB5E55] transition-colors"
              >
                + Add Pillar
              </button>
            )}
          </div>
        </div>
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
