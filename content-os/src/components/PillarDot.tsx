import { Pillar, PILLAR_COLORS, PILLAR_LABELS } from "@/types/database";

interface PillarDotProps {
  pillar: Pillar;
  showLabel?: boolean;
}

export default function PillarDot({ pillar, showLabel = false }: PillarDotProps) {
  const color = PILLAR_COLORS[pillar];

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      {showLabel && (
        <span className="text-xs text-text-muted">{PILLAR_LABELS[pillar]}</span>
      )}
    </span>
  );
}
