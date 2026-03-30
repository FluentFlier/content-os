'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import TeleprompterReader from '@/components/teleprompter/TeleprompterReader';

function TeleprompterContent() {
  const searchParams = useSearchParams();
  const postId = searchParams.get('postId');

  const [script, setScript] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(!!postId);

  // Load script from post if postId is provided
  useEffect(() => {
    if (!postId) return;

    async function loadPost() {
      try {
        const res = await fetch(`/api/posts/${postId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.post?.script) {
            setScript(data.post.script);
            setIsActive(true);
          }
        }
      } catch {
        // Fall back to manual mode on failure
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [postId]);

  // Register service worker for offline capability
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <p className="font-body text-[13px] text-white/60">Loading script...</p>
      </div>
    );
  }

  // Reader mode - dark exception for recording
  if (isActive) {
    return (
      <TeleprompterReader
        script={script}
        onExit={() => {
          setIsActive(false);
        }}
      />
    );
  }

  // Manual entry mode - dark exception for recording context
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black px-4">
      <h1 className="font-display text-[22px] font-[800] text-white leading-[1.2] tracking-[-0.02em]">Teleprompter</h1>
      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        placeholder="Paste your script here..."
        className="font-display h-64 w-full max-w-xl resize-none rounded-[12px] border-[0.5px] border-white/20 p-4 text-[16px] text-white placeholder-white/40 outline-none focus:border-[#6366F1]"
        style={{ backgroundColor: '#111', lineHeight: 1.7 }}
      />
      <button
        onClick={() => {
          if (script.trim()) setIsActive(true);
        }}
        disabled={!script.trim()}
        className="font-display rounded-[7px] bg-[#6366F1] px-8 py-3 text-[16px] font-[700] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        Start
      </button>
    </div>
  );
}

export default function TeleprompterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-black">
          <p className="font-body text-[13px] text-white/60">Loading...</p>
        </div>
      }
    >
      <TeleprompterContent />
    </Suspense>
  );
}
