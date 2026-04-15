'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { invalidatePillarCache } from '@/hooks/usePillars';

type AnswerKey =
  | 'display_name'
  | 'bio'
  | 'audience'
  | 'pillars_raw'
  | 'sample_posts'
  | 'voice_self'
  | 'voice_avoid'
  | 'background';

interface Question {
  key: AnswerKey;
  prompt: string;
  placeholder: string;
  multiline?: boolean;
  optional?: boolean;
  rows?: number;
}

const QUESTIONS: Question[] = [
  {
    key: 'display_name',
    prompt: "First — what should we call you? Real name, handle, or brand.",
    placeholder: 'e.g. Anis, or @anisbuilds',
  },
  {
    key: 'bio',
    prompt: 'In one sentence: what do you do, and who is it for?',
    placeholder: 'e.g. I help solo founders ship faster with AI tooling.',
    multiline: true,
    rows: 2,
    optional: true,
  },
  {
    key: 'audience',
    prompt: 'Who follows you (or who do you want to)? One line is fine.',
    placeholder: 'e.g. Indie hackers, early-stage founders',
    optional: true,
  },
  {
    key: 'pillars_raw',
    prompt: 'What topics do you post about? Comma-separated, or one per line.',
    placeholder: 'e.g. shipping fast, hiring, AI agents, taste',
    multiline: true,
    rows: 3,
    optional: true,
  },
  {
    key: 'sample_posts',
    prompt:
      "Paste 1–3 of your posts so I can learn your voice. Separate them with a blank line. Skip if you don't have any yet.",
    placeholder: 'paste a tweet, LinkedIn post, etc.',
    multiline: true,
    rows: 8,
    optional: true,
  },
  {
    key: 'voice_self',
    prompt: 'How would you describe how you talk? Casual? Punchy? Analytical?',
    placeholder: 'e.g. blunt, no fluff, lots of analogies',
    multiline: true,
    rows: 2,
    optional: true,
  },
  {
    key: 'voice_avoid',
    prompt: 'Anything the AI should NEVER do? (Words, emoji, phrases.)',
    placeholder: "e.g. no em dashes, never say 'leverage', no emoji",
    multiline: true,
    rows: 2,
    optional: true,
  },
  {
    key: 'background',
    prompt:
      "Last one. Anything else I should always remember? Current projects, where you're based, your story.",
    placeholder: "Tell me whatever's useful — I'll remember it.",
    multiline: true,
    rows: 6,
    optional: true,
  },
];

interface ChatTurn {
  role: 'assistant' | 'user';
  text: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      role: 'assistant',
      text: "Hey — welcome to Dispatch. I'll ask a few short questions to set up your voice. Takes about 2 minutes. Skip anything you don't have.",
    },
    { role: 'assistant', text: QUESTIONS[0].prompt },
  ]);
  const [stepIdx, setStepIdx] = useState(0);
  const [draft, setDraft] = useState('');
  const [answers, setAnswers] = useState<Partial<Record<AnswerKey, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    inputRef.current?.focus();
  }, [turns]);

  const current = QUESTIONS[stepIdx];
  const isLast = stepIdx === QUESTIONS.length - 1;

  function handleSend(skipValue = false) {
    if (submitting) return;
    const value = skipValue ? '' : draft.trim();

    if (!skipValue && !value) return;
    if (!current.optional && !value) {
      setError('This one is required.');
      return;
    }
    setError('');

    const userText = value || '(skipped)';
    const next: ChatTurn[] = [...turns, { role: 'user', text: userText }];
    const newAnswers: Partial<Record<AnswerKey, string>> = {
      ...answers,
      [current.key]: value,
    };
    setAnswers(newAnswers);
    setDraft('');

    if (isLast) {
      next.push({
        role: 'assistant',
        text: "Got it. Synthesizing your persona — give me a few seconds…",
      });
      setTurns(next);
      void finish(newAnswers);
      return;
    }

    const nextQ = QUESTIONS[stepIdx + 1];
    next.push({ role: 'assistant', text: nextQ.prompt });
    setTurns(next);
    setStepIdx(stepIdx + 1);
  }

  async function finish(finalAnswers: Partial<Record<AnswerKey, string>>) {
    setSubmitting(true);
    try {
      const res = await fetch('/api/onboarding/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to set up profile');

      invalidatePillarCache();

      const pillarNames = (data.persona?.pillars ?? [])
        .map((p: { name: string }) => p.name)
        .join(', ');

      setTurns((t) => [
        ...t,
        {
          role: 'assistant',
          text: `Done. Voice locked in${pillarNames ? `, with pillars: ${pillarNames}` : ''}. Taking you to your dashboard.`,
        },
      ]);

      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Setup failed';
      setError(msg);
      setTurns((t) => [...t, { role: 'assistant', text: `Hit a snag: ${msg}. Try again?` }]);
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !current.multiline) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  const progress = Math.round(((stepIdx + (submitting ? 1 : 0)) / QUESTIONS.length) * 100);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 h-screen flex flex-col">
      <div className="mb-4">
        <h1 className="font-display font-[800] text-[18px] text-[#FAFAFA] tracking-[0.16em]">
          DISPATCH
        </h1>
        <div className="mt-3 h-1 bg-[#27272A] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#6366F1] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 py-4"
      >
        {turns.map((t, i) => (
          <div
            key={i}
            className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-[12px] font-body text-[13px] leading-[1.5] whitespace-pre-wrap ${
                t.role === 'user'
                  ? 'bg-[#6366F1] text-white'
                  : 'bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 text-[#FAFAFA]'
              }`}
            >
              {t.text}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="font-body text-[12px] text-[#FCA5A5] px-1 mb-2">{error}</p>
      )}

      {!submitting && (
        <div className="border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] bg-[#18181B] p-2">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={current.multiline ? current.rows ?? 3 : 1}
            placeholder={current.placeholder}
            className="w-full bg-transparent resize-none px-2 py-1.5 font-body text-[13px] text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none"
          />
          <div className="flex items-center justify-between px-1 pt-1">
            <span className="text-[11px] text-[#52525B]">
              {current.multiline ? '⌘/Ctrl + Enter to send' : 'Enter to send'}
              {current.optional && ' · optional'}
            </span>
            <div className="flex gap-2">
              {current.optional && (
                <button
                  type="button"
                  onClick={() => handleSend(true)}
                  className="px-3 py-1.5 text-[12px] text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
                >
                  Skip
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!current.optional && !draft.trim()}
                className="px-4 py-1.5 text-[12px] font-medium text-white bg-[#6366F1] rounded-[7px] hover:opacity-90 transition disabled:opacity-40"
              >
                {isLast ? 'Finish' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
