export {
  PILLARS as ALL_PILLARS,
  PLATFORMS as ALL_PLATFORMS,
  PILLAR_LABELS,
  PILLAR_COLORS,
  PILLAR_BADGE_BG,
  STATUSES,
  STATUS_LABELS,
  STATUS_BADGE,
  PRIORITIES,
  NAV_ITEMS,
} from '@/lib/constants';

export type {
  Pillar,
  Platform,
  Status,
  Priority,
} from '@/lib/constants';

export type {
  Post,
  StoryBankEntry,
  ContentIdea,
  Series,
  HashtagSet,
  WeeklyReview,
  GenerateRequest,
  GenerateResponse,
} from '@/lib/types';

export interface ContentPillarConfig {
  name: string;
  color: string;
  description?: string;
  promptTemplate?: string;
}

export interface PlatformConfig {
  instagram?: { enabled: boolean };
  x?: {
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    accessSecret?: string;
    enabled: boolean;
  };
  linkedin?: {
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    personId?: string;
    enabled: boolean;
  };
}

export interface CreatorProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio?: string;
  bio_facts: string;
  voice_description: string;
  voice_rules: string;
  content_pillars: string | ContentPillarConfig[];
  platform_config: string | PlatformConfig;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSetting {
  id: string;
  user_id: string;
  key: string;
  value: string;
  updated_at: string;
}
