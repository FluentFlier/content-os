'use client';

import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import type { Series } from '@/lib/types';
import { usePillars } from '@/hooks/usePillars';

interface SeriesCardProps {
  series: Series;
  completedParts: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  confirmingDelete: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  children?: React.ReactNode;
}

export default function SeriesCard({
  series,
  completedParts,
  isExpanded,
  onToggleExpand,
  onDelete,
  confirmingDelete,
  onConfirmDelete,
  onCancelDelete,
  children,
}: SeriesCardProps) {
  const { getColor, getLabel } = usePillars();
  const total = series.total_parts;
  const progress = total > 0 ? (completedParts / total) * 100 : 0;
  const pillarColor = getColor(series.pillar);

  return (
    <div
      className={`bg-[#FAFAF8] border-[0.5px] border-[#1A1714]/12 rounded-[12px] transition-all ${
        isExpanded ? 'md:col-span-2' : ''
      }`}
    >
      {/* Card header */}
      <button
        onClick={onToggleExpand}
        className="w-full text-left p-[13px_14px] hover:bg-[#EDECEA] rounded-t-[12px] transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-heading text-[16px] font-[700] text-[#1A1714] truncate">
                {series.name}
              </h3>
              <span
                className="inline-flex items-center px-[7px] py-[2px] rounded-[3px] text-[10px] font-medium shrink-0 tracking-[0.01em]"
                style={{
                  backgroundColor: `${pillarColor}20`,
                  color: pillarColor,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                {getLabel(series.pillar)}
              </span>
            </div>

            {series.description && (
              <p className="text-[13px] text-[#4A4540] line-clamp-2 mb-3 leading-[1.55]">
                {series.description}
              </p>
            )}

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="h-1.5 bg-[#EDECEA] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#EB5E55] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-[#8C857D]">
                {completedParts} of {total} parts complete
              </p>
            </div>
          </div>

          <div className="shrink-0 mt-1 text-[#8C857D]">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </button>

      {/* Expanded view */}
      {isExpanded && (
        <div className="border-t-[0.5px] border-[#1A1714]/12 p-[13px_14px] space-y-4">
          {series.description && (
            <p className="text-[13px] text-[#4A4540] leading-[1.55]">{series.description}</p>
          )}

          {children}

          {/* Delete */}
          <div className="flex justify-end pt-2">
            {confirmingDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#8C857D]">
                  Delete this series?
                </span>
                <button
                  onClick={onDelete}
                  className="px-3 py-1 rounded-[3px] text-[10px] font-medium bg-[#FAECE7] text-[#EB5E55] hover:opacity-80 transition-opacity"
                >
                  Confirm
                </button>
                <button
                  onClick={onCancelDelete}
                  className="px-3 py-1 rounded-[3px] text-[10px] font-medium text-[#8C857D] hover:text-[#1A1714] transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={onConfirmDelete}
                className="flex items-center gap-1 text-[11px] text-[#8C857D] hover:text-[#EB5E55] transition-colors"
              >
                <Trash2 size={13} />
                Delete Series
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
