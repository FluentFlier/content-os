'use client';

import { useRef } from 'react';
import { Plus } from 'lucide-react';
import type { Priority } from '@/lib/constants';
import type { PillarInfo } from '@/hooks/usePillars';

const PRIORITY_STYLES: Record<Priority, string> = {
  high: 'bg-[rgba(99,102,241,0.12)] text-[#6366F1]',
  medium: 'bg-[#FAEEDA] text-[#854F0B]',
  low: 'bg-[#18181B] text-[#71717A]',
};

interface IdeaFormProps {
  value: string;
  pillar: string;
  priority: Priority;
  adding: boolean;
  pillarOptions: PillarInfo[];
  onValueChange: (value: string) => void;
  onPillarChange: (pillar: string) => void;
  onPriorityChange: (priority: Priority) => void;
  onSubmit: () => void;
}

export default function IdeaForm({
  value,
  pillar,
  priority,
  adding,
  pillarOptions,
  onValueChange,
  onPillarChange,
  onPriorityChange,
  onSubmit,
}: IdeaFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="sticky top-0 z-10 bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-[13px_14px] space-y-3">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder="Capture an idea..."
          className="flex-1 bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] px-3 py-2 min-h-[44px] text-[13px] text-[#FAFAFA] placeholder:text-[#71717A] focus:outline-none focus:border-[#FAFAFA]/40 transition-colors"
        />
        <button
          onClick={onSubmit}
          disabled={adding || !value.trim()}
          className="flex items-center gap-1.5 bg-[#6366F1] hover:opacity-90 disabled:opacity-40 text-white text-[13px] font-medium px-5 py-[10px] min-h-[44px] rounded-[7px] transition-opacity"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Pillar selector */}
        <select
          value={pillar}
          onChange={(e) => onPillarChange(e.target.value)}
          className="bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] px-2.5 py-2 min-h-[44px] text-[11px] text-[#FAFAFA] focus:outline-none focus:border-[#FAFAFA]/40 transition-colors"
        >
          {pillarOptions.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        {/* Priority pills */}
        <div className="flex gap-1">
          {(['low', 'medium', 'high'] as Priority[]).map((p) => (
            <button
              key={p}
              onClick={() => onPriorityChange(p)}
              className={`px-3 py-2 min-h-[44px] rounded-[3px] text-[10px] font-medium capitalize transition-colors tracking-[0.01em] ${
                priority === p
                  ? PRIORITY_STYLES[p]
                  : 'bg-[#18181B] text-[#71717A] hover:text-[#FAFAFA]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
