'use client';

const PLATFORM_LIMITS: Record<string, { caption: number; label: string }> = {
  twitter: { caption: 280, label: 'X / Twitter' },
  linkedin: { caption: 3000, label: 'LinkedIn' },
  instagram: { caption: 2200, label: 'Instagram' },
  threads: { caption: 500, label: 'Threads' },
};

interface CharCountProps {
  text: string;
  platform: string;
}

export function CharCount({ text, platform }: CharCountProps) {
  const config = PLATFORM_LIMITS[platform];
  if (!config) return null;

  const count = text.length;
  const limit = config.caption;
  const pct = count / limit;

  let color = 'text-[#52525B]';
  if (pct >= 1) color = 'text-red-400';
  else if (pct >= 0.8) color = 'text-amber-400';

  return (
    <span className={`font-mono text-[11px] ${color} tabular-nums`}>
      {count}/{limit}
    </span>
  );
}
