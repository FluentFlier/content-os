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
  '#EB5E55',
  '#F5C842',
  '#5CB85C',
  '#C77DFF',
  '#4D96FF',
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

// In-memory cache so multiple components on the same page don't re-fetch.
let _cache: { pillars: PillarInfo[]; isCustom: boolean } | null = null;

/**
 * Hook that reads the current user's content pillars from creator_profile
 * and falls back to the default PILLARS constant when no custom pillars exist.
 */
export function usePillars(): UsePillarsReturn {
  const [pillars, setPillars] = useState<PillarInfo[]>(
    _cache?.pillars ?? fromDefaults(),
  );
  const [isCustom, setIsCustom] = useState(_cache?.isCustom ?? false);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    if (_cache) {
      setPillars(_cache.pillars);
      setIsCustom(_cache.isCustom);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const insforge = getInsforgeClient();
        const { data: userData } = await insforge.auth.getCurrentUser();
        if (!userData?.user || cancelled) return;

        const { data: profile } = await insforge.database
          .from('creator_profile')
          .select('content_pillars')
          .eq('user_id', userData.user.id)
          .single();

        if (cancelled) return;

        if (profile?.content_pillars) {
          const raw =
            typeof profile.content_pillars === 'string'
              ? JSON.parse(profile.content_pillars)
              : profile.content_pillars;

          if (Array.isArray(raw) && raw.length > 0 && raw[0]?.name) {
            const custom = fromCustomPillars(raw as ContentPillarConfig[]);
            _cache = { pillars: custom, isCustom: true };
            setPillars(custom);
            setIsCustom(true);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Fall back to defaults on error
      }
      if (!cancelled) {
        _cache = { pillars: fromDefaults(), isCustom: false };
        setPillars(_cache.pillars);
        setIsCustom(false);
        setLoading(false);
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
    return '#8C857D';
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
 */
export function invalidatePillarCache(): void {
  _cache = null;
}
