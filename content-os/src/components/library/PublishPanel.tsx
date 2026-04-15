'use client';

import { useState } from 'react';
import { ExternalLink, AlertCircle, Check, Copy } from 'lucide-react';

interface PublishPanelProps {
  postId: string;
  content: string;
  caption: string;
  imageUrl?: string | null;
  onPublishSuccess?: () => void;
}

type Platform = 'twitter' | 'linkedin' | 'instagram' | 'threads';

const PLATFORM_CONFIG: Record<Platform, { label: string; color: string; charLimit: number; icon: string; needsImage?: boolean; supportsTextIntent: boolean }> = {
  twitter: { label: 'X', color: '#000000', charLimit: 280, icon: '𝕏', supportsTextIntent: true },
  linkedin: { label: 'LinkedIn', color: '#0A66C2', charLimit: 3000, icon: 'in', supportsTextIntent: true },
  threads: { label: 'Threads', color: '#000000', charLimit: 500, icon: '@', supportsTextIntent: true },
  instagram: { label: 'Instagram', color: '#E4405F', charLimit: 2200, icon: 'IG', needsImage: true, supportsTextIntent: false },
};

const PLATFORM_ORDER: Platform[] = ['twitter', 'linkedin', 'threads', 'instagram'];

function buildIntentUrl(platform: Platform, text: string): string | null {
  const enc = encodeURIComponent(text);
  switch (platform) {
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${enc}`;
    case 'threads':
      return `https://www.threads.net/intent/post?text=${enc}`;
    case 'linkedin':
      // LinkedIn has no first-class text intent. Open the share composer.
      return `https://www.linkedin.com/feed/?shareActive=true&text=${enc}`;
    case 'instagram':
      // No text intent. Open the web app; user pastes caption.
      return 'https://www.instagram.com/';
    default:
      return null;
  }
}

export default function PublishPanel({ postId, content, caption, imageUrl, onPublishSuccess }: PublishPanelProps) {
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const [marking, setMarking] = useState<Record<string, boolean>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});

  const publishText = caption || content;

  async function copyToClipboard(text: string, platform: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus((s) => ({ ...s, [platform]: true }));
      setTimeout(() => setCopyStatus((s) => ({ ...s, [platform]: false })), 1500);
    } catch {
      // Clipboard API blocked; ignore — user can still post via the open tab.
    }
  }

  function handleOpen(platform: Platform): void {
    const url = buildIntentUrl(platform, publishText);
    if (!url) return;
    // Always copy first so even platforms without a text intent (IG) get the caption ready.
    copyToClipboard(publishText, platform);
    window.open(url, '_blank', 'noopener,noreferrer');
    setOpened((s) => ({ ...s, [platform]: true }));
  }

  async function handleMarkPosted(platform: Platform): Promise<void> {
    setMarking((s) => ({ ...s, [platform]: true }));
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'posted',
          posted_date: new Date().toISOString().split('T')[0],
          platform,
        }),
      });
      if (res.ok) {
        setMarked((s) => ({ ...s, [platform]: true }));
        onPublishSuccess?.();
      }
    } catch {
      // No-op; user can retry.
    } finally {
      setMarking((s) => ({ ...s, [platform]: false }));
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-[#71717A] uppercase tracking-wider px-1">Publish</p>

      {PLATFORM_ORDER.map((platform) => {
        const config = PLATFORM_CONFIG[platform];
        const charCount = publishText.length;
        const overLimit = charCount > config.charLimit;
        const wasOpened = opened[platform];
        const wasMarked = marked[platform];
        const isMarking = marking[platform];
        const justCopied = copyStatus[platform];

        return (
          <div key={platform} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpen(platform)}
                disabled={wasMarked}
                className="flex-1 flex items-center gap-2 px-3 py-2 text-[11px] bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] hover:border-[#FAFAFA]/25 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span
                  className="w-5 h-5 rounded-[4px] flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                  style={{ backgroundColor: config.color }}
                >
                  {config.icon}
                </span>
                {wasMarked ? (
                  <>
                    <Check size={12} className="text-[#3B6D11]" />
                    <span className="text-[#3B6D11]">Posted to {config.label}</span>
                  </>
                ) : justCopied ? (
                  <>
                    <Copy size={12} className="text-[#6366F1]" />
                    <span className="text-[#6366F1]">Copied — opening {config.label}…</span>
                  </>
                ) : (
                  <>
                    <ExternalLink size={12} className="text-[#71717A]" />
                    <span className="text-[#FAFAFA]">
                      {config.supportsTextIntent ? `Open ${config.label}` : `Copy & open ${config.label}`}
                    </span>
                  </>
                )}
              </button>

              {wasOpened && !wasMarked && (
                <button
                  type="button"
                  onClick={() => handleMarkPosted(platform)}
                  disabled={isMarking}
                  className="px-2 py-2 text-[10px] bg-[#3B6D11]/10 border-[0.5px] border-[#3B6D11]/40 text-[#86EFAC] rounded-[7px] hover:bg-[#3B6D11]/20 transition-colors disabled:opacity-60"
                >
                  {isMarking ? '...' : 'Mark posted'}
                </button>
              )}
            </div>

            {/* Char count + warnings */}
            <div className="flex items-center gap-2 px-1">
              {overLimit ? (
                <span className="flex items-center gap-1 text-[10px] text-[#F59E0B]">
                  <AlertCircle size={10} />
                  {charCount}/{config.charLimit} (over limit)
                </span>
              ) : (
                <span className="text-[10px] text-[#71717A]">
                  {charCount}/{config.charLimit}
                </span>
              )}
              {config.needsImage && imageUrl && (
                <span className="text-[10px] text-[#71717A]">· image attached</span>
              )}
              {config.needsImage && !imageUrl && (
                <span className="text-[10px] text-[#F59E0B]">· needs an image</span>
              )}
            </div>
          </div>
        );
      })}

      <p className="text-[10px] text-[#71717A] px-1 pt-1 leading-[1.5]">
        Caption is copied to your clipboard. Paste it into the platform tab that just opened, then click <span className="text-[#A1A1AA]">Mark posted</span> to update your library.
      </p>
    </div>
  );
}
