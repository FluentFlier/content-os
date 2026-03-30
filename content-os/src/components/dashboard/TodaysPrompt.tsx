'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

const CACHE_KEY = 'dispatch_todays_prompt';

interface CachedPrompt {
  date: string;
  text: string;
}

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getCachedPrompt(): string | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedPrompt = JSON.parse(raw);
    if (cached.date === getTodayDate() && cached.text) {
      return cached.text;
    }
    return null;
  } catch {
    return null;
  }
}

function setCachedPrompt(text: string): void {
  try {
    const entry: CachedPrompt = { date: getTodayDate(), text };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage may be unavailable; silently ignore
  }
}

interface TodaysPromptProps {
  postsSummary: string;
}

export default function TodaysPrompt({ postsSummary }: TodaysPromptProps) {
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSuggestion = useCallback(async () => {
    setLoading(true);
    try {
      const prompt = `Here is the creator's content schedule for this week: ${postsSummary}. What single content idea is most missing? Give one specific idea. Pillar name, then one sentence. No em dashes.`;
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.text ?? 'Could not generate a suggestion.';
        setSuggestion(text);
        setCachedPrompt(text);
      } else {
        setSuggestion('Could not generate a suggestion right now. Try again later.');
      }
    } catch {
      setSuggestion('Could not generate a suggestion right now. Try again later.');
    } finally {
      setLoading(false);
    }
  }, [postsSummary]);

  useEffect(() => {
    const cached = getCachedPrompt();
    if (cached) {
      setSuggestion(cached);
      setLoading(false);
      return;
    }
    fetchSuggestion();
  }, [fetchSuggestion]);

  return (
    <section className="bg-[#FFFFFF] border-[0.5px] border-[rgba(26,23,20,0.12)] rounded-[12px] p-[13px_14px]">
      <div className="flex items-center justify-between mb-3">
        <p className="font-['Space_Grotesk'] font-medium text-[10px] uppercase tracking-[0.10em] text-[#94A3B8]">
          TODAY&apos;S PROMPT
        </p>
        <button
          onClick={fetchSuggestion}
          disabled={loading}
          className="text-[#94A3B8] hover:text-[#6366F1] transition-colors duration-100 disabled:opacity-50"
          aria-label="Refresh suggestion"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-3 w-full bg-[#F1F5F9] rounded animate-pulse" />
          <div className="h-3 w-3/4 bg-[#F1F5F9] rounded animate-pulse" />
          <div className="h-3 w-5/6 bg-[#F1F5F9] rounded animate-pulse" />
        </div>
      ) : (
        <p className="font-['Space_Grotesk'] text-[13px] text-[#0F172A] leading-[1.55]">
          {suggestion}
        </p>
      )}
    </section>
  );
}
