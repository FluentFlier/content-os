'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Send, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { CopyButton } from '@/components/ui/CopyButton';
import type { Platform } from '@/lib/constants';

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string | null;
  connected_at: string;
  connection_method?: string;
}

interface Variant {
  platform: Platform;
  content: string;
  characterCount: number;
  isThread: boolean;
  threadParts: string[] | null;
}

interface OptimizePanelProps {
  content: string;
  sourcePlatform?: Platform;
}

const PLATFORM_CONFIG: Record<string, { label: string; charLimit: number; icon: string; color: string }> = {
  twitter: { label: 'X (Twitter)', charLimit: 280, icon: '\ud835\udd4f', color: '#E7E5E4' },
  linkedin: { label: 'LinkedIn', charLimit: 3000, icon: 'in', color: '#0A66C2' },
  instagram: { label: 'Instagram', charLimit: 2200, icon: 'IG', color: '#E4405F' },
  threads: { label: 'Threads', charLimit: 500, icon: '@', color: '#E7E5E4' },
};

export function OptimizePanel({ content, sourcePlatform = 'instagram' }: OptimizePanelProps) {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [savingPlatform, setSavingPlatform] = useState<string | null>(null);
  const [publishingPlatform, setPublishingPlatform] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/social-accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts ?? []);
      }
    } catch {
      // Silent fail - will show no platform buttons
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const connectedPlatforms = accounts.map((a) => a.platform as Platform);

  async function handleOptimize(targetPlatforms: Platform[]) {
    if (targetPlatforms.length === 0) return;
    setOptimizing(true);
    setVariants([]);
    setActiveTab('');

    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          sourcePlatform,
          targetPlatforms,
          optimizationLevel: 'full',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Optimization failed' }));
        toast(err.error || 'Optimization failed', 'error');
        return;
      }

      const data = await res.json();
      const newVariants: Variant[] = data.variants ?? [];
      setVariants(newVariants);
      if (newVariants.length > 0) {
        setActiveTab(newVariants[0].platform);
      }
    } catch {
      toast('Network error during optimization', 'error');
    } finally {
      setOptimizing(false);
    }
  }

  function handleOptimizeAll() {
    const allPlatforms: Platform[] = connectedPlatforms.length > 0
      ? connectedPlatforms
      : ['twitter', 'linkedin', 'instagram', 'threads'];
    handleOptimize(allPlatforms);
  }

  function handleOptimizeSingle(platform: Platform) {
    handleOptimize([platform]);
  }

  async function handleSaveAsPost(variant: Variant) {
    setSavingPlatform(variant.platform);
    const variantGroupId = crypto.randomUUID();

    try {
      const variantContent = variant.isThread && variant.threadParts
        ? variant.threadParts.join('\n\n')
        : variant.content;

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${PLATFORM_CONFIG[variant.platform]?.label ?? variant.platform} variant`,
          pillar: 'hot-take',
          platform: variant.platform,
          status: 'scripted',
          script: variantContent,
          variant_group_id: variantGroupId,
          source_platform: sourcePlatform,
        }),
      });

      if (res.ok) {
        toast('Saved as post to Library');
      } else {
        const err = await res.json().catch(() => ({ error: 'Save failed' }));
        toast(err.error || 'Failed to save post', 'error');
      }
    } catch {
      toast('Network error saving post', 'error');
    } finally {
      setSavingPlatform(null);
    }
  }

  async function handlePublish(variant: Variant) {
    setPublishingPlatform(variant.platform);

    try {
      const variantContent = variant.isThread && variant.threadParts
        ? variant.threadParts.join('\n\n')
        : variant.content;

      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: variant.platform,
          content: variantContent,
          caption: variantContent,
        }),
      });

      if (res.ok) {
        toast(`Published to ${PLATFORM_CONFIG[variant.platform]?.label ?? variant.platform}`);
      } else {
        const err = await res.json().catch(() => ({ error: 'Publish failed' }));
        toast(err.error || 'Publish failed', 'error');
      }
    } catch {
      toast('Network error during publish', 'error');
    } finally {
      setPublishingPlatform(null);
    }
  }

  const activeVariant = variants.find((v) => v.platform === activeTab);

  return (
    <div className="space-y-3">
      {/* Optimize buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={handleOptimizeAll}
          disabled={optimizing}
          className="gap-1.5"
        >
          {optimizing ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          Optimize for All Platforms
        </Button>

        {!accountsLoading && connectedPlatforms.map((platform) => {
          const config = PLATFORM_CONFIG[platform];
          if (!config) return null;
          return (
            <Button
              key={platform}
              variant="secondary"
              size="sm"
              onClick={() => handleOptimizeSingle(platform)}
              disabled={optimizing}
              className="gap-1.5"
            >
              <span
                className="w-4 h-4 rounded-[3px] flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                style={{ backgroundColor: config.color }}
              >
                {config.icon}
              </span>
              {config.label}
            </Button>
          );
        })}
      </div>

      {/* Loading state */}
      {optimizing && (
        <div className="bg-[#18181B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[12px] p-6 flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-[#6366F1]" />
          <p className="font-body text-[13px] text-[#A1A1AA]">
            Optimizing content for your platforms...
          </p>
        </div>
      )}

      {/* Tabbed variant view */}
      {variants.length > 0 && !optimizing && (
        <div className="bg-[#18181B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[12px] overflow-hidden">
          {/* Tabs header */}
          <div className="px-3 pt-3">
            <Tabs
              tabs={variants.map((v) => ({
                id: v.platform,
                label: PLATFORM_CONFIG[v.platform]?.label ?? v.platform,
              }))}
              activeTab={activeTab}
              onChange={setActiveTab}
              variant="pill"
            />
          </div>

          {/* Active variant content */}
          {activeVariant && (
            <VariantCard
              variant={activeVariant}
              saving={savingPlatform === activeVariant.platform}
              publishing={publishingPlatform === activeVariant.platform}
              onSave={() => handleSaveAsPost(activeVariant)}
              onPublish={() => handlePublish(activeVariant)}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* Variant card showing content, char count, and action buttons */
function VariantCard({
  variant,
  saving,
  publishing,
  onSave,
  onPublish,
}: {
  variant: Variant;
  saving: boolean;
  publishing: boolean;
  onSave: () => void;
  onPublish: () => void;
}) {
  const config = PLATFORM_CONFIG[variant.platform];
  const charLimit = config?.charLimit ?? 280;
  const isOverLimit = variant.characterCount > charLimit;

  const displayContent = variant.isThread && variant.threadParts
    ? variant.threadParts.join('\n\n')
    : variant.content;

  return (
    <div className="p-4 space-y-3">
      {/* Platform name + character count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-5 h-5 rounded-[4px] flex items-center justify-center text-[9px] font-bold text-white shrink-0"
            style={{ backgroundColor: config?.color ?? '#71717A' }}
          >
            {config?.icon ?? '?'}
          </span>
          <span className="font-body text-[13px] font-medium text-[#FAFAFA]">
            {config?.label ?? variant.platform}
          </span>
        </div>
        <span
          className={`font-body text-[12px] font-medium ${
            isOverLimit ? 'text-[#F87171]' : 'text-[#4ADE80]'
          }`}
        >
          {variant.characterCount}/{charLimit} chars
        </span>
      </div>

      {/* Thread indicator */}
      {variant.isThread && variant.threadParts && (
        <p className="font-body text-[11px] text-[#A1A1AA]">
          Thread: {variant.threadParts.length} parts
        </p>
      )}

      {/* Content */}
      {variant.isThread && variant.threadParts ? (
        <div className="space-y-2">
          {variant.threadParts.map((part, i) => (
            <div key={i} className="bg-[#09090B] rounded-[8px] p-3">
              <p className="font-body text-[11px] text-[#71717A] mb-1">
                Part {i + 1}
              </p>
              <pre className="whitespace-pre-wrap font-body text-[13px] text-[#FAFAFA] leading-[1.55]">
                {part}
              </pre>
              <p
                className={`font-body text-[10px] mt-1 ${
                  part.length > 280 ? 'text-[#F87171]' : 'text-[#71717A]'
                }`}
              >
                {part.length}/280
              </p>
            </div>
          ))}
        </div>
      ) : (
        <pre className="whitespace-pre-wrap font-body text-[13px] text-[#FAFAFA] leading-[1.55] bg-[#09090B] rounded-[8px] p-3">
          {displayContent}
        </pre>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 pt-1">
        <CopyButton text={displayContent} />
        <Button
          variant="secondary"
          size="sm"
          onClick={onSave}
          loading={saving}
          className="gap-1.5"
        >
          <Save size={13} />
          Save as Post
        </Button>
        {variant.platform === 'instagram' ? (
          <Button
            variant="primary"
            size="sm"
            disabled
            title="Instagram requires an image. Save as Post and publish from the Library."
            className="gap-1.5"
          >
            <Send size={13} />
            Save as Post to publish
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={onPublish}
            loading={publishing}
            className="gap-1.5"
          >
            <Send size={13} />
            Publish Now
          </Button>
        )}
      </div>
    </div>
  );
}
