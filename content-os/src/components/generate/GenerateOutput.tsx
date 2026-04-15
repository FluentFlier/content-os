'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CopyButton } from '@/components/ui/CopyButton';
import { SkeletonLines } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { getInsforgeClient } from '@/lib/insforge/client';
import { PLATFORMS } from '@/lib/constants';
import type { Platform } from '@/lib/constants';
import { usePillars } from '@/hooks/usePillars';
import { OptimizePanel } from './OptimizePanel';

interface GenerateOutputProps {
  text: string;
  loading: boolean;
  sourcePlatform?: Platform;
  children?: React.ReactNode;
  onTextUpdate?: (newText: string) => void;
}

export function GenerateOutput({ text, loading, sourcePlatform, children, onTextUpdate }: GenerateOutputProps) {
  const [showSave, setShowSave] = useState(false);
  const [humanizing, setHumanizing] = useState(false);
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [scoring, setScoring] = useState(false);

  async function handleHumanize() {
    setHumanizing(true);
    try {
      const res = await fetch('/api/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('Humanization failed');
      const { text: humanized } = await res.json();
      if (onTextUpdate) onTextUpdate(humanized);
    } catch (err) {
      console.error('Humanize error:', err);
    } finally {
      setHumanizing(false);
    }
  }

  async function handleScore() {
    setScoring(true);
    try {
      const res = await fetch('/api/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, scoreOnly: true }),
      });
      if (!res.ok) throw new Error('Scoring failed');
      const { score } = await res.json();
      setAiScore(score);
    } catch {
      setAiScore(null);
    } finally {
      setScoring(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-[#18181B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[12px] p-[13px_14px] space-y-3">
        <SkeletonLines count={3} />
      </div>
    );
  }

  if (!text) return null;

  return (
    <div className="space-y-4">
      <div className="bg-[#18181B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[12px] p-[13px_14px] space-y-4">
        <pre className="whitespace-pre-wrap font-body text-[13px] text-[#FAFAFA] leading-[1.55]">
          {text}
        </pre>
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton text={text} />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowSave(true)}
          >
            Save to Library
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleHumanize}
            loading={humanizing}
          >
            Humanize
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleScore}
            loading={scoring}
          >
            {aiScore !== null ? (
              <span className={aiScore > 60 ? 'text-[#FCA5A5]' : aiScore > 30 ? 'text-[#FCD34D]' : 'text-[#6EE7B7]'}>
                AI Score: {aiScore}/100
              </span>
            ) : 'Check AI Score'}
          </Button>
          {children}
        </div>
      </div>

      {/* Platform optimization section */}
      <OptimizePanel content={text} sourcePlatform={sourcePlatform} />

      <SaveToLibraryModal
        open={showSave}
        onClose={() => setShowSave(false)}
        script={text}
      />
    </div>
  );
}

/* Save to Library modal */
function SaveToLibraryModal({
  open,
  onClose,
  script,
}: {
  open: boolean;
  onClose: () => void;
  script: string;
}) {
  const searchParams = useSearchParams();
  const seriesId = searchParams.get('series_id') || null;
  const seriesPosition = searchParams.get('series_position') ? parseInt(searchParams.get('series_position')!, 10) : null;
  const { pillars: pillarList, loading: pillarsLoading } = usePillars();
  const [title, setTitle] = useState(() => {
    const firstLine = script.split('\n').find((l) => l.trim())?.trim() ?? '';
    return firstLine.replace(/^[#*\->\s]+/, '').slice(0, 120);
  });
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [pillar, setPillar] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Sync pillar state when custom pillars finish loading
  useEffect(() => {
    if (pillarsLoading || pillarList.length === 0) return;
    if (!pillar) {
      setPillar(pillarList[0].value);
    }
  }, [pillarsLoading, pillarList, pillar]);

  const save = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const insforge = getInsforgeClient();
      const { data: userData } = await insforge.auth.getCurrentUser();
      if (!userData?.user) throw new Error('Not logged in');
      const insertPayload: Record<string, unknown> = {
        user_id: userData.user.id,
        title: title.trim(),
        pillar,
        script,
        status: 'scripted',
        platform,
      };
      if (seriesId) insertPayload.series_id = seriesId;
      if (seriesPosition !== null) insertPayload.series_position = seriesPosition;
      const { error: dbError } = await insforge.database
        .from('posts')
        .insert(insertPayload)
        .select()
        .single();
      if (dbError) throw dbError;
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Save to Library">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title"
        className="w-full bg-[#18181B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[7px] px-3 py-2 font-body text-[13px] text-[#FAFAFA] placeholder:text-[#71717A] focus:outline-none focus:border-[rgba(255,255,255,0.40)] transition-colors duration-100"
      />
      <div className="flex gap-3">
        <select
          value={pillar}
          onChange={(e) => setPillar(e.target.value)}
          className="flex-1 bg-[#18181B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[7px] px-3 py-2 font-body text-[13px] text-[#FAFAFA] focus:outline-none focus:border-[rgba(255,255,255,0.40)] transition-colors duration-100"
        >
          {pillarList.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as Platform)}
          className="flex-1 bg-[#18181B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[7px] px-3 py-2 font-body text-[13px] text-[#FAFAFA] focus:outline-none focus:border-[rgba(255,255,255,0.40)] transition-colors duration-100"
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="font-body text-[13px] text-[#6366F1]">{error}</p>}
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" onClick={save} loading={saving}>
          Save
        </Button>
      </div>
    </Modal>
  );
}
