-- ============================================================
-- Dispatch -- Database Schema
-- Apply via: insforge db apply --file db/schema.sql
-- ============================================================

-- ============================================================
-- CREATOR PROFILE (per-user settings, pillars, platform config)
-- ============================================================

create table if not exists creator_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  display_name text not null,
  bio text,
  bio_facts text not null default '',
  voice_description text not null default '',
  voice_rules text not null default '',
  content_pillars jsonb not null default '[]'::jsonb,
  platform_config jsonb not null default '{}'::jsonb,
  onboarding_complete boolean not null default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- SERIES (referenced by posts, create first)
-- ============================================================

create table if not exists series (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  description text,
  pillar text not null,
  total_parts int not null default 2,
  created_at timestamptz default now() not null
);

-- ============================================================
-- POSTS
-- ============================================================

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  pillar text not null,
  platform text not null check (platform in ('instagram','linkedin','twitter','threads')) default 'instagram',
  status text not null check (status in ('idea','scripted','filmed','edited','posted')) default 'idea',
  script text,
  caption text,
  hashtags text,
  hook text,
  notes text,
  scheduled_date date,
  posted_date date,
  views int,
  likes int,
  saves int,
  comments int,
  shares int,
  follows_gained int,
  series_id uuid references series(id) on delete set null,
  series_position int,
  variant_group_id uuid,
  source_platform text,
  scheduled_publish_at timestamptz,
  image_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger posts_updated_at
  before update on posts
  for each row execute function update_updated_at();

-- ============================================================
-- STORY BANK
-- ============================================================

create table if not exists story_bank (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  raw_memory text not null,
  mined_angle text,
  mined_hook text,
  mined_script text,
  mined_caption_line text,
  pillar text,
  used boolean default false not null,
  used_post_id uuid references posts(id) on delete set null,
  created_at timestamptz default now() not null
);

-- ============================================================
-- CONTENT IDEAS
-- ============================================================

create table if not exists content_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  idea text not null,
  pillar text not null,
  priority text not null check (priority in ('low','medium','high')) default 'medium',
  notes text,
  converted boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Migration: add updated_at if upgrading an existing database
alter table content_ideas add column if not exists updated_at timestamptz default now() not null;

create trigger content_ideas_updated_at
  before update on content_ideas
  for each row execute function update_updated_at();

-- ============================================================
-- HASHTAG SETS
-- ============================================================

create table if not exists hashtag_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  tags text not null,
  pillar text,
  use_count int default 0 not null,
  created_at timestamptz default now() not null
);

-- ============================================================
-- WEEKLY REVIEWS
-- ============================================================

create table if not exists weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  week_start date not null,
  posts_published int default 0,
  total_views int default 0,
  total_followers_gained int default 0,
  top_post_id uuid references posts(id) on delete set null,
  what_worked text,
  what_to_double_down text,
  what_to_cut text,
  next_week_focus text,
  created_at timestamptz default now() not null
);

-- ============================================================
-- USER SETTINGS
-- ============================================================

create table if not exists user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  key text not null,
  value text not null,
  updated_at timestamptz default now() not null,
  unique(user_id, key)
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists posts_user_status on posts (user_id, status);
create index if not exists posts_user_pillar on posts (user_id, pillar);
create index if not exists posts_scheduled_date on posts (user_id, scheduled_date);
create index if not exists story_bank_user_used on story_bank (user_id, used);
create index if not exists content_ideas_user_priority on content_ideas (user_id, priority, created_at desc);
create index if not exists user_settings_lookup on user_settings (user_id, key);

-- ============================================================
-- SOCIAL ACCOUNTS (OAuth-connected platform accounts)
-- ============================================================

create table if not exists social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  platform text not null check (platform in ('instagram','linkedin','twitter','threads')),
  account_name text,
  account_id text,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  connection_method text not null default 'oauth',
  connected_at timestamptz default now() not null,
  unique(user_id, platform)
);

create index if not exists social_accounts_user on social_accounts (user_id);
