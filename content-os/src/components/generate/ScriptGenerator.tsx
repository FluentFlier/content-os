'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { GenerateOutput } from './GenerateOutput';
import { usePillars } from '@/hooks/usePillars';

const PILLAR_PROMPTS: Record<string, string> = {
  'hot-take': `Generate a hot take Reel script.
TOPIC (optional): [topic or "choose a strong angle based on the creator's real experience"]
HOOK: One bold controversial sentence. Stop-scrolling.
ARGUMENT: The actual claim, one sentence.
EVIDENCE: Specific proof or real example from the creator's background, one sentence.
FLIP: What they should do or think instead, one sentence.
CTA: One direct question.
Under 60 seconds when spoken. No em dashes. The creator's voice only.`,

  hackathon: `Generate a hackathon story Reel script. Draw from the creator's hackathon experience. Pick a specific, realistic, dramatic story.
HOOK: Drop into the most intense moment. No setup.
SETUP: 2 bullets -- challenge, stakes.
TURN: 1 bullet -- what changed under pressure.
LESSON: 1 bullet -- what this teaches about building.
CTA: Ask viewers about their own experience.
No em dashes.`,

  founder: `Generate a founder-in-public script about building the creator's product or startup.
HOOK: One honest vulnerable sentence. Real energy, no spin.
REALITY: 2 bullets -- what was hard or went wrong.
PROGRESS: 1 bullet -- one thing that moved.
LESSON: 1 bullet -- what this is teaching about startups.
CTA: Invite builders to share their week.
Sound like Tuesday at 11pm, not a success story. No em dashes.`,

  explainer: `Generate a concept explainer based on the creator's expertise. Under 60 seconds.
TOPIC (optional): [topic or "choose one concept from the creator's domain"]
HOOK: A question that makes them feel dumb for not knowing.
SIMPLE VERSION: 2 bullets, zero jargon. 16-year-old readable.
WHY IT MATTERS: 1 bullet.
MISCONCEPTION: 1 bullet.
CTA: Ask what to explain next.
No em dashes.`,

  origin: `Generate an origin/arc video script based on the creator's background and journey.
HOOK: One specific detail that makes someone lean in.
THE PATH: 2 bullets -- the unexpected parts.
THROUGH LINE: 1 bullet -- what actually connects it all.
NOW: 1 bullet -- where it's heading.
CTA: Invite non-linear paths in comments.
No em dashes.`,

  research: `Generate a research unlocked video script that makes the creator's research feel accessible and interesting.
HOOK: One line that makes someone who hates science want to keep watching.
THE WEIRD PART: 2 bullets -- what is genuinely surprising about the research.
WHY IT MATTERS: 1 bullet -- real-world stakes.
THE META LESSON: 1 bullet -- what doing research teaches you that classes do not.
CTA: Ask if they knew this kind of research existed.
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
}

export function ScriptGenerator({
  initialResult = '',
  initialTopic = '',
  initialPillar = '',
}: ScriptGeneratorProps) {
  const { pillars: pillarList, getLabel, getColor } = usePillars();

  const [pillar, setPillar] = useState<string>(
    initialPillar && pillarList.some((p) => p.value === initialPillar)
      ? initialPillar
      : pillarList[0]?.value ?? '',
  );
  const [topic, setTopic] = useState(initialTopic);
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
        <label className="block font-['Space_Grotesk'] text-[13px] text-[#4A4540] mb-2">Content Pillar</label>
        <div className="flex flex-wrap gap-2">
          {pillarList.map((p) => (
            <button
              key={p.value}
              onClick={() => setPillar(p.value)}
              className="px-4 py-1.5 rounded-[20px] font-['Space_Grotesk'] text-[13px] font-medium transition-all duration-100"
              style={{
                backgroundColor: '#F4F2EF',
                color: pillar === p.value ? p.color : '#4A4540',
                border: pillar === p.value
                  ? `1.5px solid ${p.color}`
                  : '0.5px solid rgba(26,23,20,0.12)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-['Space_Grotesk'] text-[13px] text-[#4A4540] mb-2">
          Topic (optional)
        </label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          rows={3}
          placeholder="Enter a specific topic or leave blank for a general script..."
          className="w-full bg-[#F4F2EF] border-[0.5px] border-[rgba(26,23,20,0.12)] rounded-[7px] px-4 py-3 font-['Space_Grotesk'] text-[13px] text-[#1A1714] placeholder:text-[#8C857D] focus:outline-none focus:border-[rgba(26,23,20,0.40)] resize-none transition-colors duration-100"
        />
      </div>

      <Button onClick={generate} loading={loading}>
        Generate Script
      </Button>

      {error && <p className="font-['Space_Grotesk'] text-[13px] text-[#EB5E55]">{error}</p>}

      <GenerateOutput text={output} loading={loading} />
    </div>
  );
}
