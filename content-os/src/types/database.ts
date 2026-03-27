export type Pillar = "hot-take" | "hackathon" | "founder" | "explainer" | "origin" | "research";
export type Platform = "instagram" | "linkedin" | "twitter" | "threads";
export type PostStatus = "idea" | "scripted" | "filmed" | "edited" | "posted";
export type Priority = "low" | "medium" | "high";

export interface Post {
  id: string;
  user_id: string;
  title: string;
  pillar: Pillar;
  platform: Platform;
  status: PostStatus;
  script: string | null;
  caption: string | null;
  hashtags: string | null;
  hook: string | null;
  notes: string | null;
  scheduled_date: string | null;
  posted_date: string | null;
  views: number | null;
  likes: number | null;
  saves: number | null;
  comments: number | null;
  shares: number | null;
  follows_gained: number | null;
  series_id: string | null;
  series_position: number | null;
  created_at: string;
  updated_at: string;
}

export interface StoryBankEntry {
  id: string;
  user_id: string;
  raw_memory: string;
  mined_angle: string | null;
  mined_hook: string | null;
  mined_script: string | null;
  mined_caption_line: string | null;
  pillar: Pillar | null;
  used: boolean;
  used_post_id: string | null;
  created_at: string;
}

export interface ContentIdea {
  id: string;
  user_id: string;
  idea: string;
  pillar: Pillar;
  priority: Priority;
  notes: string | null;
  converted: boolean;
  created_at: string;
}

export interface Series {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  pillar: Pillar;
  total_parts: number;
  created_at: string;
}

export interface HashtagSet {
  id: string;
  user_id: string;
  name: string;
  tags: string;
  pillar: Pillar | null;
  use_count: number;
  created_at: string;
}

export interface WeeklyReview {
  id: string;
  user_id: string;
  week_start: string;
  posts_published: number;
  total_views: number;
  total_followers_gained: number;
  top_post_id: string | null;
  what_worked: string | null;
  what_to_double_down: string | null;
  what_to_cut: string | null;
  next_week_focus: string | null;
  created_at: string;
}

export interface UserSetting {
  id: string;
  user_id: string;
  key: string;
  value: string;
  updated_at: string;
}

// Pillar display config
export const PILLAR_COLORS: Record<Pillar, string> = {
  "hot-take": "#EB5E55",
  hackathon: "#F5C842",
  founder: "#C77DFF",
  explainer: "#4D96FF",
  origin: "#5CB85C",
  research: "#5A5047",
};

export const PILLAR_LABELS: Record<Pillar, string> = {
  "hot-take": "Hot Take",
  hackathon: "Hackathon",
  founder: "Founder",
  explainer: "Explainer",
  origin: "Origin",
  research: "Research",
};

export const STATUS_COLORS: Record<PostStatus, string> = {
  idea: "#5A5047",
  scripted: "#4D96FF",
  filmed: "#F5C842",
  edited: "#EB5E55",
  posted: "#5CB85C",
};

export const ALL_PILLARS: Pillar[] = ["hot-take", "hackathon", "founder", "explainer", "origin", "research"];
export const ALL_PLATFORMS: Platform[] = ["instagram", "linkedin", "twitter", "threads"];
export const ALL_STATUSES: PostStatus[] = ["idea", "scripted", "filmed", "edited", "posted"];

// --- New types for creator profile, distributions, and media ---

export interface ContentPillarConfig {
  name: string;
  color: string;
  description: string;
  promptTemplate: string;
}

export interface PlatformConfig {
  x?: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessSecret: string;
    enabled: boolean;
  };
  linkedin?: {
    clientId: string;
    clientSecret: string;
    accessToken: string;
    refreshToken: string;
    personId: string;
    enabled: boolean;
  };
  instagram?: {
    enabled: boolean;
  };
}

export interface CreatorProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio_facts: string;
  voice_description: string;
  voice_rules: string;
  content_pillars: ContentPillarConfig[];
  platform_config: PlatformConfig;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostDistribution {
  id: string;
  post_id: string;
  platform: Platform;
  platform_post_id: string | null;
  optimized_caption: string;
  optimized_hashtags: string | null;
  status: string;
  posted_at: string | null;
  metrics: Record<string, number> | null;
  created_at: string;
}

export interface MediaAttachment {
  id: string;
  user_id: string;
  post_id: string | null;
  bucket_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}
