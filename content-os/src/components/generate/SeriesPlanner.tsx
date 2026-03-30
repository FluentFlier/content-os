'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { GenerateOutput } from './GenerateOutput';
import { getInsforgeClient } from '@/lib/insforge/client';
import type { Pillar, Platform } from '@/types/database';

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

export function SeriesPlanner() {
  const [concept, setConcept] = useState('');
  const [numParts, setNumParts] = useState(5);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const generate = async () => {
    if (!concept.trim()) {
      setError('Enter a series concept');
      return;
    }
    setLoading(true);
    setError('');
    setOutput('');
    setSaved(false);
    const prompt = `Plan a ${numParts}-part Instagram content series on: ${concept.trim()}.
For each part:
PART [n]:
TITLE: (punchy episode title)
HOOK: (first line on camera)
CORE POINT: (what this part establishes -- one sentence)
CLIFFHANGER/BRIDGE: (how this part makes them want the next one)

Each part works standalone but rewards watching all. Part 1 must be the strongest hook. Build toward a payoff. The creator's voice throughout. No em dashes.`;
    try {
      const text = await callGenerate(prompt);
      setOutput(text);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const saveSeries = async () => {
    if (!output) return;
    setSaving(true);
    setError('');
    try {
      const insforge = getInsforgeClient();
      const { data: userData } = await insforge.auth.getCurrentUser();
      if (!userData?.user) throw new Error('Not logged in');

      const { data: series, error: seriesErr } = await insforge.database
        .from('series')
        .insert({
          user_id: userData.user.id,
          name: concept.trim(),
          description: output,
          pillar: 'explainer' as Pillar,
          total_parts: numParts,
        })
        .select()
        .single();
      if (seriesErr) throw seriesErr;

      // Parse parts and create post entries
      const partRegex = /PART\s*\[?(\d+)\]?[:\s]*\n?TITLE:\s*(.+)/gi;
      let match;
      const posts: Array<{
        user_id: string;
        title: string;
        pillar: Pillar;
        status: string;
        platform: Platform;
        script: string;
        series_id: string;
        series_position: number;
      }> = [];

      while ((match = partRegex.exec(output)) !== null) {
        const partNum = parseInt(match[1], 10);
        const title = match[2].trim();
        const partStart = match.index;
        const nextPartIdx = output.indexOf('PART', partStart + 5);
        const partText =
          nextPartIdx > 0
            ? output.slice(partStart, nextPartIdx).trim()
            : output.slice(partStart).trim();

        posts.push({
          user_id: userData.user.id,
          title: `${concept.trim()} - ${title}`,
          pillar: 'explainer',
          status: 'idea',
          platform: 'instagram',
          script: partText,
          series_id: series.id,
          series_position: partNum,
        });
      }

      if (posts.length > 0) {
        const { error: postsErr } = await insforge.database
          .from('posts')
          .insert(posts);
        if (postsErr) throw postsErr;
      }

      setSaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save series');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block font-['Space_Grotesk'] text-[13px] text-[#4A4540] mb-2">
          Series concept
        </label>
        <input
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder="What is this series about?"
          className="w-full bg-[#F4F2EF] border-[0.5px] border-[rgba(26,23,20,0.12)] rounded-[7px] px-4 py-3 font-['Space_Grotesk'] text-[13px] text-[#1A1714] placeholder:text-[#8C857D] focus:outline-none focus:border-[rgba(26,23,20,0.40)] transition-colors duration-100"
        />
      </div>

      <div>
        <label className="block font-['Space_Grotesk'] text-[13px] text-[#4A4540] mb-2">
          Number of parts
        </label>
        <input
          type="number"
          min={2}
          max={10}
          value={numParts}
          onChange={(e) =>
            setNumParts(
              Math.min(10, Math.max(2, parseInt(e.target.value, 10) || 2)),
            )
          }
          className="w-24 bg-[#F4F2EF] border-[0.5px] border-[rgba(26,23,20,0.12)] rounded-[7px] px-4 py-3 font-['Space_Grotesk'] text-[13px] text-[#1A1714] focus:outline-none focus:border-[rgba(26,23,20,0.40)] transition-colors duration-100"
        />
      </div>

      <Button
        onClick={generate}
        loading={loading}
        disabled={!concept.trim()}
      >
        Plan Series
      </Button>

      {error && <p className="font-['Space_Grotesk'] text-[13px] text-[#EB5E55]">{error}</p>}

      <GenerateOutput text={output} loading={loading}>
        <Button
          variant="secondary"
          size="sm"
          onClick={saveSeries}
          loading={saving}
          disabled={saved}
        >
          {saved ? 'Series Saved' : 'Save as Series'}
        </Button>
      </GenerateOutput>
    </div>
  );
}
