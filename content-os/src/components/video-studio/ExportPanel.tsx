'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';

type Format = 'mp4' | 'webm';
type Quality = '720p' | '1080p';

export default function ExportPanel() {
  const [format, setFormat] = useState<Format>('mp4');
  const [quality, setQuality] = useState<Quality>('1080p');

  return (
    <div className="rounded-lg bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 p-4 space-y-4">
      <h3 className="font-heading text-[15px] font-[700] text-[#FAFAFA]">
        Export
      </h3>

      {/* Format selector */}
      <div className="space-y-1.5">
        <label className="font-body text-[12px] text-[#71717A]">Format</label>
        <div className="flex gap-2">
          {(['mp4', 'webm'] as Format[]).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`px-4 py-1.5 rounded-md font-body text-[13px] font-medium uppercase transition-all duration-100 ${
                format === f
                  ? 'bg-[#6366F1] text-white'
                  : 'bg-[#27272A] text-[#A1A1AA] hover:bg-[#27272A]/80'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Quality selector */}
      <div className="space-y-1.5">
        <label className="font-body text-[12px] text-[#71717A]">Quality</label>
        <div className="flex gap-2">
          {(['720p', '1080p'] as Quality[]).map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              className={`px-4 py-1.5 rounded-md font-body text-[13px] font-medium transition-all duration-100 ${
                quality === q
                  ? 'bg-[#6366F1] text-white'
                  : 'bg-[#27272A] text-[#A1A1AA] hover:bg-[#27272A]/80'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Export button */}
      <button
        disabled
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md bg-[#27272A] text-[#71717A] font-body text-[13px] font-medium cursor-not-allowed"
      >
        <Download className="w-4 h-4" />
        Export - Coming soon
      </button>
    </div>
  );
}
