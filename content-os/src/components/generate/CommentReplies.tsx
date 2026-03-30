'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { SkeletonLines } from '@/components/ui/Skeleton';

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
  const [replies, setReplies] = useState<string[]>([]);
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
    const prompt = `Write replies to these Instagram comments in the creator's voice. Raw, direct, like texting a friend. Short. Engage genuinely. Ask a follow-up question when natural. No em dashes. Never sound like a brand.
COMMENTS: ${comments.trim()}
Return each reply labeled Comment 1 Reply, Comment 2 Reply, etc.`;
    try {
      const text = await callGenerate(prompt);
      const replyBlocks = text
        .split(/Comment\s*\d+\s*Reply[:\s]*/i)
        .filter((b: string) => b.trim());
      setReplies(replyBlocks.map((b: string) => b.trim()));
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
          Paste 5-10 comments
        </label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={8}
          placeholder="Paste comments from your post, one per line..."
          className="w-full bg-[#F8FAFC] border-[0.5px] border-[rgba(26,23,20,0.12)] rounded-[7px] px-4 py-3 font-['Space_Grotesk'] text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[rgba(26,23,20,0.40)] resize-none transition-colors duration-100"
        />
      </div>

      <Button
        onClick={generate}
        loading={loading}
        disabled={!comments.trim()}
      >
        Generate Replies
      </Button>

      {error && <p className="font-['Space_Grotesk'] text-[13px] text-[#6366F1]">{error}</p>}

      {loading && (
        <div className="bg-[#F8FAFC] border-[0.5px] border-[rgba(26,23,20,0.12)] rounded-[12px] p-[13px_14px]">
          <SkeletonLines count={3} />
        </div>
      )}

      {replies.length > 0 && (
        <div className="bg-[#F8FAFC] border-[0.5px] border-[rgba(26,23,20,0.12)] rounded-[12px] p-[13px_14px] space-y-2">
          {replies.map((reply, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-3 py-2 border-b-[0.5px] border-[rgba(26,23,20,0.12)] last:border-0"
            >
              <p className="font-['Space_Grotesk'] text-[13px] text-[#0F172A] flex-1 leading-[1.55]">
                <span className="text-[#94A3B8] font-medium mr-2">
                  Reply {i + 1}:
                </span>
                {reply}
              </p>
              <CopyButton text={reply} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
