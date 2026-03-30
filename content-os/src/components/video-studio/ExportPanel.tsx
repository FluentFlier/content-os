'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';

type Format = 'mp4' | 'webm';
type Quality = '720p' | '1080p';

export default function ExportPanel() {
  const [format, setFormat] = useState<Format>('mp4');
  const [quality, setQuality] = useState<Quality>('1080p');

  return (
    <div className="rounded-lg bg-[#F4F2EF] border-[0.5px] border-[#1A1714]/12 p-4 space-y-4">
      <h3 className="font-heading text-[15px] font-[700] text-[#1A1714]">
        Export
      </h3>

      {/* Format selector */}
      <div className="space-y-1.5">
        <label className="font-body text-[12px] text-[#8C857D]">Format</label>
        <div className="flex gap-2">
          {(['mp4', 'webm'] as Format[]).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`px-4 py-1.5 rounded-md font-body text-[13px] font-medium uppercase transition-all duration-100 ${
                format === f
                  ? 'bg-[#EB5E55] text-white'
                  : 'bg-[#EDECEA] text-[#4A4540] hover:bg-[#EDECEA]/80'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Quality selector */}
      <div className="space-y-1.5">
        <label className="font-body text-[12px] text-[#8C857D]">Quality</label>
        <div className="flex gap-2">
          {(['720p', '1080p'] as Quality[]).map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              className={`px-4 py-1.5 rounded-md font-body text-[13px] font-medium transition-all duration-100 ${
                quality === q
                  ? 'bg-[#EB5E55] text-white'
                  : 'bg-[#EDECEA] text-[#4A4540] hover:bg-[#EDECEA]/80'
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
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md bg-[#EDECEA] text-[#8C857D] font-body text-[13px] font-medium cursor-not-allowed"
      >
        <Download className="w-4 h-4" />
        Export - Coming soon
      </button>
    </div>
  );
}
