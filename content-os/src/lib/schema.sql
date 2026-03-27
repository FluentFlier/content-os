-- Content OS Database Schema
-- Run against InsForge (Supabase-compatible Postgres)

-- ============================================================================
-- 1. creator_profile
-- ============================================================================
create table if not exists creator_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  display_name text not null,
  bio_facts text not null default '',
  voice_description text not null default '',
  voice_rules text not null default '',
  content_pillars jsonb not null default '[]'::jsonb,
  platform_config jsonb not null default '{}'::jsonb,
  onboarding_complete boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table creator_profile enable row level security;

create policy "creator_profile_select" on creator_profile
  for select using (user_id = auth.uid());
create policy "creator_profile_insert" on creator_profile
  for insert with check (user_id = auth.uid());
create policy "creator_profile_update" on creator_profile
  for update using (user_id = auth.uid());
create policy "creator_profile_delete" on creator_profile
  for delete using (user_id = auth.uid());

-- ============================================================================
-- 2. series (must be created before posts for FK)
-- ============================================================================
create table if not exists series (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  pillar text not null,
  total_parts int not null default 1,
  created_at timestamptz default now()
);

alter table series enable row level security;

create policy "series_select" on series
  for select using (user_id = auth.uid());
create policy "series_insert" on series
  for insert with check (user_id = auth.uid());
create policy "series_update" on series
  for update using (user_id = auth.uid());
create policy "series_delete" on series
  for delete using (user_id = auth.uid());

-- ============================================================================
-- 3. posts
-- ============================================================================
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  pillar text not null,
  platform text not null default 'instagram',
  status text not null default 'idea',
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
  series_id uuid references series(id),
  series_position int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table posts enable row level security;

create policy "posts_select" on posts
  for select using (user_id = auth.uid());
create policy "posts_insert" on posts
  for insert with check (user_id = auth.uid());
create policy "posts_update" on posts
  for update using (user_id = auth.uid());
create policy "posts_delete" on posts
  for delete using (user_id = auth.uid());

-- ============================================================================
-- 4. story_bank
-- ============================================================================
create table if not exists story_bank (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  raw_memory text not null,
  mined_angle text,
  mined_hook text,
  mined_script text,
  mined_caption_line text,
  pillar text,
  used boolean default false,
  used_post_id uuid references posts(id),
  created_at timestamptz default now()
);

alter table story_bank enable row level security;

create policy "story_bank_select" on story_bank
  for select using (user_id = auth.uid());
create policy "story_bank_insert" on story_bank
  for insert with check (user_id = auth.uid());
create policy "story_bank_update" on story_bank
  for update using (user_id = auth.uid());
create policy "story_bank_delete" on story_bank
  for delete using (user_id = auth.uid());

-- ============================================================================
-- 5. content_ideas
-- ============================================================================
create table if not exists content_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  idea text not null,
  pillar text not null,
  priority text not null default 'medium',
  notes text,
  converted boolean default false,
  created_at timestamptz default now()
);

alter table content_ideas enable row level security;

create policy "content_ideas_select" on content_ideas
  for select using (user_id = auth.uid());
create policy "content_ideas_insert" on content_ideas
  for insert with check (user_id = auth.uid());
create policy "content_ideas_update" on content_ideas
  for update using (user_id = auth.uid());
create policy "content_ideas_delete" on content_ideas
  for delete using (user_id = auth.uid());

-- ============================================================================
-- 6. hashtag_sets
-- ============================================================================
create table if not exists hashtag_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  tags text not null,
  pillar text,
  use_count int default 0,
  created_at timestamptz default now()
);

alter table hashtag_sets enable row level security;

create policy "hashtag_sets_select" on hashtag_sets
  for select using (user_id = auth.uid());
create policy "hashtag_sets_insert" on hashtag_sets
  for insert with check (user_id = auth.uid());
create policy "hashtag_sets_update" on hashtag_sets
  for update using (user_id = auth.uid());
create policy "hashtag_sets_delete" on hashtag_sets
  for delete using (user_id = auth.uid());

-- ============================================================================
-- 7. weekly_reviews
-- ============================================================================
create table if not exists weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  week_start date not null,
  posts_published int default 0,
  total_views int default 0,
  total_followers_gained int default 0,
  top_post_id uuid references posts(id),
  what_worked text,
  what_to_double_down text,
  what_to_cut text,
  next_week_focus text,
  created_at timestamptz default now()
);

alter table weekly_reviews enable row level security;

create policy "weekly_reviews_select" on weekly_reviews
  for select using (user_id = auth.uid());
create policy "weekly_reviews_insert" on weekly_reviews
  for insert with check (user_id = auth.uid());
create policy "weekly_reviews_update" on weekly_reviews
  for update using (user_id = auth.uid());
create policy "weekly_reviews_delete" on weekly_reviews
  for delete using (user_id = auth.uid());

-- ============================================================================
-- 8. user_settings
-- ============================================================================
create table if not exists user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  key text not null,
  value text not null,
  updated_at timestamptz default now(),
  unique(user_id, key)
);

alter table user_settings enable row level security;

create policy "user_settings_select" on user_settings
  for select using (user_id = auth.uid());
create policy "user_settings_insert" on user_settings
  for insert with check (user_id = auth.uid());
create policy "user_settings_update" on user_settings
  for update using (user_id = auth.uid());
create policy "user_settings_delete" on user_settings
  for delete using (user_id = auth.uid());

-- ============================================================================
-- 9. post_distributions (cross-platform tracking)
-- ============================================================================
create table if not exists post_distributions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade not null,
  platform text not null,
  platform_post_id text,
  optimized_caption text not null,
  optimized_hashtags text,
  status text not null default 'draft',
  posted_at timestamptz,
  metrics jsonb,
  created_at timestamptz default now()
);

alter table post_distributions enable row level security;

create policy "post_distributions_select" on post_distributions
  for select using (
    exists (
      select 1 from posts where posts.id = post_distributions.post_id
        and posts.user_id = auth.uid()
    )
  );
create policy "post_distributions_insert" on post_distributions
  for insert with check (
    exists (
      select 1 from posts where posts.id = post_distributions.post_id
        and posts.user_id = auth.uid()
    )
  );
create policy "post_distributions_update" on post_distributions
  for update using (
    exists (
      select 1 from posts where posts.id = post_distributions.post_id
        and posts.user_id = auth.uid()
    )
  );
create policy "post_distributions_delete" on post_distributions
  for delete using (
    exists (
      select 1 from posts where posts.id = post_distributions.post_id
        and posts.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 10. media_attachments (file storage tracking)
-- ============================================================================
create table if not exists media_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  post_id uuid references posts(id) on delete set null,
  bucket_path text not null,
  file_name text not null,
  file_type text not null,
  file_size int not null,
  created_at timestamptz default now()
);

alter table media_attachments enable row level security;

create policy "media_attachments_select" on media_attachments
  for select using (user_id = auth.uid());
create policy "media_attachments_insert" on media_attachments
  for insert with check (user_id = auth.uid());
create policy "media_attachments_update" on media_attachments
  for update using (user_id = auth.uid());
create policy "media_attachments_delete" on media_attachments
  for delete using (user_id = auth.uid());

-- ============================================================================
-- Storage buckets
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('exports', 'exports', false)
on conflict (id) do nothing;

-- Storage RLS: users can only access their own folder (user_id prefix)
create policy "media_select" on storage.objects
  for select using (
    bucket_id = 'media' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "media_insert" on storage.objects
  for insert with check (
    bucket_id = 'media' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "media_update" on storage.objects
  for update using (
    bucket_id = 'media' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "media_delete" on storage.objects
  for delete using (
    bucket_id = 'media' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "exports_select" on storage.objects
  for select using (
    bucket_id = 'exports' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "exports_insert" on storage.objects
  for insert with check (
    bucket_id = 'exports' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "exports_delete" on storage.objects
  for delete using (
    bucket_id = 'exports' and auth.uid()::text = (storage.foldername(name))[1]
  );
