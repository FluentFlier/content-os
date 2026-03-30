'use client';

import { useEffect, useState } from 'react';
import { getInsforgeClient } from '@/lib/insforge/client';
import {
  PILLARS,
  PILLAR_LABELS,
  PILLAR_COLORS,
  PILLAR_BADGE_BG,
} from '@/lib/constants';
import type { Pillar } from '@/lib/constants';
import type { ContentPillarConfig } from '@/types/database';

/** Shape returned by the hook for each pillar. */
export interface PillarInfo {
  value: string;
  label: string;
  color: string;
  badgeBg: string;
  description?: string;
  promptTemplate?: string;
}

/** Default fallback color palette for custom pillars without a saved color. */
const DEFAULT_CUSTOM_COLORS = [
  '#6366F1',
  '#F59E0B',
  '#10B981',
  '#8B5CF6',
  '#6366F1',
  '#5A5047',
];

/**
 * Builds PillarInfo[] from saved custom pillar configs.
 */
function fromCustomPillars(configs: ContentPillarConfig[]): PillarInfo[] {
  return configs.map((c, i) => {
    const slug = c.name.toLowerCase().replace(/\s+/g, '-');
    return {
      value: slug,
      label: c.name,
      color: c.color || DEFAULT_CUSTOM_COLORS[i % DEFAULT_CUSTOM_COLORS.length],
      badgeBg: '',
      description: c.description,
      promptTemplate: c.promptTemplate,
    };
  });
}

/**
 * Builds PillarInfo[] from the hardcoded default PILLARS constant.
 */
function fromDefaults(): PillarInfo[] {
  return PILLARS.map((p) => ({
    value: p,
    label: PILLAR_LABELS[p],
    color: PILLAR_COLORS[p],
    badgeBg: PILLAR_BADGE_BG[p],
    description: undefined,
    promptTemplate: undefined,
  }));
}

interface UsePillarsReturn {
  /** Ordered list of pillar options. */
  pillars: PillarInfo[];
  /** Whether custom pillars were loaded from the user's profile. */
  isCustom: boolean;
  /** True while fetching from the API. */
  loading: boolean;
  /** Lookup helpers keyed by pillar value (slug). */
  getLabel: (value: string) => string;
  getColor: (value: string) => string;
  getBadgeBg: (value: string) => string;
  /** All pillar slugs as a flat array (convenience for selects). */
  pillarValues: string[];
}

// In-memory cache scoped by user ID so different users see their own pillars.
const _cacheMap = new Map<string, { pillars: PillarInfo[]; isCustom: boolean }>();

/**
 * Hook that reads the current user's content pillars from creator_profile
 * and falls back to the default PILLARS constant when no custom pillars exist.
 *
 * IMPORTANT: We intentionally do NOT read from the cache during initialization.
 * The cache is only used inside the useEffect after the current user ID is
 * resolved, preventing stale data from a previous user in same-tab account
 * switch scenarios.
 */
export function usePillars(): UsePillarsReturn {
  const [pillars, setPillars] = useState<PillarInfo[]>(fromDefaults());
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const insforge = getInsforgeClient();
        const { data: userData } = await insforge.auth.getCurrentUser();
        if (!userData?.user || cancelled) {
          // No authenticated user: return defaults without caching
          if (!cancelled) setLoading(false);
          return;
        }

        const userId = userData.user.id;

        // Check user-scoped cache (only AFTER user ID is resolved)
        const cached = _cacheMap.get(userId);
        if (cached) {
          setPillars(cached.pillars);
          setIsCustom(cached.isCustom);
          setLoading(false);
          return;
        }

        const { data: profile } = await insforge.database
          .from('creator_profile')
          .select('content_pillars')
          .eq('user_id', userId)
          .single();

        if (cancelled) return;

        if (profile?.content_pillars) {
          const raw =
            typeof profile.content_pillars === 'string'
              ? JSON.parse(profile.content_pillars)
              : profile.content_pillars;

          if (Array.isArray(raw) && raw.length > 0 && raw[0]?.name) {
            const custom = fromCustomPillars(raw as ContentPillarConfig[]);
            _cacheMap.set(userId, { pillars: custom, isCustom: true });
            setPillars(custom);
            setIsCustom(true);
            setLoading(false);
            return;
          }
        }

        // No custom pillars, use defaults
        const defaults = { pillars: fromDefaults(), isCustom: false };
        _cacheMap.set(userId, defaults);
        setPillars(defaults.pillars);
        setIsCustom(false);
        setLoading(false);
      } catch {
        // Fall back to defaults on error
        if (!cancelled) {
          setPillars(fromDefaults());
          setIsCustom(false);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Build lookup maps
  const getLabel = (value: string): string => {
    const found = pillars.find((p) => p.value === value);
    if (found) return found.label;
    // Fallback: try hardcoded defaults for legacy pillar values
    if (PILLAR_LABELS[value as Pillar]) return PILLAR_LABELS[value as Pillar];
    // Last resort: capitalize the slug
    return value
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const getColor = (value: string): string => {
    const found = pillars.find((p) => p.value === value);
    if (found) return found.color;
    if (PILLAR_COLORS[value as Pillar]) return PILLAR_COLORS[value as Pillar];
    return '#94A3B8';
  };

  const getBadgeBg = (value: string): string => {
    const found = pillars.find((p) => p.value === value);
    if (found && found.badgeBg) return found.badgeBg;
    if (PILLAR_BADGE_BG[value as Pillar]) return PILLAR_BADGE_BG[value as Pillar];
    // Generate a badge class based on the color
    const color = getColor(value);
    return `bg-[${color}20] text-[${color}]`;
  };

  const pillarValues = pillars.map((p) => p.value);

  return { pillars, isCustom, loading, getLabel, getColor, getBadgeBg, pillarValues };
}

/**
 * Invalidate the in-memory pillar cache (call after profile updates).
 * Clears all user caches to ensure fresh data on next fetch.
 */
export function invalidatePillarCache(): void {
  _cacheMap.clear();
}
