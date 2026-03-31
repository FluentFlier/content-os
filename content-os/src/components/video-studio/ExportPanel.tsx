'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import type { TemplateId } from './TemplateSelector';

type Format = 'mp4' | 'webm';
type Quality = '720p' | '1080p';

interface ExportPanelProps {
  videoSrc?: string;
  templateId?: TemplateId;
}

export default function ExportPanel({ videoSrc, templateId }: ExportPanelProps) {
  const [format, setFormat] = useState<Format>('mp4');
  const [quality, setQuality] = useState<Quality>('1080p');
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const canExport = Boolean(videoSrc && templateId);

  const handleExport = async () => {
    if (!canExport) return;
    setExporting(true);
    setError(null);
    setProgress(0);

    try {
      // Call the auto-edit endpoint for server-side rendering
      const res = await fetch('/api/video/auto-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: videoSrc,
          options: {
            template: templateId,
            format,
            quality,
            captions: templateId === 'talking-head-captions',
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Export failed');
      }

      const data = await res.json();

      // Simulate progress while processing
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 95) {
            clearInterval(interval);
            return 95;
          }
          return p + 5;
        });
      }, 500);

      // In a real implementation, we'd poll for the job status
      // For now, just complete after a delay
      setTimeout(() => {
        clearInterval(interval);
        setProgress(100);
        setExporting(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
      setExporting(false);
    }
  };

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

      {/* Progress bar */}
      {exporting && (
        <div className="space-y-1">
          <div className="w-full h-1.5 bg-[#27272A] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#6366F1] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="font-body text-[11px] text-[#71717A]">
            {progress < 100 ? `Processing... ${progress}%` : 'Complete!'}
          </p>
        </div>
      )}

      {error && (
        <p className="font-body text-[11px] text-[#6366F1]">{error}</p>
      )}

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={!canExport || exporting}
        className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-md font-body text-[13px] font-medium transition-all ${
          canExport && !exporting
            ? 'bg-[#6366F1] text-white hover:opacity-90'
            : 'bg-[#27272A] text-[#71717A] cursor-not-allowed'
        }`}
      >
        {exporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {exporting ? 'Exporting...' : canExport ? 'Export Video' : 'Select a template to export'}
      </button>
    </div>
  );
}
