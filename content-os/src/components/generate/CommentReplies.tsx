'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { SkeletonLines } from '@/components/ui/Skeleton';

const PLATFORM_TONES: Record<string, string> = {
  instagram: 'Raw, direct, like texting a friend. Short. Engage genuinely. Ask a follow-up question when natural. No em dashes. Never sound like a brand.',
  twitter: 'Punchy, witty, under 280 chars. Match the energy of the comment. Be real, not corporate.',
  linkedin: 'Professional but warm. Add value with your reply. Reference your experience when relevant. Keep it concise.',
  threads: 'Casual, conversational, like you are chatting with a friend. Short and natural.',
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

export function CommentReplies() {
  const [comments, setComments] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [replies, setReplies] = useState<{ comment: string; reply: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!comments.trim()) {
      setError('Paste some comments first');
      return;
    }
    setLoading(true);
    setError('');
    setReplies([]);

    const commentLines = comments.trim().split('\n').filter((l) => l.trim());
    const tone = PLATFORM_TONES[platform] || PLATFORM_TONES.instagram;

    const prompt = `Write replies to these ${platform} comments in the creator's voice.

TONE: ${tone}

COMMENTS:
${commentLines.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Return each reply in this exact format:
COMMENT 1: (original comment text)
REPLY 1: (your reply)

COMMENT 2: (original comment text)
REPLY 2: (your reply)

...and so on for all comments.`;

    try {
      const text = await callGenerate(prompt);
      const pairs: { comment: string; reply: string }[] = [];
      const blocks = text.split(/(?=COMMENT\s*\d+:)/i).filter((b) => b.trim());

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const replyMatch = block.match(/REPLY\s*\d+:\s*([\s\S]*?)$/i);
        const reply = replyMatch?.[1]?.trim() || block.trim();
        pairs.push({
          comment: commentLines[i] || `Comment ${i + 1}`,
          reply,
        });
      }

      // Fallback if parsing fails
      if (pairs.length === 0) {
        const fallbackReplies = text.split(/Reply\s*\d+[:\s]*/i).filter((b) => b.trim());
        for (let i = 0; i < fallbackReplies.length; i++) {
          pairs.push({
            comment: commentLines[i] || `Comment ${i + 1}`,
            reply: fallbackReplies[i].trim(),
          });
        }
      }

      setReplies(pairs);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Platform selector */}
      <div className="flex gap-2">
        {Object.keys(PLATFORM_TONES).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPlatform(p)}
            className={`px-3 py-1.5 rounded-[5px] text-[12px] font-medium capitalize transition-colors ${
              platform === p
                ? 'bg-[#27272A] text-[#FAFAFA]'
                : 'text-[#71717A] hover:text-[#A1A1AA]'
            }`}
          >
            {p === 'twitter' ? 'X' : p}
          </button>
        ))}
      </div>

      <div>
        <label className="block font-body text-[13px] text-[#A1A1AA] mb-2">
          Paste comments (one per line)
        </label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={6}
          placeholder={`Paste ${platform} comments here, one per line...`}
          className="w-full bg-[#18181B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[7px] px-4 py-3 font-body text-[13px] text-[#FAFAFA] placeholder:text-[#71717A] focus:outline-none focus:border-[rgba(255,255,255,0.40)] resize-none transition-colors duration-100"
        />
      </div>

      <Button onClick={generate} loading={loading} disabled={!comments.trim()}>
        Generate Replies
      </Button>

      {error && <p className="font-body text-[13px] text-red-400">{error}</p>}

      {loading && (
        <div className="bg-[#18181B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[12px] p-[13px_14px]">
          <SkeletonLines count={4} />
        </div>
      )}

      {replies.length > 0 && (
        <div className="space-y-3">
          {replies.map((pair, i) => (
            <div
              key={i}
              className="bg-[#18181B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[12px] p-4 space-y-2"
            >
              {/* Original comment */}
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-medium tracking-[0.08em] uppercase text-[#52525B] shrink-0 mt-0.5">
                  Comment
                </span>
                <p className="font-body text-[12px] text-[#71717A] leading-relaxed flex-1">
                  {pair.comment}
                </p>
              </div>
              {/* Generated reply */}
              <div className="flex items-start gap-2 pt-2 border-t-[0.5px] border-[rgba(255,255,255,0.06)]">
                <span className="text-[10px] font-medium tracking-[0.08em] uppercase text-[#818CF8] shrink-0 mt-0.5">
                  Reply
                </span>
                <p className="font-body text-[13px] text-[#FAFAFA] leading-[1.55] flex-1">
                  {pair.reply}
                </p>
                <CopyButton text={pair.reply} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
