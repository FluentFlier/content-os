'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { GenerateOutput } from './GenerateOutput';
import { getInsforgeClient } from '@/lib/insforge/client';
import { usePillars } from '@/hooks/usePillars';

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

export function StoryMine() {
  const router = useRouter();
  const { toast } = useToast();
  const { pillarValues } = usePillars();
  const [memory, setMemory] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savingStory, setSavingStory] = useState(false);
  const [storySaved, setStorySaved] = useState(false);
  const [converting, setConverting] = useState(false);

  const generate = async () => {
    if (!memory.trim()) {
      setError('Describe a memory first');
      return;
    }
    setLoading(true);
    setError('');
    setOutput('');
    const prompt = `Mine this memory for the strongest Instagram content angle.
MEMORY: ${memory.trim()}

Return exactly:
PILLAR: Choose the best matching content pillar from the creator's pillars
ANGLE: One sentence -- what makes this interesting to a stranger.
HOOK: Exact first line to say on camera. No setup. Drop in.
SCRIPT:
- (beat 1)
- (beat 2)
- (beat 3)
- (beat 4)
CTA: Closing question.
CAPTION LINE: Just the first line of the Instagram caption (before "more").
PLATFORM FIT: Best platform for this specific story and why (one sentence).

Use every specific detail from the memory. Never genericize. No em dashes.`;
    try {
      const text = await callGenerate(prompt);
      setOutput(text);
      setStorySaved(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const saveToStoryBank = async () => {
    setSavingStory(true);
    try {
      const insforge = getInsforgeClient();
      const { data: userData } = await insforge.auth.getCurrentUser();
      if (!userData?.user) throw new Error('Not logged in');

      const angleMatch = output.match(/ANGLE:\s*(.+)/i);
      const hookMatch = output.match(/HOOK:\s*(.+)/i);
      const captionMatch = output.match(/CAPTION LINE:\s*(.+)/i);
      const pillarMatch = output.match(/PILLAR:\s*(.+)/i);
      const scriptMatch = output.match(
        /SCRIPT:\s*([\s\S]*?)(?=CTA:|CAPTION|PLATFORM|$)/i,
      );

      const pillarRaw =
        pillarMatch?.[1]?.trim().toLowerCase().replace(/\s+/g, '-') || null;
      const validPillar = pillarRaw && pillarValues.includes(pillarRaw)
        ? pillarRaw
        : null;

      const { error: dbError } = await insforge.database
        .from('story_bank')
        .insert({
          user_id: userData.user.id,
          raw_memory: memory.trim(),
          mined_angle: angleMatch?.[1]?.trim() || null,
          mined_hook: hookMatch?.[1]?.trim() || null,
          mined_script: scriptMatch?.[1]?.trim() || null,
          mined_caption_line: captionMatch?.[1]?.trim() || null,
          pillar: validPillar,
          used: false,
        })
        .select()
        .single();
      if (dbError) throw dbError;
      setStorySaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSavingStory(false);
    }
  };

  const convertToPost = async () => {
    setConverting(true);
    setError('');
    try {
      const angleMatch = output.match(/ANGLE:\s*(.+)/i);
      const hookMatch = output.match(/HOOK:\s*(.+)/i);
      const captionMatch = output.match(/CAPTION LINE:\s*(.+)/i);
      const pillarMatch = output.match(/PILLAR:\s*(.+)/i);
      const scriptMatch = output.match(
        /SCRIPT:\s*([\s\S]*?)(?=CTA:|CAPTION LINE:|PLATFORM FIT:|$)/i,
      );

      const pillarRaw =
        pillarMatch?.[1]?.trim().toLowerCase().replace(/\s+/g, '-') || null;
      const validPillar = pillarRaw && pillarValues.includes(pillarRaw)
        ? pillarRaw
        : (pillarValues[0] ?? '');

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: angleMatch?.[1]?.trim() || 'Untitled Post',
          script: scriptMatch?.[1]?.trim() || '',
          hook: hookMatch?.[1]?.trim() || '',
          caption: captionMatch?.[1]?.trim() || '',
          pillar: validPillar,
          status: 'scripted',
          platform: 'instagram',
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create post');
      }

      toast('Post created');
      router.push('/library');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to convert');
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block font-body text-[13px] text-[#A1A1AA] mb-2">
          Describe any memory or experience.
        </label>
        <textarea
          value={memory}
          onChange={(e) => setMemory(e.target.value)}
          rows={6}
          placeholder="A pivotal moment from your work. Something that happened while building your product. The day you almost quit. A real experience that shaped how you think. Anything that felt real."
          className="w-full bg-[#18181B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[7px] px-4 py-3 font-body text-[13px] text-[#FAFAFA] placeholder:text-[#71717A] focus:outline-none focus:border-[rgba(255,255,255,0.40)] resize-none transition-colors duration-100"
        />
        <p className="font-body text-[11px] text-[#71717A] mt-1">
          A pivotal moment from your work. Something that happened while building your product.
          The day you almost quit. A real experience that shaped how you think. Anything that felt real.
        </p>
      </div>

      <button
        onClick={generate}
        disabled={loading || !memory.trim()}
        className="inline-flex items-center justify-center gap-2 rounded-[7px] font-body font-medium text-[13px] px-5 py-[10px] bg-[#F59E0B] text-[#09090B] hover:opacity-90 transition-all duration-100 disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading && <span className="h-4 w-4 rounded bg-[#27272A] animate-pulse" />}
        Mine It
      </button>

      {error && <p className="font-body text-[13px] text-[#6366F1]">{error}</p>}

      <GenerateOutput text={output} loading={loading}>
        <Button
          variant="secondary"
          size="sm"
          onClick={saveToStoryBank}
          loading={savingStory}
          disabled={storySaved}
        >
          {storySaved ? 'Saved to Story Bank' : 'Save to Story Bank'}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={convertToPost}
          loading={converting}
        >
          Convert to Post
        </Button>
      </GenerateOutput>
    </div>
  );
}
