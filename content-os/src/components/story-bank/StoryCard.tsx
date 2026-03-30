'use client';

import { ArrowRightCircle, RefreshCw, Trash2, X } from 'lucide-react';
import type { StoryBankEntry } from '@/lib/types';
import { usePillars } from '@/hooks/usePillars';

function StoryPillarBadge({ pillar }: { pillar: string }) {
  const { getColor, getLabel } = usePillars();
  const color = getColor(pillar);
  const label = getLabel(pillar);
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-medium px-[7px] py-[2px] rounded-[3px] tracking-[0.01em]"
      style={{
        backgroundColor: `${color}20`,
        color: color,
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

interface StoryCardProps {
  story: StoryBankEntry;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onConvert: () => void;
  onRemine: () => void;
  onDelete: () => void;
  converting: boolean;
  remining: boolean;
  deleting: boolean;
}

export default function StoryCard({
  story,
  isExpanded,
  onToggleExpand,
  onConvert,
  onRemine,
  onDelete,
  converting,
  remining,
  deleting,
}: StoryCardProps) {
  return (
    <div
      className={`bg-[#FAFAF8] border-[0.5px] border-[#1A1714]/12 rounded-[12px] transition-all ${
        story.used ? 'opacity-75' : ''
      } ${
        isExpanded
          ? 'col-span-1 md:col-span-2 lg:col-span-3'
          : 'hover:border-[#1A1714]/25 cursor-pointer'
      }`}
    >
      {/* Card header */}
      <div className="p-[13px_14px]" onClick={onToggleExpand}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-[13px] text-[#4A4540] leading-[1.55] italic">
            {isExpanded
              ? story.raw_memory
              : story.raw_memory.length > 100
              ? story.raw_memory.slice(0, 100) + '...'
              : story.raw_memory}
          </p>
          {isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="shrink-0 p-1 text-[#8C857D] hover:text-[#1A1714]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {story.mined_angle && (
          <p className="text-[13px] font-medium text-[#EB5E55] mb-2">
            {story.mined_angle}
          </p>
        )}

        <div className="flex items-center gap-[6px]">
          {story.pillar && <StoryPillarBadge pillar={story.pillar} />}
          <span
            className={`text-[10px] px-[7px] py-[2px] rounded-[3px] font-medium tracking-[0.01em] ${
              story.used
                ? 'bg-[#EAF3DE] text-[#3B6D11]'
                : 'bg-[#F4F2EF] text-[#8C857D]'
            }`}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {story.used ? 'Used' : 'Unused'}
          </span>
        </div>
      </div>

      {/* Expanded section */}
      {isExpanded && (
        <div className="border-t-[0.5px] border-[#1A1714]/12 px-[14px] py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-[10px] font-medium text-[#8C857D] uppercase tracking-[0.1em] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Raw Memory
              </h4>
              <p className="text-[13px] text-[#1A1714] leading-[1.55]">
                {story.raw_memory}
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-medium text-[#8C857D] uppercase tracking-[0.1em] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Mined Angle
              </h4>
              <p className="text-[13px] text-[#EB5E55] font-medium">
                {story.mined_angle || 'Not yet mined'}
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-medium text-[#8C857D] uppercase tracking-[0.1em] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Mined Hook
              </h4>
              <p className="text-[13px] text-[#1A1714]">
                {story.mined_hook || 'Not yet mined'}
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-medium text-[#8C857D] uppercase tracking-[0.1em] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Caption Line
              </h4>
              <p className="text-[13px] text-[#1A1714]">
                {story.mined_caption_line || 'Not yet mined'}
              </p>
            </div>
          </div>

          {story.mined_script && (
            <div>
              <h4 className="text-[10px] font-medium text-[#8C857D] uppercase tracking-[0.1em] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Mined Script
              </h4>
              <div className="bg-[#F4F2EF] border-[0.5px] border-[#1A1714]/12 rounded-[12px] p-3">
                {story.mined_script.split('\n').map((line, i) => (
                  <p
                    key={i}
                    className="text-[13px] text-[#1A1714] leading-[1.55]"
                  >
                    {line || '\u00A0'}
                  </p>
                ))}
              </div>
            </div>
          )}

          {story.pillar && (
            <div>
              <h4 className="text-[10px] font-medium text-[#8C857D] uppercase tracking-[0.1em] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Pillar
              </h4>
              <StoryPillarBadge pillar={story.pillar} />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t-[0.5px] border-[#1A1714]/12">
            <button
              onClick={onConvert}
              disabled={converting || story.used}
              className="flex items-center gap-1.5 bg-[#EB5E55] text-white text-[13px] font-medium px-5 py-[10px] rounded-[7px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRightCircle className="w-4 h-4" />
              {converting
                ? 'Converting...'
                : story.used
                ? 'Already Converted'
                : 'Convert to Post'}
            </button>
            <button
              onClick={onRemine}
              disabled={remining}
              className="flex items-center gap-1.5 bg-[#F4F2EF] border-[0.5px] border-[#1A1714]/12 text-[#1A1714] text-[13px] font-medium px-[14px] py-[7px] rounded-[7px] hover:border-[#1A1714]/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-4 h-4 ${remining ? 'animate-spin' : ''}`}
              />
              {remining ? 'Re-mining...' : 'Re-mine'}
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 text-[#EB5E55] hover:opacity-80 text-[13px] font-medium px-[14px] py-[7px] rounded-[7px] border-[0.5px] border-transparent hover:border-[#EB5E55]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
