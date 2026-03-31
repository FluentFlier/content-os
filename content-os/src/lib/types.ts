import type { Platform, Priority, Status } from './constants';

export interface Post {
  id: string;
  user_id: string;
  title: string;
  pillar: string;
  platform: Platform;
  status: Status;
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
  variant_group_id: string | null;
  source_platform: string | null;
  scheduled_publish_at: string | null;
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
  pillar: string | null;
  used: boolean;
  used_post_id: string | null;
  created_at: string;
}

export interface ContentIdea {
  id: string;
  user_id: string;
  idea: string;
  pillar: string;
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
  pillar: string;
  total_parts: number;
  created_at: string;
}

export interface HashtagSet {
  id: string;
  user_id: string;
  name: string;
  tags: string;
  pillar: string | null;
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

export interface GenerateRequest {
  prompt: string;
  systemOverride?: string;
}

export interface GenerateResponse {
  text: string;
}
