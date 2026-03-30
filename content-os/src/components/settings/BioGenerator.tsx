"use client";

import { useState } from "react";
import { Loader2, Copy, Check } from "lucide-react";

interface BioCard {
  platform: string;
  bio: string;
  limit: number;
}

interface BioGeneratorProps {
  bioGenerating: boolean;
  bios: BioCard[];
  onGenerate: () => void;
  onBiosChange: (bios: BioCard[]) => void;
}

export default function BioGenerator({
  bioGenerating,
  bios,
  onGenerate,
  onBiosChange,
}: BioGeneratorProps) {
  const [copiedBio, setCopiedBio] = useState<string | null>(null);

  function copyBio(platform: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedBio(platform);
    setTimeout(() => setCopiedBio(null), 2000);
  }

  return (
    <>
      <button
        type="button"
        disabled={bioGenerating}
        onClick={onGenerate}
        className="px-5 py-2 rounded-lg bg-[#EB5E55] text-white font-medium text-sm hover:bg-[#EB5E55]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        {bioGenerating && <Loader2 size={16} className="animate-spin" />}
        {bioGenerating ? "Generating..." : "Generate Platform Bios"}
      </button>

      {bios.length > 0 && (
        <div className="mt-4 space-y-3">
          {bios.map((card) => (
            <div
              key={card.platform}
              className="bg-[#F4F2EF] border-[0.5px] border-[#1A1714]/12 rounded-[7px] p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#1A1714]">
                  {card.platform}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs ${
                      card.bio.length > card.limit
                        ? "text-[#EB5E55]"
                        : "text-[#8C857D]"
                    }`}
                  >
                    {card.bio.length}/{card.limit}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyBio(card.platform, card.bio)}
                    className="text-[#8C857D] hover:text-[#1A1714] transition-colors"
                  >
                    {copiedBio === card.platform ? (
                      <Check size={16} className="text-[#3B6D11]" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>
              <textarea
                value={card.bio}
                onChange={(e) => {
                  onBiosChange(
                    bios.map((b) =>
                      b.platform === card.platform
                        ? { ...b, bio: e.target.value }
                        : b
                    )
                  );
                }}
                rows={3}
                className="w-full bg-[#FAFAF8] border-[0.5px] border-[#1A1714]/12 rounded-[7px] px-3 py-2 text-sm text-[#1A1714] focus:outline-none focus:border-[#1A1714]/40 transition-colors resize-none"
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
