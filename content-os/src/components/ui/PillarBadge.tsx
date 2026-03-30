'use client';

import { PILLAR_LABELS, PILLAR_COLORS, PILLAR_BADGE_BG } from '@/lib/constants';
import type { Pillar } from '@/lib/constants';

interface PillarBadgeProps {
  pillar: string;
  showLabel?: boolean;
  /** Override color (used by dynamic pillars). */
  color?: string;
  /** Override label (used by dynamic pillars). */
  label?: string;
}

export default function PillarBadge({ pillar, showLabel = true, color, label }: PillarBadgeProps) {
  const resolvedColor = color ?? PILLAR_COLORS[pillar as Pillar] ?? '#94A3B8';
  const resolvedLabel =
    label ??
    PILLAR_LABELS[pillar as Pillar] ??
    pillar
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  const resolvedBadgeBg = PILLAR_BADGE_BG[pillar as Pillar] ?? '';

  if (!showLabel) {
    return (
      <span
        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: resolvedColor }}
      />
    );
  }

  if (resolvedBadgeBg) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${resolvedBadgeBg}`}
      >
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ backgroundColor: resolvedColor }}
        />
        {resolvedLabel}
      </span>
    );
  }

  // Custom pillar: use inline styles for badge
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{
        backgroundColor: `${resolvedColor}20`,
        color: resolvedColor,
      }}
    >
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ backgroundColor: resolvedColor }}
      />
      {resolvedLabel}
    </span>
  );
}
