'use client';

import { STATUSES, STATUS_LABELS } from '@/lib/constants';
import type { Status } from '@/lib/constants';

const DOT_COLORS: Record<Status, string> = {
  idea: '#8C857D',
  scripted: '#4D96FF',
  filmed: '#F5C842',
  edited: '#EB5E55',
  posted: '#5CB85C',
};

interface StatusPipelineProps {
  current: Status;
  onChange: (status: Status) => void;
}

export default function StatusPipeline({ current, onChange }: StatusPipelineProps) {
  const currentIdx = STATUSES.indexOf(current);

  return (
    <div className="flex items-center gap-2">
      {STATUSES.map((s, i) => {
        const isActive = i <= currentIdx;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            title={STATUS_LABELS[s]}
            className="group flex flex-col items-center gap-1"
          >
            <span
              className="w-4 h-4 rounded-full border-[1.5px] transition-colors cursor-pointer"
              style={{
                backgroundColor: isActive ? DOT_COLORS[s] : 'transparent',
                borderColor: DOT_COLORS[s],
              }}
            />
            <span className="text-[10px] text-[#8C857D] group-hover:text-[#1A1714] transition-colors capitalize font-medium tracking-[0.05em]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {STATUS_LABELS[s]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
