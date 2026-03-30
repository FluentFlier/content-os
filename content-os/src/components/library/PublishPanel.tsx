'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, AlertCircle, Check, Loader2, Settings } from 'lucide-react';
import Link from 'next/link';

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string | null;
  account_id: string | null;
  connected_at: string;
}

interface PublishResult {
  platform: string;
  success: boolean;
  url?: string;
  error?: string;
}

interface PublishPanelProps {
  postId: string;
  content: string;
  caption: string;
  onPublishSuccess?: () => void;
}

const PLATFORM_CONFIG: Record<string, { label: string; color: string; charLimit: number; icon: string }> = {
  twitter: { label: 'X', color: '#0F172A', charLimit: 280, icon: '𝕏' },
  linkedin: { label: 'LinkedIn', color: '#0A66C2', charLimit: 3000, icon: 'in' },
  instagram: { label: 'Instagram', color: '#E4405F', charLimit: 2200, icon: 'IG' },
  threads: { label: 'Threads', color: '#0F172A', charLimit: 500, icon: '@' },
};

export default function PublishPanel({ postId, content, caption, onPublishSuccess }: PublishPanelProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, PublishResult>>({});

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      const res = await fetch('/api/social-accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish(platform: string) {
    setPublishing((prev) => ({ ...prev, [platform]: true }));
    setResults((prev) => {
      const next = { ...prev };
      delete next[platform];
      return next;
    });

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          platform,
          content,
          caption,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResults((prev) => ({
          ...prev,
          [platform]: { platform, success: true, url: data.url },
        }));
        onPublishSuccess?.();
      } else {
        setResults((prev) => ({
          ...prev,
          [platform]: { platform, success: false, error: data.error ?? 'Publishing failed' },
        }));
      }
    } catch {
      setResults((prev) => ({
        ...prev,
        [platform]: { platform, success: false, error: 'Network error. Try again.' },
      }));
    } finally {
      setPublishing((prev) => ({ ...prev, [platform]: false }));
    }
  }

  const publishText = caption || content;

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Loader2 size={14} className="animate-spin text-[#94A3B8]" />
        <span className="text-[11px] text-[#94A3B8]">Loading accounts...</span>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="py-2">
        <p className="text-[11px] text-[#94A3B8] mb-2">No accounts connected.</p>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-[11px] text-[#6366F1] hover:opacity-80 transition-opacity"
        >
          <Settings size={12} /> Connect accounts in Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {accounts.map((account) => {
        const config = PLATFORM_CONFIG[account.platform];
        if (!config) return null;

        const charCount = publishText.length;
        const overLimit = charCount > config.charLimit;
        const result = results[account.platform];
        const isPublishing = publishing[account.platform];

        return (
          <div key={account.id} className="space-y-1.5">
            <div className="flex items-center gap-2">
              {/* Platform button */}
              <button
                type="button"
                disabled={isPublishing || result?.success}
                onClick={() => handlePublish(account.platform)}
                className="flex-1 flex items-center gap-2 px-3 py-2 text-[11px] bg-[#F8FAFC] border-[0.5px] border-[#0F172A]/12 rounded-[7px] hover:border-[#0F172A]/25 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span
                  className="w-5 h-5 rounded-[4px] flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                  style={{ backgroundColor: config.color }}
                >
                  {config.icon}
                </span>

                {isPublishing ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span className="text-[#475569]">Posting...</span>
                  </>
                ) : result?.success ? (
                  <>
                    <Check size={12} className="text-[#3B6D11]" />
                    <span className="text-[#3B6D11]">Posted to {config.label}</span>
                  </>
                ) : (
                  <span className="text-[#0F172A]">Post to {config.label}</span>
                )}

                {account.account_name && (
                  <span className="ml-auto text-[10px] text-[#94A3B8]">{account.account_name}</span>
                )}
              </button>
            </div>

            {/* Character count */}
            <div className="flex items-center gap-1 px-1">
              {overLimit ? (
                <>
                  <AlertCircle size={10} className="text-[#6366F1]" />
                  <span className="text-[10px] text-[#6366F1]">
                    {charCount}/{config.charLimit} characters (over limit)
                  </span>
                </>
              ) : (
                <span className="text-[10px] text-[#94A3B8]">
                  {charCount}/{config.charLimit} characters
                </span>
              )}
            </div>

            {/* Success link */}
            {result?.success && result.url && (
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-1 text-[10px] text-[#6366F1] hover:underline"
              >
                <ExternalLink size={10} /> View post
              </a>
            )}

            {/* Error message */}
            {result && !result.success && (
              <p className="px-1 text-[10px] text-[#6366F1]">{result.error}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
