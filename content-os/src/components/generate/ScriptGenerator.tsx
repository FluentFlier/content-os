'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { GenerateOutput } from './GenerateOutput';
import { usePillars } from '@/hooks/usePillars';
import { PLATFORMS } from '@/lib/constants';
import type { Platform } from '@/lib/constants';

const PILLAR_PROMPTS: Record<string, string> = {
  'hot-take': `Generate a hot take Reel script.
TOPIC (optional): [topic or "choose a strong angle based on the creator's real experience"]
HOOK: One bold controversial sentence. Stop-scrolling.
ARGUMENT: The actual claim, one sentence.
EVIDENCE: Specific proof or real example from the creator's background, one sentence.
FLIP: What they should do or think instead, one sentence.
CTA: One direct question.
Under 60 seconds when spoken. No em dashes. The creator's voice only.`,

  tips: `Generate a quick tips Reel script based on the creator's expertise. Under 60 seconds.
TOPIC (optional): [topic or "choose a useful tip from the creator's domain"]
HOOK: One line that promises a specific, actionable outcome.
TIPS: 3 short bullets. Each one immediately actionable.
THE TRAP: 1 bullet -- common mistake people make.
CTA: Ask which tip they will try first.
No em dashes.`,

  story: `Generate a short personal story Reel script drawn from the creator's background.
HOOK: Drop into the most intense or surprising moment. No setup.
CONTEXT: 1 bullet -- just enough background.
TURN: 1 bullet -- what changed.
LESSON: 1 bullet -- what this teaches.
CTA: Ask viewers about a similar experience.
Feels real and specific, not generic. No em dashes.`,

  explainer: `Generate a concept explainer based on the creator's expertise. Under 60 seconds.
TOPIC (optional): [topic or "choose one concept from the creator's domain"]
HOOK: A question that makes them feel dumb for not knowing.
SIMPLE VERSION: 2 bullets, zero jargon. 16-year-old readable.
WHY IT MATTERS: 1 bullet.
MISCONCEPTION: 1 bullet.
CTA: Ask what to explain next.
No em dashes.`,

  'behind-the-scenes': `Generate a behind-the-scenes Reel script showing how the creator actually works.
HOOK: One line that reveals something people would not expect.
THE REALITY: 2 bullets -- what the process actually looks like.
THE DETAIL: 1 bullet -- one specific thing viewers can steal.
CTA: Ask what part of their process they want to see next.
Honest, not polished. No em dashes.`,

  research: `Generate a research unlocked video script that makes interesting findings feel accessible.
HOOK: One line that makes someone who knows nothing about this topic want to keep watching.
THE WEIRD PART: 2 bullets -- what is genuinely surprising.
WHY IT MATTERS: 1 bullet -- real-world stakes.
THE TAKEAWAY: 1 bullet -- one thing viewers can do with this information.
CTA: Ask if they knew this kind of thing existed.
No em dashes.`,
};

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

interface ScriptGeneratorProps {
  initialResult?: string;
  initialTopic?: string;
  initialPillar?: string;
  initialPlatform?: Platform;
}

export function ScriptGenerator({
  initialResult = '',
  initialTopic = '',
  initialPillar = '',
  initialPlatform,
}: ScriptGeneratorProps) {
  const { pillars: pillarList, loading: pillarsLoading, getLabel, getColor } = usePillars();

  const [pillar, setPillar] = useState<string>(initialPillar);
  const [topic, setTopic] = useState(initialTopic);
  const [platform, setPlatform] = useState<Platform>(initialPlatform ?? 'instagram');

  // Sync pillar state when custom pillars finish loading asynchronously
  useEffect(() => {
    if (pillarsLoading || pillarList.length === 0) return;
    // If pillar is still empty (no initial value), default to first loaded pillar
    if (!pillar) {
      setPillar(pillarList[0].value);
      return;
    }
    // If pillar was set from initial props but doesn't exist in loaded list, reset
    if (!pillarList.some((p) => p.value === pillar)) {
      setPillar(pillarList[0].value);
    }
  }, [pillarsLoading, pillarList, pillar]);
  const [output, setOutput] = useState(initialResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true);
    setError('');
    setOutput('');
    try {
      const info = pillarList.find((p) => p.value === pillar);
      let prompt: string;
      if (info?.promptTemplate) {
        prompt = info.promptTemplate;
      } else if (PILLAR_PROMPTS[pillar]) {
        prompt = PILLAR_PROMPTS[pillar];
      } else {
        prompt = `Write a script for a "${getLabel(pillar)}" post. The creator's voice only. Under 60 seconds when spoken. No em dashes.
HOOK: One bold first line.
BODY: 3-4 beats, each one sentence.
CTA: One direct question.`;
      }
      if (topic.trim()) {
        prompt += `\n\nTopic: ${topic.trim()}`;
      }
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
        <label className="block font-body text-[13px] text-[#A1A1AA] mb-2">Content Pillar</label>
        <div className="flex flex-wrap gap-2">
          {pillarList.map((p) => (
            <button
              key={p.value}
              onClick={() => setPillar(p.value)}
              className="px-4 py-1.5 rounded-[20px] font-body text-[13px] font-medium transition-all duration-100"
              style={{
                backgroundColor: '#18181B',
                color: pillar === p.value ? p.color : '#A1A1AA',
                border: pillar === p.value
                  ? `1.5px solid ${p.color}`
                  : '0.5px solid rgba(255,255,255,0.12)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-body text-[13px] text-[#A1A1AA] mb-2">
          Topic (optional)
        </label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          rows={3}
          placeholder="Enter a specific topic or leave blank for a general script..."
          className="w-full bg-[#18181B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[7px] px-4 py-3 font-body text-[13px] text-[#FAFAFA] placeholder:text-[#71717A] focus:outline-none focus:border-[rgba(255,255,255,0.40)] resize-none transition-colors duration-100"
        />
      </div>

      <div>
        <label className="block font-body text-[13px] text-[#A1A1AA] mb-2">
          Target Platform
        </label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className="px-4 py-1.5 rounded-[20px] font-body text-[13px] font-medium transition-all duration-100"
              style={{
                backgroundColor: '#18181B',
                color: platform === p ? '#FAFAFA' : '#A1A1AA',
                border: platform === p
                  ? '1.5px solid rgba(255,255,255,0.40)'
                  : '0.5px solid rgba(255,255,255,0.12)',
              }}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={generate} loading={loading}>
        Generate Script
      </Button>

      {error && <p className="font-body text-[13px] text-[#6366F1]">{error}</p>}

      <GenerateOutput text={output} loading={loading} sourcePlatform={platform} />
    </div>
  );
}
