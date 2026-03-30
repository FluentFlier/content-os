'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { GenerateOutput } from './GenerateOutput';

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

export function TrendCatcher() {
  const [trend, setTrend] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!trend.trim()) {
      setError('Describe the trending topic first');
      return;
    }
    setLoading(true);
    setError('');
    setOutput('');
    const prompt = `A trend or topic is happening: ${trend.trim()}.
Find the creator's specific, earned angle on it. Use the creator's background and context to find a real connection. The creator should not comment on trends without a personal connection.
ANGLE: The creator's specific POV (one sentence)
CONNECTION: What from their actual experience gives them the right to speak on this
HOOK: First line on camera
SCRIPT OUTLINE:
- (beat 1)
- (beat 2)
- (beat 3)
CTA: Closing question
AVOID: What would make this feel generic or unearned
No em dashes.`;
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
        <label className="block font-['Space_Grotesk'] text-[13px] text-[#475569] mb-2">
          Trending topic or moment
        </label>
        <textarea
          value={trend}
          onChange={(e) => setTrend(e.target.value)}
          rows={4}
          placeholder="Describe a trending topic in tech, culture, or your space..."
          className="w-full bg-[#F8FAFC] border-[0.5px] border-[rgba(26,23,20,0.12)] rounded-[7px] px-4 py-3 font-['Space_Grotesk'] text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[rgba(26,23,20,0.40)] resize-none transition-colors duration-100"
        />
      </div>

      <Button
        onClick={generate}
        loading={loading}
        disabled={!trend.trim()}
      >
        Find My Angle
      </Button>

      {error && <p className="font-['Space_Grotesk'] text-[13px] text-[#6366F1]">{error}</p>}

      <GenerateOutput text={output} loading={loading} />
    </div>
  );
}
