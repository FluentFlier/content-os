# DISPATCH -- COMPLETE BUILD PROMPT FOR CLAUDE CODE
# ===================================================
# Paste this entire file into Claude Code at a fresh Next.js repo root.
# This builds Dispatch: a private, login-protected content planning and
# generation app for Anirudh Manjesh's personal brand on Instagram,
# LinkedIn, X, and Threads.
#
# Prerequisites (verify before starting):
#   node --version               -> 20+
#   npx create-next-app --version -> latest
#   InsForge project created     -> have INSFORGE_API_KEY and INSFORGE_PROJECT_ID ready
#   ANTHROPIC_API_KEY set        -> claude-sonnet-4-20250514
#   InsForge CLI installed       -> insforge --version
#
# RULES FOR CLAUDE -- READ BEFORE BUILDING:
#   1. Never use em dashes anywhere. Not in code, comments, UI copy,
#      AI prompts, or any string literal. Use a hyphen or rewrite the sentence.
#   2. Do not ask for confirmation between phases. Build sequentially.
#   3. When a phase fails, fix it in place and continue. Never stop mid-build.
#   4. Never put the Anthropic API key in client-side code. API routes only.
#   5. All exported TypeScript functions must have explicit return types.
#   6. Ada is always an "AI secretary," never an "assistant." Applies to
#      every AI output, every prompt, and every piece of UI copy.
#   7. Every AI prompt in this file must be implemented verbatim.
#   8. InsForge is the only backend. No Supabase anywhere in this codebase.
#   9. All database reads and writes go through the InsForge SDK.
#  10. Auth is handled entirely by InsForge. No third-party auth libraries.
# ===================================================

---

## WHAT YOU ARE BUILDING

Dispatch is a single-user, private web application that functions as a
content command center for Anirudh Manjesh's personal brand. It has three jobs:

1. GENERATE. Eight AI-powered tools for producing scripts, captions, hooks,
   story-mined content, repurposed posts, trend angles, comment replies, and
   series plans. All powered by Claude claude-sonnet-4-20250514. All outputs use
   Anirudh's exact voice, background, and content pillars. No generic AI copy.

2. ORGANIZE. A content library (post CRM), a content calendar with drag-and-drop
   scheduling, a story bank, an idea backlog, and a series manager. Every post
   moves through a pipeline: idea -> scripted -> filmed -> edited -> posted.

3. OPTIMIZE. Manual performance logging, pillar-level analytics, weekly review
   prompts with AI analysis, and a hashtag vault. No third-party social API
   integrations -- Anirudh logs stats himself when he checks his phone.

The app also ships a full-screen teleprompter optimized for mobile recording
that works offline once loaded.

Everything is private. One user. No public registration.

---

## TOOL SETUP (do this first, before any code)

### Step 1: Bootstrap Next.js app
```bash
npx create-next-app@latest dispatch \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"
cd dispatch
git init
echo ".env.local" >> .gitignore
echo ".env" >> .gitignore
```

### Step 2: Install dependencies
```bash
npm install \
  @insforge/sdk \
  @anthropic-ai/sdk \
  recharts \
  @hello-pangea/dnd \
  date-fns \
  zod \
  clsx \
  tailwind-merge
```

Check InsForge docs for the exact npm package name if @insforge/sdk has changed.

### Step 3: Create .env.local
```
INSFORGE_API_KEY=your_insforge_api_key
INSFORGE_PROJECT_ID=your_insforge_project_id
INSFORGE_SECRET_KEY=your_insforge_secret_key
ANTHROPIC_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_INSFORGE_PROJECT_ID=your_insforge_project_id
```

### Step 4: Initialize InsForge project
```bash
insforge init --project-id $INSFORGE_PROJECT_ID
insforge db apply --file supabase/schema.sql
```

Verify the InsForge dashboard shows all tables created with access control
policies active before proceeding.

### Step 5: Create first user
```bash
insforge auth create-user --email your@email.com --password yourpassword
```

---

## PHASE 0: ARCHITECTURE LOCK

Run gstack `/plan-eng-review` with this spec before writing any application code.
Do not write a single component, route, or lib file until the review completes.

```
PRODUCT: Dispatch
VERSION: 1.0.0

CORE DATA FLOW:
  User authenticates via InsForge auth (email/password, single user).
  All /dashboard/* routes are protected by Next.js middleware.
  Auth session is managed by InsForge session tokens (server-safe cookies).

  Content generation:
    Client calls POST /api/generate with { prompt, systemOverride? }
    API route verifies InsForge session server-side
    API route fetches user context_additions from user_settings table
    API route builds system prompt: BASE_SYSTEM_PROMPT + context_additions
    API route calls Anthropic claude-sonnet-4-20250514
    Client receives response text, displays in output panel

  Content persistence:
    Posts, story bank entries, ideas, series, hashtag sets, weekly reviews
    all live in InsForge Postgres with access control (user_id = session user).
    No file storage. All content is text.

  Analytics:
    Performance stats (views, likes, saves, comments, shares, follows_gained)
    are logged manually by the user on the /analytics page.
    Charts rendered with recharts. No social platform API calls.

  Teleprompter:
    Accessible at /teleprompter?postId=[id] or /teleprompter (freeform paste).
    Full-screen, offline-capable after first load. No API calls in reader mode.

DIRECTORY STRUCTURE:
  app/
    (auth)/
      login/page.tsx
    (dashboard)/
      layout.tsx              sidebar + mobile nav + session check
      dashboard/page.tsx
      generate/page.tsx
      library/page.tsx
      teleprompter/page.tsx
      calendar/page.tsx
      story-bank/page.tsx
      ideas/page.tsx
      series/page.tsx
      analytics/page.tsx
      settings/page.tsx
    api/
      generate/route.ts
      posts/route.ts
      posts/[id]/route.ts
      (all other CRUD routes)
    page.tsx                  root: redirects based on session
    layout.tsx                fonts + global styles
  components/
    ui/                       reusable primitives
    nav/                      sidebar + bottom bar
    generate/                 all 8 tab components
    library/                  post card, editor drawer
    calendar/                 calendar grid, backlog
    analytics/                charts, log form, weekly review
    teleprompter/             full-screen reader
  lib/
    insforge/
      client.ts               browser InsForge client
      server.ts               server InsForge client
    claude.ts                 Anthropic client + base system prompt
    types.ts                  all shared TypeScript types
    utils.ts                  cn(), formatDate(), pillarColors, etc.
    constants.ts              pillar list, status list, platform list
  db/
    schema.sql                full DDL applied via InsForge CLI
  middleware.ts               route protection using InsForge session

TECH CONSTRAINTS:
  - Next.js 14 App Router, TypeScript strict mode
  - InsForge for auth + Postgres, access control on all tables
  - Anthropic API server-side only (never exposed to client)
  - Tailwind CSS only, no component library
  - recharts for charts
  - @hello-pangea/dnd for calendar drag-and-drop
  - date-fns for all date formatting
  - Zod for all form and API validation
  - No Supabase anywhere
  - No external social API integrations
  - Teleprompter works offline after first load
```

After architecture review completes, proceed to Phase 1.

---

## PHASE 1: DIRECTORY SCAFFOLD

Create this exact structure. Use empty files where content comes later.
Every file in this tree must exist before Phase 2 begins.

```
dispatch/
  app/
    (auth)/
      login/
        page.tsx
    (dashboard)/
      layout.tsx
      dashboard/
        page.tsx
      generate/
        page.tsx
      library/
        page.tsx
      teleprompter/
        page.tsx
      calendar/
        page.tsx
      story-bank/
        page.tsx
      ideas/
        page.tsx
      series/
        page.tsx
      analytics/
        page.tsx
      settings/
        page.tsx
    api/
      generate/
        route.ts
      posts/
        route.ts
        [id]/
          route.ts
      story-bank/
        route.ts
        [id]/
          route.ts
      ideas/
        route.ts
        [id]/
          route.ts
      series/
        route.ts
        [id]/
          route.ts
      analytics/
        route.ts
      hashtag-sets/
        route.ts
        [id]/
          route.ts
      weekly-reviews/
        route.ts
      settings/
        route.ts
    page.tsx
    layout.tsx
    globals.css
  components/
    ui/
      Button.tsx
      Badge.tsx
      Card.tsx
      Input.tsx
      Textarea.tsx
      Select.tsx
      Modal.tsx
      Drawer.tsx
      Skeleton.tsx
      CopyButton.tsx
      Spinner.tsx
      Tabs.tsx
      Toast.tsx
    nav/
      Sidebar.tsx
      BottomBar.tsx
      NavItem.tsx
    generate/
      ScriptGenerator.tsx
      StoryMine.tsx
      CaptionHashtags.tsx
      HookGenerator.tsx
      Repurpose.tsx
      TrendCatcher.tsx
      CommentReplies.tsx
      SeriesPlanner.tsx
      GenerateOutput.tsx
    library/
      PostCard.tsx
      PostGrid.tsx
      PostTable.tsx
      PostEditorDrawer.tsx
      StatusPipeline.tsx
      PerformanceModal.tsx
    calendar/
      CalendarGrid.tsx
      CalendarDay.tsx
      CalendarBacklog.tsx
      WeekView.tsx
    analytics/
      ViewsChart.tsx
      SavesChart.tsx
      FollowsChart.tsx
      PillarBreakdown.tsx
      TopPerformers.tsx
      LogPerformanceForm.tsx
      WeeklyReview.tsx
      HashtagVault.tsx
    teleprompter/
      TeleprompterReader.tsx
    story-bank/
      StoryCard.tsx
      StoryGrid.tsx
    ideas/
      IdeaRow.tsx
      IdeaForm.tsx
    series/
      SeriesCard.tsx
      SeriesPostList.tsx
  lib/
    insforge/
      client.ts
      server.ts
    claude.ts
    types.ts
    utils.ts
    constants.ts
  db/
    schema.sql
  middleware.ts
  tailwind.config.ts
  next.config.ts
  tsconfig.json
  .env.local
  README.md
```

---

## PHASE 2: DATABASE SCHEMA

Write the complete contents of `db/schema.sql`. Apply it via:
```bash
insforge db apply --file db/schema.sql
```

Every table has an access control policy enforced by InsForge: only the
authenticated user whose user_id matches can read or write their own rows.
Configure these policies in the InsForge dashboard after applying the schema.

```sql
-- ============================================================
-- Dispatch -- Database Schema
-- Apply via: insforge db apply --file db/schema.sql
-- ============================================================

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
  pillar text not null check (pillar in ('hot-take','hackathon','founder','explainer','origin','research')),
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
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Auto-update updated_at
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
  created_at timestamptz default now() not null
);

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

create index posts_user_status on posts (user_id, status);
create index posts_user_pillar on posts (user_id, pillar);
create index posts_scheduled_date on posts (user_id, scheduled_date);
create index story_bank_user_used on story_bank (user_id, used);
create index content_ideas_user_priority on content_ideas (user_id, priority, created_at desc);
create index user_settings_lookup on user_settings (user_id, key);
```

After applying, go to the InsForge dashboard and configure access control on
all 7 tables so that every row is scoped to user_id = authenticated user ID.
Verify all 7 tables show access control as active before proceeding.

---

## PHASE 3: LIB LAYER

Build these files completely before any component or route touches them.

### `lib/constants.ts`

```typescript
export const PILLARS = [
  'hot-take',
  'hackathon',
  'founder',
  'explainer',
  'origin',
  'research',
] as const;

export type Pillar = typeof PILLARS[number];

export const PILLAR_LABELS: Record<Pillar, string> = {
  'hot-take': 'Hot Take',
  hackathon: 'Hackathon',
  founder: 'Founder',
  explainer: 'Explainer',
  origin: 'Origin',
  research: 'Research',
};

export const PILLAR_COLORS: Record<Pillar, string> = {
  'hot-take': '#EB5E55',
  hackathon: '#F5C842',
  founder: '#4D96FF',
  explainer: '#C77DFF',
  origin: '#5CB85C',
  research: '#F5C842',
};

export const PILLAR_BG: Record<Pillar, string> = {
  'hot-take': 'bg-[#EB5E55]/10 text-[#EB5E55]',
  hackathon: 'bg-[#F5C842]/10 text-[#F5C842]',
  founder: 'bg-[#4D96FF]/10 text-[#4D96FF]',
  explainer: 'bg-[#C77DFF]/10 text-[#C77DFF]',
  origin: 'bg-[#5CB85C]/10 text-[#5CB85C]',
  research: 'bg-[#F5C842]/10 text-[#F5C842]',
};

export const STATUSES = ['idea', 'scripted', 'filmed', 'edited', 'posted'] as const;
export type Status = typeof STATUSES[number];

export const STATUS_LABELS: Record<Status, string> = {
  idea: 'Idea',
  scripted: 'Scripted',
  filmed: 'Filmed',
  edited: 'Edited',
  posted: 'Posted',
};

export const STATUS_COLORS: Record<Status, string> = {
  idea: 'bg-[#5A5047]/20 text-[#5A5047]',
  scripted: 'bg-[#4D96FF]/10 text-[#4D96FF]',
  filmed: 'bg-[#F5C842]/10 text-[#F5C842]',
  edited: 'bg-[#EB5E55]/10 text-[#EB5E55]',
  posted: 'bg-[#5CB85C]/10 text-[#5CB85C]',
};

export const PLATFORMS = ['instagram', 'linkedin', 'twitter', 'threads'] as const;
export type Platform = typeof PLATFORMS[number];

export const PRIORITIES = ['low', 'medium', 'high'] as const;
export type Priority = typeof PRIORITIES[number];

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'home' },
  { label: 'Generate', href: '/generate', icon: 'wand' },
  { label: 'Library', href: '/library', icon: 'grid' },
  { label: 'Calendar', href: '/calendar', icon: 'calendar' },
  { label: 'Story Bank', href: '/story-bank', icon: 'archive' },
  { label: 'Ideas', href: '/ideas', icon: 'lightbulb' },
  { label: 'Series', href: '/series', icon: 'layers' },
  { label: 'Analytics', href: '/analytics', icon: 'bar-chart' },
  { label: 'Settings', href: '/settings', icon: 'gear' },
] as const;
```

### `lib/types.ts`

```typescript
import type { Pillar, Platform, Priority, Status } from './constants';

export interface Post {
  id: string;
  user_id: string;
  title: string;
  pillar: Pillar;
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

export interface GenerateRequest {
  prompt: string;
  systemOverride?: string;
}

export interface GenerateResponse {
  text: string;
}
```

### `lib/utils.ts`

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, startOfWeek } from 'date-fns';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null): string {
  if (!date) return '--';
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateShort(date: string | Date | null): string {
  if (!date) return '--';
  return format(new Date(date), 'MMM d');
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export function nextStatus(
  current: Status
): Status {
  const pipeline = ['idea', 'scripted', 'filmed', 'edited', 'posted'] as const;
  const idx = pipeline.indexOf(current as typeof pipeline[number]);
  if (idx === pipeline.length - 1) return current;
  return pipeline[idx + 1] as Status;
}

type Status = 'idea' | 'scripted' | 'filmed' | 'edited' | 'posted';
```

### `lib/claude.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';

// Singleton. Server-side only. Never import in any client component.
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const BASE_SYSTEM_PROMPT = `You are a content strategist for Anirudh Manjesh. Here is who he actually is:

FACTS:
- CS senior at ASU Barrett Honors College, graduating May 2026. GPA 3.62.
- Solo founder of Ada (tryada.app). Ada is an AI secretary (never "assistant") that lives in the iOS share button. Positioned for busy people broadly, not just founders. 250+ organic waitlist signups, zero ad spend.
- 36 hackathons. 15 wins. $30,000+ in prizes.
- CRA Outstanding Undergraduate Researcher Award (Honorable Mention). Presented at AAAS 2025.
- Undergraduate researcher in the Smith-Lei Neurobiology Lab: built ML systems for honeybee sleep analysis, 3+ years. First-author manuscript submitted to Journal of Comparative Physiology A.
- Rebuilt TackBraille: cut Braille display cost from $4,000 to $450. Deployed across South Africa, Kenya, Equatorial Guinea.
- SWE intern at Cisek Inspection Solutions (Aug-Dec 2025): built computer vision models for food inspection.
- Interned at ISRO (Indian Space Research Organisation).
- Originally from Bangalore. Attended Sri Ramakrishna Vidyashala boarding school in Mysore, grades 8-10.
- Moving to San Francisco post-graduation. Already embedded in SF tech/startup ecosystem.

VOICE: Raw, honest, direct. No fluff. Talks like he's telling a friend something real. Contrarian but earned -- he has the receipts. Short punchy sentences. Talks TO the viewer, not AT them. Never sounds scripted.

RULES:
- No em dashes anywhere. Ever.
- No corporate speak or influencer fluff
- Never genericize a specific detail
- Ada is always a "secretary," never an "assistant"
- If a 16 year old cannot follow an explanation, simplify more

CONTENT PILLARS:
1. Hot Takes -- job market myths, AI hype vs reality, why CS students play it safe, hackathon culture vs interview culture
2. Hackathon Stories -- 36 hackathons = 36 real stories. Raw, specific, dramatic moments.
3. Founder in Public -- honest Ada/startup updates. Tuesday at 11pm energy, not success theater.
4. Concept Explainers -- AI/startup/research concepts in under 60 seconds. Zero jargon.
5. Origin/Arc -- Bangalore boarding school to ISRO to 36 hackathons to AI founder moving to SF. The non-linear path.
6. Research Unlocked -- honeybee sleep ML, AAAS, what doing real CS research actually looks like.`;

export async function generateContent(
  prompt: string,
  contextAdditions?: string,
  systemOverride?: string
): Promise<string> {
  const systemPrompt = systemOverride
    ? systemOverride
    : contextAdditions
    ? `${BASE_SYSTEM_PROMPT}\n\nADDITIONAL CONTEXT (current):\n${contextAdditions}`
    : BASE_SYSTEM_PROMPT;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude');
  return block.text;
}
```

### `lib/insforge/client.ts`

```typescript
import { createInsforgeClient } from '@insforge/sdk';

// Browser client -- safe to use in client components for auth only.
// All data queries must go through API routes, never directly from the browser.
let client: ReturnType<typeof createInsforgeClient> | null = null;

export function getInsforgeClient(): ReturnType<typeof createInsforgeClient> {
  if (!client) {
    client = createInsforgeClient({
      projectId: process.env.NEXT_PUBLIC_INSFORGE_PROJECT_ID!,
      // No secret key here -- browser client only
    });
  }
  return client;
}
```

### `lib/insforge/server.ts`

```typescript
import { createInsforgeServerClient } from '@insforge/sdk';
import { cookies } from 'next/headers';

// Server client -- used in API routes and Server Components only.
// Has access to the session token from cookies.
// Never import this in any client component.
export async function getServerClient(): Promise<ReturnType<typeof createInsforgeServerClient>> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('insforge-session')?.value;

  return createInsforgeServerClient({
    projectId: process.env.INSFORGE_PROJECT_ID!,
    secretKey: process.env.INSFORGE_SECRET_KEY!,
    sessionToken: sessionToken ?? undefined,
  });
}

// Verify session and return user. Returns null if not authenticated.
export async function getAuthenticatedUser(): Promise<{ id: string; email: string } | null> {
  try {
    const client = await getServerClient();
    const user = await client.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
}
```

Note: The exact method names (createInsforgeClient, createInsforgeServerClient,
client.auth.getUser) may differ from InsForge's actual SDK. Check InsForge docs
and adjust all calls in lib/insforge/ before using them in routes or components.
The pattern -- browser client for auth only, server client with secret key for
data -- must be preserved regardless of the exact method names.

### `middleware.ts` (repo root)

```typescript
import { NextResponse, type NextRequest } from 'next/server';

// List of all protected path prefixes
const PROTECTED = [
  '/dashboard',
  '/generate',
  '/library',
  '/calendar',
  '/story-bank',
  '/ideas',
  '/series',
  '/analytics',
  '/settings',
  '/teleprompter',
];

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const sessionToken = request.cookies.get('insforge-session')?.value;
  const isProtected = PROTECTED.some(p => request.nextUrl.pathname.startsWith(p));

  if (!sessionToken && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (sessionToken && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

Note: If InsForge uses a different cookie name than 'insforge-session', update
the cookie key here and in lib/insforge/server.ts to match InsForge's actual
session cookie name. Check InsForge docs.

---

## PHASE 4: GLOBAL LAYOUT + DESIGN TOKENS

### `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #0C0A09;
  --surface: #13100E;
  --border: #2A2218;
  --text: #FAF6F1;
  --muted: #5A5047;
  --coral: #EB5E55;
  --yellow: #F5C842;
  --green: #5CB85C;
  --purple: #C77DFF;
  --blue: #4D96FF;
}

* { box-sizing: border-box; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Space Grotesk', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, h5, h6, .font-display {
  font-family: 'Syne', system-ui, sans-serif;
}

::selection { background: var(--coral); color: white; }

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--muted); }
```

### `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0C0A09',
        surface: '#13100E',
        border: '#2A2218',
        text: '#FAF6F1',
        muted: '#5A5047',
        coral: '#EB5E55',
        yellow: '#F5C842',
        green: '#5CB85C',
        purple: '#C77DFF',
        blue: '#4D96FF',
      },
      fontFamily: {
        display: ['Syne', 'system-ui', 'sans-serif'],
        body: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
```

### `app/layout.tsx`

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dispatch',
  description: 'Private content command center.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Grotesk:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### `app/page.tsx`

```tsx
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/insforge/server';

export default async function RootPage(): Promise<never> {
  const user = await getAuthenticatedUser();
  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
```

---

## PHASE 5: AUTH -- /login

### `app/(auth)/login/page.tsx`

Login page. Centered card on bg background.
Logo: "DISPATCH" in Syne 800 at top, coral color.
Below logo: "Your content, dispatched." in muted text, small.

Form: email input + password input + "Sign In" button (coral, full width).
While signing in: spinner inside the button, button disabled.
On error: error message displayed below the button in coral, no browser alert.
On success: redirect to /dashboard via router.push.

Auth call pattern (adjust to InsForge's actual SDK methods):
```typescript
const client = getInsforgeClient();
const { error } = await client.auth.signInWithPassword({ email, password });
if (error) { setError(error.message); return; }
router.push('/dashboard');
```

No "Register" link. No "Forgot password" link. No social auth.
Email input has `autoComplete="email"`. Password input has `autoComplete="current-password"`.

---

## PHASE 6: DASHBOARD LAYOUT + NAV

### `app/(dashboard)/layout.tsx`

Server component. Calls `getAuthenticatedUser()`. If null, redirect to /login.
Renders: Sidebar (hidden on mobile) + main content + BottomBar (visible on mobile).

Desktop layout: `flex h-screen`. Sidebar 240px fixed. Content: `flex-1 overflow-y-auto`.
Mobile layout: sidebar hidden, BottomBar fixed at bottom, content `pb-20` for clearance.

### `components/nav/Sidebar.tsx`

```
DISPATCH                        <- Syne 800, coral
Anirudh / tryada.app            <- muted, 12px

[nav items from NAV_ITEMS]
                                   active: coral dot left + coral text
                                   inactive: muted, hover text-[#FAF6F1]

[Sign Out]                      <- bottom, muted, small
                                   calls client.auth.signOut() then router.push('/login')
```

All nav items are Next.js `<Link>` with `usePathname()` for active detection.
Icons: inline SVG only, 20x20, no icon library.

### `components/nav/BottomBar.tsx`

Mobile only (`md:hidden`). Fixed bottom. bg-surface border-t border-border.
Shows: Dashboard / Generate / Library / Calendar / Settings.
Active item: coral dot above the label + coral label text.

---

## PHASE 7: /api/generate (build before any generate UI)

### `app/api/generate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { generateContent } from '@/lib/claude';
import { z } from 'zod';

const RequestSchema = z.object({
  prompt: z.string().min(1).max(10000),
  systemOverride: z.string().max(5000).optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Verify session
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  // 3. Fetch user context additions from InsForge
  const client = await getServerClient();
  const settingRow = await client.db
    .from('user_settings')
    .select('value')
    .eq('user_id', user.id)
    .eq('key', 'context_additions')
    .single();

  const contextAdditions = settingRow?.value ?? undefined;

  // 4. Call Claude
  try {
    const text = await generateContent(
      parsed.data.prompt,
      contextAdditions,
      parsed.data.systemOverride
    );
    return NextResponse.json({ text });
  } catch (err) {
    console.error('Claude API error:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
```

Build all CRUD API routes following this exact pattern -- verify user first,
then use getServerClient() for all InsForge queries. Never use the browser
client in API routes.

Routes to build:
- `app/api/posts/route.ts` -- GET (with pillar/status/platform/series filters) + POST
- `app/api/posts/[id]/route.ts` -- GET + PATCH + DELETE
- `app/api/story-bank/route.ts` -- GET + POST
- `app/api/story-bank/[id]/route.ts` -- GET + PATCH + DELETE
- `app/api/ideas/route.ts` -- GET (sorted priority desc, created_at desc) + POST
- `app/api/ideas/[id]/route.ts` -- PATCH + DELETE
- `app/api/series/route.ts` -- GET + POST
- `app/api/series/[id]/route.ts` -- GET + PATCH + DELETE
- `app/api/hashtag-sets/route.ts` -- GET + POST
- `app/api/hashtag-sets/[id]/route.ts` -- PATCH + DELETE
- `app/api/weekly-reviews/route.ts` -- GET (filter by week_start) + POST
- `app/api/analytics/route.ts` -- GET: aggregated stats (views/saves by pillar, last 30 posts)
- `app/api/settings/route.ts` -- GET (by key) + POST (upsert)

Every route: `getAuthenticatedUser()` is the first line. Return 401 if null.
All InsForge queries filter by `user_id = user.id` explicitly, even if access
control is configured at the InsForge level. Defense in depth.

---

## PHASE 8: /dashboard

### `app/(dashboard)/dashboard/page.tsx`

Server component. Uses `getServerClient()` to fetch:
- Posts scheduled this week (scheduled_date between Monday and Sunday, status != 'posted')
- Count: posts scheduled this week
- Count: posts not yet posted (in pipeline)
- Count: total posts with status = 'posted'
- Posting streak: consecutive days back from today with at least one posted post
- Top 3 content_ideas by priority (not converted)
- Last 5 posts ordered by updated_at desc

Renders:
1. Greeting: "What are we building today?" -- Syne 800, 32px, top of page
2. Stats row: 4 cards (Posts This Week / In Pipeline / Total Posted / Streak).
   Each card: large coral number + muted label below.
3. Up Next: 3 cards for next scheduled posts. Each: pillar-colored left border
   (4px), title, platform badge, status badge, scheduled date.
4. Today's Prompt: client component. Calls /api/generate on mount.
   Shows skeleton while loading. Refresh button re-calls.
   Prompt:
   ```
   Here is Anirudh's content schedule for this week:
   [list of scheduled posts with pillar and status]

   What single content idea (pillar + angle) is most missing from this week's plan?
   Give one specific idea. Pillar name, then one sentence on the angle. Nothing else.
   No em dashes.
   ```
5. Backlog preview: top 3 ideas, each with pillar badge + priority color dot.
6. Quick actions: 4 buttons -- Generate Script / Mine a Story / Log a Post / Add Idea.
7. Recent activity: last 5 posts. Title + status badge + relative time.

---

## PHASE 9: /generate (all 8 tabs)

### `app/(dashboard)/generate/page.tsx`

Client component. Tabs as pill buttons at top, coral underline on active.
Tab labels: Script / Story Mine / Caption + Tags / Hooks / Repurpose / Trend / Replies / Series.

All tabs share `GenerateOutput.tsx`:
- Output in a styled box (bg-surface, rounded-lg, border-border, monospace-ish text)
- CopyButton component
- "Save to Library" button: opens modal with title input, platform dropdown,
  status default 'scripted'. On save: POST /api/posts.
- Skeleton while loading (3 lines of varying width)

### TAB 1 -- ScriptGenerator.tsx

6 pillar pill buttons, each uses pillar color when active.
Optional topic textarea.
"Generate Script" button (coral).

HOT TAKE prompt:
```
Generate a hot take Reel script.
TOPIC (optional): [topic or "choose a strong angle from Anirudh's real experience"]
HOOK: One bold controversial sentence. Stop-scrolling.
ARGUMENT: The actual claim, one sentence.
EVIDENCE: Specific proof or real example from Anirudh's background, one sentence.
FLIP: What they should do or think instead, one sentence.
CTA: One direct question.
Under 60 seconds when spoken. No em dashes. Anirudh's voice only.
```

HACKATHON prompt:
```
Generate a hackathon story Reel script. Anirudh has 36 hackathons. Pick a specific, realistic, dramatic story.
HOOK: Drop into the most intense moment. No setup.
SETUP: 2 bullets -- challenge, stakes.
TURN: 1 bullet -- what changed under pressure.
LESSON: 1 bullet -- what this teaches about building.
CTA: Ask viewers about their own experience.
No em dashes.
```

FOUNDER prompt:
```
Generate a founder-in-public script about building Ada (tryada.app). Ada is an AI secretary (not assistant) in the iOS share button.
HOOK: One honest vulnerable sentence. Real energy, no spin.
REALITY: 2 bullets -- what was hard or went wrong.
PROGRESS: 1 bullet -- one thing that moved.
LESSON: 1 bullet -- what this is teaching about startups.
CTA: Invite builders to share their week.
Sound like Tuesday at 11pm, not a success story. No em dashes.
```

EXPLAINER prompt:
```
Generate a concept explainer about AI or startups. Under 60 seconds.
TOPIC (optional): [topic or "choose one concept from AI, startups, or research"]
HOOK: A question that makes them feel dumb for not knowing.
SIMPLE VERSION: 2 bullets, zero jargon. 16-year-old readable.
WHY IT MATTERS: 1 bullet.
MISCONCEPTION: 1 bullet.
CTA: Ask what to explain next.
No em dashes.
```

ORIGIN prompt:
```
Generate an origin/arc video script.
Backstory: Bangalore born. Boarding school in Mysore. Interned at ISRO. Ended up at an honors CS program in Arizona. 36 hackathons. Built TackBraille and deployed it across Africa. Now founding an AI startup and moving to SF.
HOOK: One specific detail that makes someone lean in.
THE PATH: 2 bullets -- the unexpected parts.
THROUGH LINE: 1 bullet -- what actually connects it all.
NOW: 1 bullet -- where it's heading.
CTA: Invite non-linear paths in comments.
No em dashes.
```

RESEARCH prompt:
```
Generate a research unlocked video script that makes ML/neuroscience research feel accessible and interesting.
Anirudh's research: built ML systems to analyze honeybee sleep in the Smith-Lei Neurobiology Lab. Used V-JEPA models. First-author paper submitted to Journal of Comparative Physiology A. Presented at AAAS 2025.
HOOK: One line that makes someone who hates science want to keep watching.
THE WEIRD PART: 2 bullets -- what is genuinely surprising about the research.
WHY IT MATTERS: 1 bullet -- real-world stakes.
THE META LESSON: 1 bullet -- what doing research teaches you that classes do not.
CTA: Ask if they knew this kind of research existed.
No em dashes.
```

### TAB 2 -- StoryMine.tsx

Large textarea. Placeholder: "Describe any memory or experience."
Helper (muted, 13px): "A hackathon moment. Something that happened while building
Ada. The day you almost quit. What deploying TackBraille in Africa actually looked
like. Anything that felt real."

"Mine It" button (yellow bg, black text).

Prompt:
```
Mine this memory for the strongest Instagram content angle.
MEMORY: [input]

Return exactly:
PILLAR: (hot-take / hackathon / founder / explainer / origin / research)
ANGLE: One sentence -- what makes this interesting to a stranger.
HOOK: Exact first line to say on camera. No setup. Drop in.
SCRIPT:
- (beat 1)
- (beat 2)
- (beat 3)
- (beat 4)
CTA: Closing question.
CAPTION LINE: Just the first line of the Instagram caption (before "more").
PLATFORM FIT: Best platform for this specific story and why (one sentence).

Use every specific detail from the memory. Never genericize. No em dashes.
```

Extra output buttons: "Save to Story Bank" (POST /api/story-bank) and
"Convert to Post" (switches to Script tab, pre-fills with mined script).

### TAB 3 -- CaptionHashtags.tsx

Textarea for script/video idea.
Toggle: "Use saved hashtag set" / "Generate fresh."
If saved: dropdown from GET /api/hashtag-sets.

Prompt:
```
Write an Instagram caption and hashtag set.
VIDEO: [input]
CAPTION: 2-4 sentences. First line is the hook shown before "more". Raw, honest, Anirudh's voice. No em dashes. Direct question at the end to drive comments.
HASHTAGS: 20-25 hashtags. Mix niche (hackathons, startups, AI, founder, research, accessibility), personal brand, and broad reach. One line, space-separated.
No labels. Just caption, blank line, hashtags.
```

Below output: "Save as Hashtag Set" -- name input, POST /api/hashtag-sets.

### TAB 4 -- HookGenerator.tsx

Optional topic input. "Generate 8 Hooks" button.
Each hook in its own row with its own CopyButton.

Prompt:
```
Generate 8 Instagram hooks for: [topic or "hackathons, AI, startups, building, research"].
One sentence each. First word must stop the scroll.
Mix styles:
- Stat-based: "I've won 15 hackathons. Here's the one thing that never changes."
- Contrarian: "The job market is not broken. You are."
- Story-drop: "At 3am during my 20th hackathon I realized I had been building wrong."
- Challenge: "You are not struggling to get hired because of AI."
- Curiosity: "Nobody told me undergrad research would feel like this."
- Vulnerability: "I shipped Ada to 250 people and almost shut it down the same week."
Numbered 1-8. One per line. No explanation. No em dashes.
```

### TAB 5 -- Repurpose.tsx

Textarea: paste script.
From platform select / To platform select.
"Repurpose" button.

Prompt:
```
Adapt this [fromPlatform] script for [toPlatform].
SCRIPT: [input]

[toPlatform] guidelines:
- instagram: tight, punchy, visual. Short beats. Under 90 seconds.
- linkedin: longer, more reflective. Add professional context. First line hooks. Expand the lesson.
- twitter: thread format. Each tweet numbered. Under 280 chars each. Hook tweet earns the click.
- threads: conversational, like texting a smart friend. Short posts. Real reactions. No polish.

Match the voice, keep every specific detail, adapt only the format and length. No em dashes.
```

### TAB 6 -- TrendCatcher.tsx

Textarea: describe a trending topic.
"Find My Angle" button.

Prompt:
```
A trend or topic is happening: [input].
Find Anirudh's specific, earned angle on it. He has receipts: 36 hackathons, research at a neurobiology lab, founding an AI startup, ISRO intern, built accessibility tech for Africa. He should not comment on trends without a personal connection.
ANGLE: His specific POV (one sentence)
CONNECTION: What from his actual experience gives him the right to speak on this
HOOK: First line on camera
SCRIPT OUTLINE:
- (beat 1)
- (beat 2)
- (beat 3)
CTA: Closing question
AVOID: What would make this feel generic or unearned
No em dashes.
```

### TAB 7 -- CommentReplies.tsx

Textarea: paste 5-10 comments.
"Generate Replies" button.

Prompt:
```
Write replies to these Instagram comments in Anirudh's voice. Raw, direct, like texting a friend. Short. Engage genuinely. Ask a follow-up question when natural. No em dashes. Never sound like a brand.
COMMENTS: [input]
Return each reply labeled Comment 1 Reply, Comment 2 Reply, etc.
```

Each reply gets its own CopyButton.

### TAB 8 -- SeriesPlanner.tsx

Series concept input + parts count (2-10).
"Plan Series" button.

Prompt:
```
Plan a [n]-part Instagram content series on: [concept].
For each part:
PART [n]:
TITLE: (punchy episode title)
HOOK: (first line on camera)
CORE POINT: (what this part establishes -- one sentence)
CLIFFHANGER/BRIDGE: (how this part makes them want the next one)

Each part works standalone but rewards watching all. Part 1 must be the strongest hook. Build toward a payoff. Anirudh's voice throughout. No em dashes.
```

"Save as Series" button: POST /api/series with name/pillar/total_parts.

---

## PHASE 10: /library

### `app/(dashboard)/library/page.tsx`

Client component. State: view (card | table), filters, search, selected post IDs.
Data: GET /api/posts, re-fetches on filter change. Search is client-side.

Header: "Library" (Syne) + Card/Table toggle + "New Post" button (coral) +
filter dropdowns (Pillar / Platform / Status / Series) + search input.

### `components/library/PostCard.tsx`

bg-surface, border-border, rounded-lg. 4px left accent bar in pillar color.
Title (600 weight) + badges row + first 120 chars of script (muted) +
scheduled date + performance stats if posted (views icon + saves icon, small).
Clicking anywhere: opens PostEditorDrawer.

### `components/library/PostEditorDrawer.tsx`

Slide-in from right. 480px desktop, full-screen mobile. Close on overlay + Escape.

Fields in order:
1. Title input
2. Pillar select / Platform select / Status pipeline (inline row)
3. Scheduled date input (type="date")
4. Hook textarea (3 rows)
5. Script textarea (10 rows)
6. Caption textarea (5 rows)
7. Hashtags textarea (3 rows)
8. Notes textarea (3 rows)
9. Series: dropdown of series names + position number input

Action buttons:
- Regenerate Caption (calls /api/generate, updates caption field)
- Regenerate Hook (calls /api/generate, updates hook field)
- Repurpose (platform select, calls /api/generate, shows output panel inline)
- Open Teleprompter (link to /teleprompter?postId=[id])

Status pipeline bar at bottom. 5 colored dots. Click to advance.
Advancing to "posted" opens PerformanceModal.

All changes auto-save via PATCH /api/posts/[id] on field blur.
Toast notification on each save (success green, error coral).

### `components/library/PerformanceModal.tsx`

Triggered when status advances to "posted."
Fields: posted_date (default today), views, likes, saves, comments, shares,
follows_gained. "Log Performance" button. PATCH /api/posts/[id].

---

## PHASE 11: /teleprompter

### `app/(dashboard)/teleprompter/page.tsx`

This page overrides the dashboard layout -- no sidebar, no bottom bar.
Detect this route in `app/(dashboard)/layout.tsx` by pathname and render
children-only without nav when pathname === '/teleprompter'.

If `?postId=[id]`: fetch post script via GET /api/posts/[id] on mount.
If no postId: full-screen dark textarea for manual paste, then "Start" enters reader.

### `components/teleprompter/TeleprompterReader.tsx`

Full-screen. Black background. State: scrolling, speed (1-10), fontSize (28-42),
mirrored, scrollY, done.

Progress bar: fixed top, width = scrollY/maxScrollY * 100%, coral color.

Script text: white, Syne font, [fontSize]px, max-w-[720px] mx-auto,
px-20 py-16, line-height 1.7. If mirrored: `style={{ transform: 'scaleX(-1)' }}`.

Tap anywhere on text: toggle scrolling.

Controls bar: fixed bottom, bg-black/80, backdrop-blur, always visible.
- Speed slider (1-10, label "Speed")
- A- / A+ buttons (font size)
- Mirror toggle button
- Pause/Resume button (coral when paused)
- Done button (link back to /library)

Auto-scroll: `requestAnimationFrame` loop.
Speed scale: 1 -> 0.3 px/frame, 10 -> 3.0 px/frame. Linear interpolation.

Page `<head>` must include:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
```
This prevents iOS pinch-zoom from breaking the layout mid-recording.

All logic is client-side. No API calls after initial script load.
Works offline: once the script is in state, disabling network doesn't affect it.

---

## PHASE 12: /calendar

### `app/(dashboard)/calendar/page.tsx`

View toggle: Month | Week. Default: Month.
Fetch all posts with scheduled_date in the visible date range.

### `components/calendar/CalendarGrid.tsx`

7-column grid (Mon-Sun header). Each day: date number + post chips.
Post chips: small pill, pillar color background, truncated title.
Click chip: open PostEditorDrawer.
Click empty cell: "Schedule a post" picker (select from unscheduled backlog).

### `components/calendar/CalendarBacklog.tsx`

Right sidebar (desktop only, 280px). "Unscheduled" header.
All posts with scheduled_date = null and status != 'posted'.
Each post draggable via @hello-pangea/dnd.
Drop target: any calendar day cell.
On drop: optimistic update UI + PATCH /api/posts/[id] with { scheduled_date }.

"Fill This Week" button calls /api/generate:
```
Anirudh's pillar posting preferences: [from user_settings pillar_weights]
Unscheduled posts available: [list of id, title, pillar]
Already scheduled this week: [list of title, pillar, date]

Suggest which unscheduled post to schedule on which remaining day this week
for the best pillar balance and posting rhythm.
Return ONLY a JSON array, no other text:
[{ "post_id": "uuid", "date": "YYYY-MM-DD" }, ...]
```

Parse the JSON. Apply scheduled_date to each post via PATCH /api/posts/[id].
Show a toast summary ("Scheduled 3 posts for this week.").

---

## PHASE 13: /story-bank

### `app/(dashboard)/story-bank/page.tsx`

Header: "Story Bank" + filter toggle (All / Unused / Used) + "Mine a Story" button
(links to /generate with Story Mine tab pre-selected via ?tab=story-mine).

### `components/story-bank/StoryGrid.tsx`

Card grid. Each StoryCard:
- Raw memory (first 100 chars, muted, italic)
- Pillar badge (if mined)
- Mined angle (full text, normal weight)
- "Used" badge (green) or "Unused" badge (muted)
- Actions: "Convert to Post" / "Re-mine" / delete icon

Click rest of card: expand to full mined output (hook, script, caption line,
platform fit).

"Convert to Post": POST /api/posts pre-filled with mined script + pillar,
redirect to /library with editor open on new post.

"Re-mine": call /api/generate with the same Story Mine prompt on raw_memory,
PATCH /api/story-bank/[id] with new mined fields.

---

## PHASE 14: /ideas

### `app/(dashboard)/ideas/page.tsx`

Top: inline capture form (no modal).
- Large text input (autofocus, full width)
- Pillar dropdown (compact, inline)
- Priority pills: Low / Medium / High
- Enter key or "Add" button saves via POST /api/ideas

List below sorted by priority (high first) then created_at desc.

### `components/ideas/IdeaRow.tsx`

Row: priority dot (coral=high, yellow=medium, muted=low) + pillar badge +
idea text (inline editable on click) + "Convert to Script" button +
converted checkmark toggle + delete button.

"Convert to Script": POST /api/generate using the pillar's script prompt with the
idea as the topic. Open result in a slide-in panel on the right.
On save: PATCH /api/ideas/[id] with { converted: true }.

---

## PHASE 15: /series

### `app/(dashboard)/series/page.tsx`

List of series cards + "Create Series" button.

Each series card: name (Syne) + pillar badge + progress bar (parts assigned /
total_parts) + click to expand SeriesPostList.

"Create Series" opens the SeriesPlanner component (Tab 8) in a modal.

### `components/series/SeriesPostList.tsx`

Ordered list of posts assigned to this series (by series_position).
Each row: position number + post title + status badge.
Draggable to reorder (updates series_position via PATCH /api/posts/[id]).
"Add Part" button: post picker dropdown to assign existing post.
"Create New Part" button: navigates to /generate with Script tab + pillar pre-set.

---

## PHASE 16: /analytics

### `app/(dashboard)/analytics/page.tsx`

Four sections on one scrollable page.

### SECTION 1 -- Log Performance

Dropdown: select a posted post (GET /api/posts?status=posted).
On select: show input fields for views, likes, saves, comments, shares,
follows_gained. "Save" button. PATCH /api/posts/[id].
Success: toast "Logged." + fields reset.

### SECTION 2 -- Performance Overview

Fetch last 30 posted posts with performance data via GET /api/analytics.

recharts components (all dark-themed: bg-[#13100E], muted grid, white axis labels):
- BarChart: views per post. x = truncated title. Coral bars.
- BarChart: saves per post. Yellow bars.
- LineChart: follows_gained over posted_date. Green line, dots at each point.
- Pillar Breakdown table: pillar / avg views / avg saves / post count.
  Sorted by avg_saves desc.
- Top 5 by saves: list with title + saves count + pillar badge.

recharts tooltip: dark bg (#0C0A09), border #2A2218, white text.

### SECTION 3 -- Weekly Review

Check GET /api/weekly-reviews?week_start=[this Monday's date].
If no record: show prompt card "Time for your weekly review." + "Start Review" button.
If record exists: show filled review + "Edit" button.

Form fields:
- posts_published (number)
- total_views (number)
- total_followers_gained (number)
- top_post (dropdown of posted posts)
- what_worked (textarea)
- what_to_double_down (textarea)
- what_to_cut (textarea)
- next_week_focus (textarea)
- "Analyze My Week" button

"Analyze My Week" collects week's posts + stats, calls /api/generate:
```
Here is Anirudh's content performance data for the past week:
[posts: title, pillar, views, likes, saves, comments, follows_gained]
Weekly totals: [total views, total follows, posts published]
Top post: [title + stats]

Give 3 specific, blunt recommendations based on what the numbers show.
1. What pillar is underperforming and a specific reason why.
2. What to post more of based on saves specifically (saves = algorithm signal).
3. One thing to cut or change immediately.
No fluff. No encouragement. Just what the data says. No em dashes.
```

### SECTION 4 -- Hashtag Vault

List from GET /api/hashtag-sets.
Each row: set name / pillar badge / use count / first 5 tags preview.
Actions: Copy all / Edit inline / Delete.

"Analyze" per set calls /api/generate:
```
Analyze this hashtag set for Instagram effectiveness.
TAGS: [tags]
PILLAR: [pillar]
Give me: 3 tags to keep (specific, niche, lower competition), 3 to cut (too broad or saturated), 2 replacement suggestions. Direct. No em dashes.
```

---

## PHASE 17: /settings

### `app/(dashboard)/settings/page.tsx`

Five sections on one scrollable page.

### SECTION 1 -- Context Editor

Large textarea (20 rows).
Label: "Personal context additions."
Helper (muted): "Update this when Ada hits a milestone, when you move to SF,
when you launch something. The AI reads this on every generation call."
Load via GET /api/settings?key=context_additions.
Autosave on blur via POST /api/settings. Toast "Saved." on success.

### SECTION 2 -- Pillar Weights

6 range sliders (0-7, step 1), one per pillar. Default 1 each.
Save as POST /api/settings key='pillar_weights' value=JSON.
Used by "Fill This Week" on the calendar.

### SECTION 3 -- Weekly Schedule Template

7 rows (Mon-Sun). Each: day name + pillar dropdown.
Save as POST /api/settings key='weekly_template' value=JSON.

### SECTION 4 -- Platform Defaults

Default platform dropdown (instagram default).
Save via POST /api/settings key='default_platform'.

### SECTION 5 -- Profile Bio Generator

"Generate Platform Bios" button. POST /api/generate with:
```
Write optimized profile bios for Anirudh Manjesh for Instagram, LinkedIn, X (Twitter), and Threads.
Character limits: Instagram 150, LinkedIn 220, X 160, Threads 150.
Bio must convey: CS founder + researcher + 36 hackathons + Ada (tryada.app) + heading to SF.
Voice: punchy, specific, no fluff, no em dashes. No generic phrases like "passionate about" or "building the future."
Return each labeled with platform and character count.
```

Output: 4 bio blocks, each with platform label + character count + CopyButton.

---

## PHASE 18: UI PRIMITIVES

Build all `components/ui/` files completely before any page uses them.

### Button.tsx
```
variants: primary (coral bg), secondary (surface bg + border), ghost, danger, yellow (yellow bg black text)
sizes: sm, md, lg
props: loading (shows Spinner, disables button), disabled
```

### Badge.tsx
```
Accepts variant string matching pillar names or status names.
Also: 'outline' variant.
```

### Modal.tsx
```
Centered overlay. bg-surface. rounded-xl. max-w-lg.
Props: isOpen, onClose, title, children.
Closes on overlay click and Escape key.
Focus trap when open.
```

### Drawer.tsx
```
Slides from right. Full height. 480px desktop. Full-screen mobile.
Same close behavior as Modal.
```

### Skeleton.tsx
```
Animated pulse. bg-[#2A2218].
Variants: line (w/h props), card (full box with rounded corners), stat (for dashboard stat cards).
```

### CopyButton.tsx
```
Copies text to clipboard.
Default: "Copy" label. After copy: "Copied!" for 2s then resets.
sizes: sm, md.
```

### Toast.tsx
```
Fixed bottom-right. bg-surface. border-border.
Types: success (green left border), error (coral left border), info (muted left border).
Auto-dismisses after 3s. Manual X close.
Implement as context (ToastProvider) + useToast() hook.
Wrap app/(dashboard)/layout.tsx with ToastProvider.
```

### Tabs.tsx
```
Pill buttons in a row. Active: coral underline + coral text.
Props: tabs: Array<{ label: string; value: string }>, value, onChange.
Scrollable horizontally on mobile if tabs overflow.
```

---

## PHASE 19: MOBILE + RESPONSIVENESS PASS

After all pages are built, test every page at 390px viewport width.

Checklist:
- [ ] Sidebar hidden, BottomBar visible on all protected pages
- [ ] No horizontal scroll on any page at 390px
- [ ] All inputs/buttons have minimum 44px tap target height
- [ ] Generate tab pills scroll horizontally if they overflow (no wrap breaking layout)
- [ ] PostEditorDrawer is full-screen on mobile
- [ ] Calendar on mobile shows a list view, not the grid (grid is unreadable at 390px)
- [ ] Charts are horizontally scrollable in a container wrapper
- [ ] Teleprompter tested at 390x844 (iPhone 14 Pro dimensions)
- [ ] All form rows stack to single column at sm: breakpoint

---

## PHASE 20: QUALITY PASS (gstack)

Run gstack `/review` across the full codebase. Resolve all issues before shipping.

Focus areas:
1. Every API route -- getAuthenticatedUser() is the first call. 401 if null.
2. No ANTHROPIC_API_KEY or INSFORGE_SECRET_KEY in any client component or client lib.
3. No `any` types in lib/, api routes, or component props.
4. All loading states covered with skeletons or spinners.
5. All form errors shown inline (never browser alert()).
6. Optimistic UI on post status changes (update UI first, revert on error).
7. Toast on every save, delete, and update action.
8. All textareas autoresize or have scroll -- no content clipping.

---

## PHASE 21: SECURITY PASS (gstack)

Run gstack `/cso`. Resolve all findings.

Manual verification:
```bash
# No Anthropic key in client code
grep -rn "ANTHROPIC_API_KEY" components/ app/\(dashboard\)/
# Must return ZERO results

# No InsForge secret key in client code
grep -rn "INSFORGE_SECRET_KEY" components/ app/\(dashboard\)/
# Must return ZERO results

# No em dashes (Unicode U+2014) anywhere
grep -rn $'\xe2\x80\x94' app/ components/ lib/ db/ public/
# Must return ZERO results

# Ada never called "assistant"
grep -rn '"AI assistant"' app/ components/ lib/
# Must return ZERO results

# InsForge access control -- verify in InsForge dashboard directly
# Confirm all 7 tables show access control policies as active
```

---

## PHASE 22: DEPLOYMENT

### Deploy via InsForge

```bash
# Authenticate InsForge CLI
insforge login

# Set production environment variables
insforge env set ANTHROPIC_API_KEY=your_key
insforge env set INSFORGE_SECRET_KEY=your_key
insforge env set INSFORGE_PROJECT_ID=your_project_id
insforge env set NEXT_PUBLIC_INSFORGE_PROJECT_ID=your_project_id

# Deploy
insforge deploy --prod

# Verify deployment
insforge status
```

After deployment:
- Confirm the live URL loads /login correctly
- Sign in and verify /dashboard loads with no errors
- Test Generate tab: run one script generation, confirm response appears
- Test the teleprompter at the live URL on a real iOS device

If InsForge deployment uses a different CLI command structure than shown above,
check InsForge docs and adjust. The deploy step is always the last thing before
calling the build complete.

---

## PHASE 23: README

### `README.md`

```markdown
# Dispatch

Private content planning and generation app for Anirudh Manjesh.

## Stack

Next.js 14 (App Router), InsForge (auth + Postgres), Anthropic Claude API, Tailwind CSS.

## Setup

### 1. Create InsForge project

Go to the InsForge dashboard, create a new project, and copy your API key and project ID.

### 2. Apply database schema

```bash
insforge db apply --file db/schema.sql
```

Then go to the InsForge dashboard and configure access control on all 7 tables
so each row is scoped to the authenticated user.

### 3. Create your user

```bash
insforge auth create-user --email your@email.com --password yourpassword
```

### 4. Environment variables

Create `.env.local`:
```
INSFORGE_API_KEY=your_api_key
INSFORGE_PROJECT_ID=your_project_id
INSFORGE_SECRET_KEY=your_secret_key
ANTHROPIC_API_KEY=your_anthropic_key
NEXT_PUBLIC_INSFORGE_PROJECT_ID=your_project_id
```

### 5. Install and run

```bash
npm install
npm run dev
```

Open http://localhost:3000 and sign in.

### 6. Deploy

```bash
insforge deploy --prod
```

Set all 5 environment variables via `insforge env set` before deploying.
```

---

## PHASE 24: SHIP (gstack)

Run gstack `/ship`:

Branch: `main`
Commit title: `feat: Dispatch v1.0.0`
Commit message:
- Private content OS for Anirudh Manjesh
- Backend: InsForge (auth + Postgres, access control on all 7 tables)
- Generate: 8 AI tools via Claude claude-sonnet-4-20250514 (script, story mine, caption,
  hooks, repurpose, trend, replies, series)
- Library: post CRM with editor drawer, status pipeline, performance logging
- Calendar: monthly view, drag-and-drop scheduling, AI fill-this-week
- Story Bank: mine raw memories into content angles
- Ideas: quick capture backlog with convert-to-script
- Series: multi-part content management with progress tracking
- Analytics: manual performance logging, recharts charts, AI weekly review
- Teleprompter: full-screen, offline-capable, auto-scroll, mirror mode
- Settings: context editor, pillar weights, schedule template, bio generator
- No Supabase anywhere -- InsForge only
- No em dashes in any file

---

## DEFINITION OF DONE

Do not consider this build complete until every item below is checked.
Use grep and live browser testing to verify. Do not assume.

### AUTH
- [ ] /login renders and sign-in works end to end
- [ ] All protected routes redirect to /login when not authenticated
- [ ] Visiting /login while authenticated redirects to /dashboard
- [ ] Sign out clears session and returns to /login

### API SECURITY
- [ ] `grep -rn "ANTHROPIC_API_KEY" components/ app/\(dashboard\)/` returns ZERO
- [ ] `grep -rn "INSFORGE_SECRET_KEY" components/ app/\(dashboard\)/` returns ZERO
- [ ] Every API route tested unauthenticated with curl -- all return 401
- [ ] All InsForge queries in API routes filter by user_id = user.id

### DATABASE
- [ ] All 7 tables exist in InsForge dashboard
- [ ] Access control active on all 7 tables (visible in InsForge dashboard)

### EM DASHES
- [ ] `grep -rn $'\xe2\x80\x94' app/ components/ lib/ db/ public/` returns ZERO
- [ ] All 8 AI prompts manually checked for em dashes
- [ ] AI outputs tested in browser -- none contain em dashes

### GENERATE PAGE
- [ ] All 8 tabs render and switch without errors
- [ ] All 8 tabs send correct prompts (check Network tab in DevTools)
- [ ] All outputs show skeleton while loading
- [ ] All Copy buttons work
- [ ] Save to Library creates a post

### LIBRARY
- [ ] Card view + table view both render
- [ ] All filters (pillar, platform, status) work
- [ ] PostEditorDrawer opens on click
- [ ] Status pipeline advances correctly
- [ ] PerformanceModal appears when status set to "posted"
- [ ] Regenerate Caption and Regenerate Hook work from inside the drawer

### TELEPROMPTER
- [ ] Loads post script from ?postId= param
- [ ] Manual paste mode works
- [ ] Auto-scroll starts and stops on tap
- [ ] Speed slider visibly changes scroll speed
- [ ] Mirror mode flips text horizontally
- [ ] Works with network disabled in DevTools after initial load

### CALENDAR
- [ ] Monthly view shows posts on correct dates
- [ ] Drag from backlog to a date updates scheduled_date
- [ ] "Fill This Week" calls AI, parses JSON, updates post dates

### STORY BANK
- [ ] Mine It calls correct prompt and returns output
- [ ] Save to Story Bank stores raw_memory + mined output
- [ ] Re-mine re-runs AI on the same raw_memory
- [ ] Convert to Post creates post and navigates to library

### ANALYTICS
- [ ] Log Performance updates post record
- [ ] All 4 recharts components render with real data
- [ ] Weekly review saves and reloads correctly
- [ ] Analyze My Week calls AI and renders output

### SETTINGS
- [ ] Context additions save and load correctly
- [ ] Pillar weights save and are used by Fill This Week
- [ ] Bio generator calls AI and renders 4 bios with character counts

### MOBILE
- [ ] Bottom bar visible at 390px, sidebar hidden
- [ ] No horizontal scroll on any page
- [ ] Teleprompter works on real iOS Safari
- [ ] PostEditorDrawer is full-screen on mobile
- [ ] All interactive elements have >= 44px tap target height

### BUILD + DEPLOY
- [ ] `npm run build` exits 0
- [ ] `npx tsc --noEmit` exits 0
- [ ] No console errors on any page in production build
- [ ] Live InsForge deployment URL loads /login successfully
- [ ] Sign-in works on the live deployment

---

## HARD CONSTRAINTS

These cannot be violated. Verify before calling the build done.

1. NO EM DASHES. Not in UI copy, comments, AI prompts, strings, or docs.
   Verify: `grep -rn $'\xe2\x80\x94' .` returns ZERO results.

2. NO SECRET KEYS IN CLIENT CODE. ANTHROPIC_API_KEY and INSFORGE_SECRET_KEY
   must only appear in app/api/ and lib/claude.ts and lib/insforge/server.ts.
   Verify: grep both keys against components/ and app/(dashboard)/.

3. INSFORGE ONLY. No Supabase package, no Supabase client, no Supabase URL,
   no @supabase/* imports anywhere in the codebase.
   Verify: `grep -rn "supabase" package.json lib/ app/ components/` returns ZERO.

4. ADA IS A SECRETARY. "assistant" must never describe Ada.
   Verify: `grep -rn '"AI assistant"' app/ components/ lib/` returns ZERO.

5. TELEPROMPTER WORKS OFFLINE. Load it, disable network in DevTools, confirm
   the scroll still works. No API calls in reader mode.

6. AUTH CHECK IS FIRST. Every route.ts file: getAuthenticatedUser() is called
   before any database query. Read each route file top to bottom to confirm.

7. ACCESS CONTROL ON ALL 7 TABLES. Verify in the InsForge dashboard directly.
   Tables: posts, story_bank, content_ideas, series, hashtag_sets,
   weekly_reviews, user_settings.

---

Start with Tool Setup. Build every phase in order. Do not stop.
