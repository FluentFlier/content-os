'use client';

import { Info } from 'lucide-react';

const CONSTRAINTS: Record<string, { rules: string[]; imageRequired: boolean }> = {
  twitter: {
    rules: [
      '280 chars per tweet (threads split automatically)',
      'Up to 4 images, 5MB each',
      'No hashtags in body (put in reply)',
      'Hook tweet is everything',
    ],
    imageRequired: false,
  },
  linkedin: {
    rules: [
      '3000 chars max',
      'First line is hook (shown before "see more")',
      '1 image, up to 10MB',
      '3-5 hashtags at the end',
      'End with a question for engagement',
    ],
    imageRequired: false,
  },
  instagram: {
    rules: [
      '2200 chars caption',
      'Image required (1:1 or 4:5 aspect ratio)',
      '20-30 hashtags at the end',
      'First line is hook before "...more"',
    ],
    imageRequired: true,
  },
  threads: {
    rules: [
      '500 chars max',
      'Image optional',
      'No hashtags',
      'Conversational, like texting a smart friend',
    ],
    imageRequired: false,
  },
};

interface PlatformConstraintsProps {
  platform: string;
  hasImage?: boolean;
  compact?: boolean;
}

export function PlatformConstraints({ platform, hasImage = false, compact = false }: PlatformConstraintsProps) {
  const config = CONSTRAINTS[platform];
  if (!config) return null;

  if (compact) {
    return (
      <div className="flex items-start gap-2 mt-2">
        <Info size={12} className="text-[#52525B] mt-0.5 shrink-0" />
        <p className="text-[11px] text-[#52525B] leading-relaxed">
          {config.rules[0]}
          {config.imageRequired && !hasImage && (
            <span className="text-amber-400 ml-1">(image required)</span>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#18181B] border-[0.5px] border-[rgba(255,255,255,0.08)] rounded-[7px] p-3 mt-2">
      <div className="flex items-center gap-1.5 mb-2">
        <Info size={12} className="text-[#52525B]" />
        <span className="text-[10px] font-medium tracking-[0.08em] uppercase text-[#52525B]">
          {platform === 'twitter' ? 'X' : platform} rules
        </span>
      </div>
      <ul className="space-y-1">
        {config.rules.map((rule, i) => (
          <li key={i} className="text-[11px] text-[#71717A] leading-relaxed flex items-start gap-1.5">
            <span className="text-[#52525B] mt-0.5">-</span>
            {rule}
          </li>
        ))}
      </ul>
      {config.imageRequired && !hasImage && (
        <p className="text-[11px] text-amber-400 mt-2 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          Upload an image to publish to {platform}
        </p>
      )}
    </div>
  );
}
