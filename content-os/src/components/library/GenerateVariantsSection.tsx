'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Loader2,
  Save,
  Send,
  Replace,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { CopyButton } from '@/components/ui/CopyButton';
import { useToast } from '@/components/ui/Toast';
import type { Platform } from '@/lib/constants';

interface Variant {
  platform: Platform;
  content: string;
  characterCount: number;
  isThread: boolean;
  threadParts: string[] | null;
}

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string | null;
}

interface GenerateVariantsSectionProps {
  content: string;
  sourcePlatform: Platform;
  postId?: string;
  imageUrl?: string;
  onReplaceCaption: (newCaption: string) => void;
}

const PLATFORM_CONFIG: Record<
  string,
  { label: string; charLimit: number; icon: string; color: string }
> = {
  twitter: { label: 'X (Twitter)', charLimit: 280, icon: '\ud835\udd4f', color: '#E7E5E4' },
  linkedin: { label: 'LinkedIn', charLimit: 3000, icon: 'in', color: '#0A66C2' },
  instagram: { label: 'Instagram', charLimit: 2200, icon: 'IG', color: '#E4405F' },
  threads: { label: 'Threads', charLimit: 500, icon: '@', color: '#E7E5E4' },
};

export default function GenerateVariantsSection({
  content,
  sourcePlatform,
  postId,
  imageUrl,
  onReplaceCaption,
}: GenerateVariantsSectionProps) {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [savingPlatform, setSavingPlatform] = useState<string | null>(null);
  const [publishingPlatform, setPublishingPlatform] = useState<string | null>(null);
  const [replacedPlatform, setReplacedPlatform] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/social-accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts ?? []);
      }
    } catch {
      // silent
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const connectedPlatforms = accounts.map((a) => a.platform as Platform);

  async function handleGenerateVariants() {
    if (!content.trim()) {
      toast('No content to optimize. Add a script or caption first.', 'error');
      return;
    }

    const targetPlatforms: Platform[] =
      connectedPlatforms.length > 0
        ? connectedPlatforms
        : ['twitter', 'linkedin', 'instagram', 'threads'];

    setOptimizing(true);
    setVariants([]);
    setActiveTab('');
    setReplacedPlatform(null);

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

  function getVariantText(variant: Variant): string {
    return variant.isThread && variant.threadParts
      ? variant.threadParts.join('\n\n')
      : variant.content;
  }

  async function handleSaveAsPost(variant: Variant) {
    setSavingPlatform(variant.platform);
    const variantGroupId = crypto.randomUUID();

    try {
      const variantContent = getVariantText(variant);
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${PLATFORM_CONFIG[variant.platform]?.label ?? variant.platform} variant`,
          pillar: 'hot-take',
          platform: variant.platform,
          status: 'scripted',
          script: variantContent,
          caption: variantContent,
          variant_group_id: variantGroupId,
          source_platform: sourcePlatform,
        }),
      });

      if (res.ok) {
        toast('Saved as separate post to Library');
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

  function handleReplaceCaption(variant: Variant) {
    const text = getVariantText(variant);
    onReplaceCaption(text);
    setReplacedPlatform(variant.platform);
    toast('Caption replaced with variant');
  }

  async function handlePublish(variant: Variant) {
    setPublishingPlatform(variant.platform);

    try {
      const variantContent = getVariantText(variant);
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          platform: variant.platform,
          content: variantContent,
          caption: variantContent,
          imageUrl,
        }),
      });

      if (res.ok) {
        toast(
          `Published to ${PLATFORM_CONFIG[variant.platform]?.label ?? variant.platform}`
        );
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
      {/* Section header */}
      <div className="pt-3">
        <span className="text-[10px] font-medium tracking-[0.10em] uppercase text-[#71717A]">
          GENERATE VARIANTS
        </span>
      </div>

      {/* Generate button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={handleGenerateVariants}
        disabled={optimizing || !content.trim()}
        className="w-full gap-2"
      >
        {optimizing ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Generating variants...
          </>
        ) : (
          <>
            <Sparkles size={14} />
            Generate Variants
          </>
        )}
      </Button>

      {/* Loading state */}
      {optimizing && (
        <div className="bg-[#18181B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[8px] p-4 flex items-center gap-3">
          <Loader2 size={16} className="animate-spin text-[#6366F1]" />
          <span className="text-[12px] text-[#A1A1AA]">
            Optimizing for{' '}
            {accountsLoading
              ? 'all platforms'
              : connectedPlatforms.length > 0
              ? `${connectedPlatforms.length} connected platforms`
              : 'all platforms'}
            ...
          </span>
        </div>
      )}

      {/* Variant tabs + cards */}
      {variants.length > 0 && !optimizing && (
        <div className="bg-[#18181B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[8px] overflow-hidden">
          {/* Tabs */}
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

          {/* Active variant card */}
          {activeVariant && (
            <VariantCard
              variant={activeVariant}
              saving={savingPlatform === activeVariant.platform}
              publishing={publishingPlatform === activeVariant.platform}
              replaced={replacedPlatform === activeVariant.platform}
              onSave={() => handleSaveAsPost(activeVariant)}
              onReplace={() => handleReplaceCaption(activeVariant)}
              onPublish={() => handlePublish(activeVariant)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function VariantCard({
  variant,
  saving,
  publishing,
  replaced,
  onSave,
  onReplace,
  onPublish,
}: {
  variant: Variant;
  saving: boolean;
  publishing: boolean;
  replaced: boolean;
  onSave: () => void;
  onReplace: () => void;
  onPublish: () => void;
}) {
  const config = PLATFORM_CONFIG[variant.platform];
  const charLimit = config?.charLimit ?? 280;
  const isOverLimit = variant.characterCount > charLimit;

  const displayContent =
    variant.isThread && variant.threadParts
      ? variant.threadParts.join('\n\n')
      : variant.content;

  return (
    <div className="p-3 space-y-2.5">
      {/* Header: platform + char count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-5 h-5 rounded-[4px] flex items-center justify-center text-[9px] font-bold text-white shrink-0"
            style={{ backgroundColor: config?.color ?? '#71717A' }}
          >
            {config?.icon ?? '?'}
          </span>
          <span className="text-[12px] font-medium text-[#FAFAFA]">
            {config?.label ?? variant.platform}
          </span>
        </div>
        <span
          className={`text-[11px] font-medium ${
            isOverLimit ? 'text-[#F87171]' : 'text-[#4ADE80]'
          }`}
        >
          {variant.characterCount}/{charLimit}
        </span>
      </div>

      {/* Thread indicator */}
      {variant.isThread && variant.threadParts && (
        <p className="text-[10px] text-[#A1A1AA]">
          Thread: {variant.threadParts.length} parts
        </p>
      )}

      {/* Content */}
      {variant.isThread && variant.threadParts ? (
        <div className="space-y-1.5">
          {variant.threadParts.map((part, i) => (
            <div key={i} className="bg-[#09090B] rounded-[6px] p-2.5">
              <p className="text-[10px] text-[#71717A] mb-0.5">Part {i + 1}</p>
              <pre className="whitespace-pre-wrap text-[12px] text-[#FAFAFA] leading-[1.5]">
                {part}
              </pre>
              <p
                className={`text-[9px] mt-0.5 ${
                  part.length > 280 ? 'text-[#F87171]' : 'text-[#71717A]'
                }`}
              >
                {part.length}/280
              </p>
            </div>
          ))}
        </div>
      ) : (
        <pre className="whitespace-pre-wrap text-[12px] text-[#FAFAFA] leading-[1.5] bg-[#09090B] rounded-[6px] p-2.5">
          {displayContent}
        </pre>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        <CopyButton text={displayContent} />
        <Button
          variant="secondary"
          size="sm"
          onClick={onSave}
          loading={saving}
          className="gap-1.5 text-[11px]"
        >
          <Save size={12} />
          Save as Separate Post
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onReplace}
          disabled={replaced}
          className="gap-1.5 text-[11px]"
        >
          {replaced ? (
            <>
              <Check size={12} />
              Replaced
            </>
          ) : (
            <>
              <Replace size={12} />
              Replace Caption
            </>
          )}
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onPublish}
          loading={publishing}
          className="gap-1.5 text-[11px]"
        >
          <Send size={12} />
          Publish
        </Button>
      </div>
    </div>
  );
}
