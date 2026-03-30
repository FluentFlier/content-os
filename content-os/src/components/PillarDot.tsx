'use client';

import { PILLAR_COLORS, PILLAR_LABELS } from '@/lib/constants';
import type { Pillar } from '@/lib/constants';

interface PillarDotProps {
  pillar: string;
  showLabel?: boolean;
  /** Override color (used by dynamic pillars). */
  color?: string;
  /** Override label (used by dynamic pillars). */
  label?: string;
}

export default function PillarDot({ pillar, showLabel = false, color, label }: PillarDotProps) {
  const resolvedColor = color ?? PILLAR_COLORS[pillar as Pillar] ?? '#94A3B8';
  const resolvedLabel =
    label ??
    PILLAR_LABELS[pillar as Pillar] ??
    pillar
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  return (
    <span className="inline-flex items-center gap-1.5 shrink-0">
      <span
        className="inline-block w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: resolvedColor }}
      />
      {showLabel && (
        <span
          className="text-[11px] font-medium"
          style={{ color: resolvedColor }}
        >
          {resolvedLabel}
        </span>
      )}
    </span>
  );
}
