'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { GenerateOutput } from './GenerateOutput';
import { ALL_PLATFORMS, type Platform } from '@/types/database';

async function callGenerate(prompt: string): Promise<string> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Generation failed');
  }
  const { text } = await res.json();
  return text;
}

const PLATFORM_GUIDELINES: Record<Platform, string> = {
  instagram:
    'instagram: tight, punchy, visual. Short beats. Under 90 seconds.',
  linkedin:
    'linkedin: longer, more reflective. Add professional context. First line hooks. Expand the lesson.',
  twitter:
    'twitter: thread format. Each tweet numbered. Under 280 chars each. Hook tweet earns the click.',
  threads:
    'threads: conversational, like texting a smart friend. Short posts. Real reactions. No polish.',
};

export function Repurpose() {
  const [script, setScript] = useState('');
  const [fromPlatform, setFromPlatform] = useState<Platform>('instagram');
  const [toPlatform, setToPlatform] = useState<Platform>('linkedin');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!script.trim()) {
      setError('Paste a script first');
      return;
    }
    setLoading(true);
    setError('');
    setOutput('');
    const prompt = `Adapt this ${fromPlatform} script for ${toPlatform}.
SCRIPT: ${script.trim()}

${toPlatform} guidelines:
- ${PLATFORM_GUIDELINES[toPlatform]}

Match the voice, keep every specific detail, adapt only the format and length. No em dashes.`;
    try {
      const text = await callGenerate(prompt);
      setOutput(text);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block font-['Space_Grotesk'] text-[13px] text-[#475569] mb-2">Paste script</label>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          rows={6}
          placeholder="Paste the script you want to repurpose..."
          className="w-full bg-[#F8FAFC] border-[0.5px] border-[rgba(26,23,20,0.12)] rounded-[7px] px-4 py-3 font-['Space_Grotesk'] text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[rgba(26,23,20,0.40)] resize-none transition-colors duration-100"
        />
      </div>

      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="block font-['Space_Grotesk'] text-[11px] text-[#94A3B8] mb-1">From</label>
          <select
            value={fromPlatform}
            onChange={(e) => setFromPlatform(e.target.value as Platform)}
            className="bg-[#F8FAFC] border-[0.5px] border-[rgba(26,23,20,0.12)] rounded-[7px] px-3 py-2 font-['Space_Grotesk'] text-[13px] text-[#0F172A] focus:outline-none focus:border-[rgba(26,23,20,0.40)] transition-colors duration-100"
          >
            {ALL_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-['Space_Grotesk'] text-[11px] text-[#94A3B8] mb-1">To</label>
          <select
            value={toPlatform}
            onChange={(e) => setToPlatform(e.target.value as Platform)}
            className="bg-[#F8FAFC] border-[0.5px] border-[rgba(26,23,20,0.12)] rounded-[7px] px-3 py-2 font-['Space_Grotesk'] text-[13px] text-[#0F172A] focus:outline-none focus:border-[rgba(26,23,20,0.40)] transition-colors duration-100"
          >
            {ALL_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button
        onClick={generate}
        loading={loading}
        disabled={!script.trim()}
      >
        Repurpose
      </Button>

      {error && <p className="font-['Space_Grotesk'] text-[13px] text-[#6366F1]">{error}</p>}

      <GenerateOutput text={output} loading={loading} />
    </div>
  );
}
