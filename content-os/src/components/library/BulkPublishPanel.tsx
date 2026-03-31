'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  Check,
  AlertCircle,
  ExternalLink,
  Settings,
  RefreshCw,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string | null;
  account_id: string | null;
  connected_at: string;
  connection_method?: string;
}

type PublishStatus = 'pending' | 'publishing' | 'published' | 'failed';

interface PlatformState {
  status: PublishStatus;
  selected: boolean;
  url?: string;
  error?: string;
}

interface BulkPublishPanelProps {
  postId?: string;
  content: string;
  caption?: string;
  imageUrl?: string;
  onPublishSuccess?: () => void;
}

const PLATFORM_CONFIG: Record<
  string,
  { label: string; color: string; charLimit: number; icon: string }
> = {
  twitter: { label: 'X', color: '#E7E5E4', charLimit: 280, icon: '\ud835\udd4f' },
  linkedin: { label: 'LinkedIn', color: '#0A66C2', charLimit: 3000, icon: 'in' },
  instagram: { label: 'Instagram', color: '#E4405F', charLimit: 2200, icon: 'IG' },
  threads: { label: 'Threads', color: '#E7E5E4', charLimit: 500, icon: '@' },
};

export default function BulkPublishPanel({
  postId,
  content,
  caption,
  imageUrl,
  onPublishSuccess,
}: BulkPublishPanelProps) {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformStates, setPlatformStates] = useState<Record<string, PlatformState>>({});
  const [bulkPublishing, setBulkPublishing] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/social-accounts');
      if (res.ok) {
        const data = await res.json();
        const accs: SocialAccount[] = data.accounts ?? [];
        setAccounts(accs);
        // Initialize platform states
        const states: Record<string, PlatformState> = {};
        accs.forEach((acc) => {
          states[acc.platform] = {
            status: 'pending',
            selected: true,
          };
        });
        setPlatformStates(states);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const publishText = caption || content;

  function togglePlatform(platform: string) {
    setPlatformStates((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        selected: !prev[platform]?.selected,
      },
    }));
  }

  async function publishToPlatform(platform: string): Promise<void> {
    setPlatformStates((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], status: 'publishing', error: undefined },
    }));

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          platform,
          content,
          caption,
          imageUrl,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPlatformStates((prev) => ({
          ...prev,
          [platform]: {
            ...prev[platform],
            status: 'published',
            url: data.url,
          },
        }));
      } else {
        setPlatformStates((prev) => ({
          ...prev,
          [platform]: {
            ...prev[platform],
            status: 'failed',
            error: data.error ?? 'Publishing failed',
          },
        }));
      }
    } catch {
      setPlatformStates((prev) => ({
        ...prev,
        [platform]: {
          ...prev[platform],
          status: 'failed',
          error: 'Network error. Try again.',
        },
      }));
    }
  }

  async function handleBulkPublish() {
    const selected = Object.entries(platformStates)
      .filter(([, state]) => state.selected && state.status !== 'published')
      .map(([platform]) => platform);

    if (selected.length === 0) {
      toast('Select at least one platform', 'error');
      return;
    }

    setBulkPublishing(true);

    // Publish to all selected platforms concurrently
    await Promise.allSettled(selected.map((p) => publishToPlatform(p)));

    setBulkPublishing(false);

    // Check results
    const results = Object.entries(platformStates);
    const anySuccess = results.some(
      ([, state]) => state.status === 'published'
    );
    if (anySuccess) {
      onPublishSuccess?.();
    }
  }

  async function handleRetry(platform: string) {
    await publishToPlatform(platform);
    // Check if this retry succeeded
    const state = platformStates[platform];
    if (state?.status === 'published') {
      onPublishSuccess?.();
    }
  }

  const selectedCount = Object.values(platformStates).filter(
    (s) => s.selected && s.status !== 'published'
  ).length;

  const publishedCount = Object.values(platformStates).filter(
    (s) => s.status === 'published'
  ).length;

  const failedCount = Object.values(platformStates).filter(
    (s) => s.status === 'failed'
  ).length;

  const allDone =
    accounts.length > 0 &&
    Object.values(platformStates).every(
      (s) => s.status === 'published' || s.status === 'failed' || !s.selected
    ) &&
    (publishedCount > 0 || failedCount > 0);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3">
        <Loader2 size={14} className="animate-spin text-[#71717A]" />
        <span className="text-[11px] text-[#71717A]">Loading accounts...</span>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="py-3">
        <p className="text-[11px] text-[#71717A] mb-2">No accounts connected.</p>
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
    <div className="space-y-3">
      {/* Platform toggle cards */}
      <div className="space-y-2">
        {accounts.map((account) => {
          const config = PLATFORM_CONFIG[account.platform];
          if (!config) return null;
          const state = platformStates[account.platform];
          if (!state) return null;

          const charCount = publishText.length;
          const overLimit = charCount > config.charLimit;

          return (
            <div key={account.id} className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  if (state.status === 'pending') togglePlatform(account.platform);
                }}
                disabled={state.status !== 'pending'}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] border-[0.5px] transition-all duration-100 ${
                  state.selected
                    ? 'border-[#6366F1]/40 bg-[rgba(99,102,241,0.06)]'
                    : 'border-[#FAFAFA]/12 bg-[#18181B]'
                } ${state.status === 'pending' ? 'cursor-pointer hover:border-[#FAFAFA]/25' : 'cursor-default'}`}
              >
                {/* Platform icon */}
                <span
                  className="w-6 h-6 rounded-[5px] flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: config.color }}
                >
                  {config.icon}
                </span>

                {/* Platform info */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-[#FAFAFA]">
                      {config.label}
                    </span>
                    {account.account_name && (
                      <span className="text-[10px] text-[#71717A]">
                        {account.account_name}
                      </span>
                    )}
                  </div>
                  {/* Character count */}
                  <span
                    className={`text-[10px] ${
                      overLimit ? 'text-[#F87171]' : 'text-[#71717A]'
                    }`}
                  >
                    {charCount}/{config.charLimit} chars
                    {overLimit && ' (over limit)'}
                  </span>
                </div>

                {/* Status indicator */}
                <div className="shrink-0">
                  {state.status === 'pending' && (
                    <div
                      className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-colors ${
                        state.selected
                          ? 'border-[#6366F1] bg-[#6366F1]'
                          : 'border-[#71717A]'
                      }`}
                    >
                      {state.selected && <Check size={10} className="text-white" />}
                    </div>
                  )}
                  {state.status === 'publishing' && (
                    <Loader2 size={16} className="animate-spin text-[#6366F1]" />
                  )}
                  {state.status === 'published' && (
                    <div className="w-5 h-5 rounded-full bg-[rgba(52,211,153,0.15)] flex items-center justify-center">
                      <Check size={12} className="text-[#4ADE80]" />
                    </div>
                  )}
                  {state.status === 'failed' && (
                    <div className="w-5 h-5 rounded-full bg-[rgba(248,113,113,0.15)] flex items-center justify-center">
                      <AlertCircle size={12} className="text-[#F87171]" />
                    </div>
                  )}
                </div>
              </button>

              {/* Published link */}
              {state.status === 'published' && state.url && (
                <a
                  href={state.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-1 text-[10px] text-[#4ADE80] hover:underline"
                >
                  <ExternalLink size={10} /> View on {config.label}
                </a>
              )}

              {/* Failed message + retry */}
              {state.status === 'failed' && (
                <div className="flex items-center gap-2 px-1">
                  <p className="text-[10px] text-[#F87171] flex-1">{state.error}</p>
                  <button
                    type="button"
                    onClick={() => handleRetry(account.platform)}
                    className="flex items-center gap-1 text-[10px] text-[#6366F1] hover:opacity-80 transition-opacity shrink-0"
                  >
                    <RefreshCw size={10} /> Retry
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Publish button */}
      {!allDone && (
        <Button
          variant="primary"
          size="sm"
          onClick={handleBulkPublish}
          disabled={selectedCount === 0 || bulkPublishing}
          className="w-full gap-2"
        >
          {bulkPublishing ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <Send size={14} />
              Publish to {selectedCount} Platform{selectedCount !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      )}

      {/* Completion summary */}
      {allDone && (
        <div className="bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[8px] p-3 space-y-1.5">
          <p className="text-[12px] font-medium text-[#FAFAFA]">
            Publishing Complete
          </p>
          <div className="flex items-center gap-3">
            {publishedCount > 0 && (
              <span className="text-[11px] text-[#4ADE80]">
                {publishedCount} published
              </span>
            )}
            {failedCount > 0 && (
              <span className="text-[11px] text-[#F87171]">
                {failedCount} failed
              </span>
            )}
          </div>
          {failedCount > 0 && (
            <p className="text-[10px] text-[#71717A]">
              You can retry failed platforms above.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
