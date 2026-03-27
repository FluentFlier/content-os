# Content OS Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-stack personal content OS for planning, generating, tracking, and optimizing Instagram content with cross-posting support.

**Architecture:** Next.js 14 App Router with Supabase (auth + Postgres), Anthropic Claude API for AI generation, Tailwind CSS for styling. Single-user app behind auth. All AI calls proxied through Next.js API routes. Charts via Recharts, drag-and-drop via @hello-pangea/dnd.

**Tech Stack:** Next.js 14, TypeScript, Supabase (auth + DB), Anthropic SDK, Tailwind CSS, Recharts, @hello-pangea/dnd, Google Fonts (Syne + Space Grotesk)

---

## Phase 1: Foundation (Tasks 1-5)

### Task 1: Initialize Next.js Project + Dependencies

**Files:**
- Create: `package.json` (via create-next-app)
- Create: `tailwind.config.ts`
- Create: `.env.example`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`

**Step 1: Scaffold Next.js 14 with TypeScript + Tailwind**

```bash
cd /Users/anirudhmanjesh/hackathons/content-os
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

**Step 2: Install all dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk recharts @hello-pangea/dnd lucide-react
npm install -D @types/node
```

**Step 3: Create .env.example**

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

**Step 4: Configure Tailwind with brand colors and fonts**

Update `tailwind.config.ts` with the full brand palette:
- Background: `#0C0A09`, Surface: `#13100E`, Border: `#2A2218`
- Text: `#FAF6F1` (primary), `#5A5047` (muted)
- Accents: coral `#EB5E55`, yellow `#F5C842`, green `#5CB85C`, purple `#C77DFF`, blue `#4D96FF`
- Font families: Syne (headings), Space Grotesk (body)

**Step 5: Set up globals.css with Google Fonts import and base styles**

Import Syne (700, 800) and Space Grotesk (400, 500, 600) from Google Fonts.
Set body background to `#0C0A09`, text to `#FAF6F1`, font to Space Grotesk.

**Step 6: Set up root layout.tsx**

Minimal layout with metadata, font links, and body wrapper.

**Step 7: Verify it runs**

```bash
npm run dev
```
Expected: App starts on localhost:3000

**Step 8: Commit**

```bash
git add -A && git commit -m "feat: initialize Next.js 14 project with brand theme"
```

---

### Task 2: Supabase Schema

**Files:**
- Create: `supabase/schema.sql`

**Step 1: Write complete schema SQL**

All 7 tables from PRD with exact columns, types, defaults, foreign keys:
- `posts` (18 columns + timestamps)
- `story_bank` (11 columns)
- `content_ideas` (7 columns)
- `series` (6 columns)
- `hashtag_sets` (7 columns)
- `weekly_reviews` (11 columns)
- `user_settings` (5 columns)

Enable RLS on all tables. Create policies: each user can only CRUD rows where `user_id = auth.uid()`.

Add `updated_at` trigger function for auto-updating timestamps.

**Step 2: Commit**

```bash
git add supabase/schema.sql && git commit -m "feat: add Supabase schema with RLS policies"
```

---

### Task 3: Supabase Client Libraries

**Files:**
- Create: `src/lib/supabase/client.ts` (browser client)
- Create: `src/lib/supabase/server.ts` (server client with cookies)
- Create: `src/lib/supabase/middleware.ts` (auth middleware helper)
- Create: `src/types/database.ts` (TypeScript types for all tables)

**Step 1: Create browser Supabase client**

Uses `@supabase/ssr` `createBrowserClient` with env vars.

**Step 2: Create server Supabase client**

Uses `@supabase/ssr` `createServerClient` with Next.js cookies.

**Step 3: Create middleware helper**

For refreshing auth tokens on each request.

**Step 4: Create TypeScript types**

Define interfaces for all 7 tables matching the schema exactly. Include `Database` type for Supabase client generic.

**Step 5: Commit**

```bash
git add src/lib/supabase src/types && git commit -m "feat: add Supabase client libs and database types"
```

---

### Task 4: Claude API Client + /api/generate Route

**Files:**
- Create: `src/lib/claude.ts` (system prompt + API helper)
- Create: `src/app/api/generate/route.ts` (POST handler)

**Step 1: Create claude.ts with base system prompt**

Store the full system prompt from PRD (lines 43-73). Export function `generateContent(prompt: string, contextAdditions?: string)` that:
1. Builds system prompt = base + contextAdditions
2. Calls Claude claude-sonnet-4-20250514 via Anthropic SDK
3. Returns text response

**Step 2: Create /api/generate route**

POST handler that:
1. Extracts Supabase session from request (return 401 if none)
2. Reads `context_additions` from `user_settings` table for this user
3. Calls `generateContent(body.prompt, contextAdditions)`
4. Returns `{ text: string }`

**Step 3: Verify route exists**

```bash
curl -X POST http://localhost:3000/api/generate -H "Content-Type: application/json" -d '{"prompt":"test"}'
```
Expected: 401 (no session)

**Step 4: Commit**

```bash
git add src/lib/claude.ts src/app/api/generate && git commit -m "feat: add Claude API client and /api/generate route"
```

---

### Task 5: Auth Middleware + Login Page

**Files:**
- Create: `src/middleware.ts` (Next.js middleware)
- Create: `src/app/login/page.tsx`
- Create: `src/app/page.tsx` (root redirect)

**Step 1: Create middleware.ts**

Protect all `/dashboard/*` routes. If no session, redirect to `/login`. If session exists on `/login`, redirect to `/dashboard`.

**Step 2: Create login page**

Dark themed login form matching brand:
- "CONTENT OS" in Syne heading
- Email + password fields
- Submit button with coral accent
- Supabase `signInWithPassword` on submit
- Error display
- No registration (single user app)

**Step 3: Create root page**

`/` checks session: if logged in redirect to `/dashboard`, else to `/login`.

**Step 4: Verify auth flow works**

Test: visit `/dashboard` without session -> redirected to `/login`.

**Step 5: Commit**

```bash
git add src/middleware.ts src/app/login src/app/page.tsx && git commit -m "feat: add auth middleware and login page"
```

---

## Phase 2: Layout + Dashboard (Tasks 6-7)

### Task 6: App Layout with Sidebar/Bottom Nav

**Files:**
- Create: `src/app/dashboard/layout.tsx`
- Create: `src/components/sidebar.tsx`
- Create: `src/components/mobile-nav.tsx`

**Step 1: Create sidebar component**

Left sidebar for desktop (hidden on mobile):
- "CONTENT OS" in Syne at top
- "Anirudh / tryada.app" small text below
- Nav items with Lucide icons: Dashboard (Home), Generate (Wand2), Library (LayoutGrid), Calendar (Calendar), Story Bank (Archive), Ideas (Lightbulb), Series (Layers), Analytics (BarChart3), Settings (Settings)
- Active item highlighted with coral `#EB5E55`
- Surface background `#13100E`, border `#2A2218`

**Step 2: Create mobile bottom nav**

Bottom bar on mobile (hidden on desktop). Same nav items, icon-only with labels below.

**Step 3: Create dashboard layout**

Wraps all `/dashboard/*` pages. Shows sidebar on desktop, bottom nav on mobile. Main content area with proper padding.

**Step 4: Commit**

```bash
git add src/app/dashboard/layout.tsx src/components && git commit -m "feat: add responsive layout with sidebar and mobile nav"
```

---

### Task 7: Dashboard Page

**Files:**
- Create: `src/app/dashboard/page.tsx`
- Create: `src/components/dashboard/stats-row.tsx`
- Create: `src/components/dashboard/up-next.tsx`
- Create: `src/components/dashboard/todays-prompt.tsx`
- Create: `src/components/dashboard/backlog-preview.tsx`
- Create: `src/components/dashboard/quick-actions.tsx`
- Create: `src/components/dashboard/recent-activity.tsx`

**Step 1: Build stats row**

4 stat cards: Posts this week / In pipeline / Total posted / Streak. Query from `posts` table.

**Step 2: Build "Up Next" card**

Next 3 scheduled posts with date, pillar color dot, status badge.

**Step 3: Build "Today's Prompt"**

AI-generated content idea. Calls `/api/generate` with current week's schedule to find gaps. Refresh button.

**Step 4: Build backlog preview**

Top 3 ideas by priority from `content_ideas`.

**Step 5: Build quick actions**

4 buttons: Generate Script, Mine a Story, Log a Post, Add Idea. Link to respective pages.

**Step 6: Build recent activity**

Last 5 posts modified with status badges.

**Step 7: Compose dashboard page**

Greeting "What are we building today?" in Syne. All components in responsive grid.

**Step 8: Commit**

```bash
git add src/app/dashboard/page.tsx src/components/dashboard && git commit -m "feat: add dashboard with stats, up next, and AI prompt"
```

---

## Phase 3: Generate Page - 8 Tabs (Tasks 8-9)

### Task 8: Generate Page Shell + Tabs 1-4

**Files:**
- Create: `src/app/dashboard/generate/page.tsx`
- Create: `src/components/generate/script-generator.tsx` (Tab 1)
- Create: `src/components/generate/story-mine.tsx` (Tab 2)
- Create: `src/components/generate/caption-hashtags.tsx` (Tab 3)
- Create: `src/components/generate/hook-generator.tsx` (Tab 4)
- Create: `src/components/ui/tab-bar.tsx`
- Create: `src/components/ui/output-box.tsx` (formatted output + copy + save)
- Create: `src/components/ui/copy-button.tsx`
- Create: `src/components/ui/save-to-library-modal.tsx`
- Create: `src/lib/prompts.ts` (all AI prompt templates from PRD)

**Step 1: Create prompts.ts**

All 6 pillar prompts (hot-take, hackathon, founder, explainer, origin, research) plus story mine, caption, hook generator prompts. Exact text from PRD.

**Step 2: Create shared UI components**

- TabBar: 8 tab pills with active state
- OutputBox: formatted result display with skeleton loading
- CopyButton: click-to-copy with feedback
- SaveToLibraryModal: title, platform dropdown, status (default scripted), save to `posts` table

**Step 3: Build Tab 1 - Script Generator**

Pillar selector (6 pill buttons with pillar colors). Optional topic input. "Generate Script" button. Calls `/api/generate` with the pillar-specific prompt. Output in OutputBox.

**Step 4: Build Tab 2 - Story Mine**

Large textarea with helper text. "Mine It" yellow button. AI prompt from PRD. Save to `story_bank`. "Convert to Post" pre-fills script tab.

**Step 5: Build Tab 3 - Caption + Hashtags**

Textarea for script. Toggle: saved hashtag set / generate fresh. Dropdown of saved sets from `hashtag_sets`. Output: caption + hashtags. Option to save hashtag set.

**Step 6: Build Tab 4 - Hook Generator**

Optional topic input. "Generate 8 Hooks" button. Each hook gets its own copy button.

**Step 7: Commit**

```bash
git add src/app/dashboard/generate src/components/generate src/components/ui src/lib/prompts.ts && git commit -m "feat: add generate page with script, story mine, caption, and hook tabs"
```

---

### Task 9: Generate Tabs 5-8

**Files:**
- Create: `src/components/generate/repurpose.tsx` (Tab 5)
- Create: `src/components/generate/trend-catcher.tsx` (Tab 6)
- Create: `src/components/generate/comment-replies.tsx` (Tab 7)
- Create: `src/components/generate/series-planner.tsx` (Tab 8)

**Step 1: Build Tab 5 - Repurpose**

Textarea (paste script). From/To platform selectors. "Repurpose" button. AI adapts content for target platform.

**Step 2: Build Tab 6 - Trend Catcher**

Textarea for trending topic. "Find My Angle" button. AI returns angle, connection, hook, script outline, CTA, and things to avoid.

**Step 3: Build Tab 7 - Comment Replies**

Textarea (paste 5-10 comments). "Generate Replies" button. Each reply labeled and has its own copy button.

**Step 4: Build Tab 8 - Series Planner**

Input for series concept. Number of parts (2-10). "Plan Series" button. AI generates multi-part plan. Save series to DB with linked posts.

**Step 5: Commit**

```bash
git add src/components/generate && git commit -m "feat: add repurpose, trend catcher, comment replies, and series planner tabs"
```

---

## Phase 4: Library + Teleprompter (Tasks 10-11)

### Task 10: Library Page with Editor

**Files:**
- Create: `src/app/dashboard/library/page.tsx`
- Create: `src/components/library/post-card.tsx`
- Create: `src/components/library/post-editor.tsx`
- Create: `src/components/library/filters.tsx`
- Create: `src/components/ui/status-badge.tsx`
- Create: `src/components/ui/pillar-badge.tsx`

**Step 1: Build filter bar**

Filters: pillar, platform, status, series, date range. Search by title/script content.

**Step 2: Build post card**

Title, pillar color dot, platform badge, status badge, scheduled date, script preview (120 chars), performance stats if logged.

**Step 3: Build post editor drawer**

Slide-out panel with all post fields. Action buttons: Regenerate Caption, Regenerate Hook, Repurpose, Open Teleprompter. Status pipeline with click-to-advance. When set to "posted": prompt for posted_date and stats.

**Step 4: Build library page**

Card view (default) and table view toggle. "New Post" button. Bulk actions.

Status badge colors: idea=muted, scripted=blue, filmed=yellow, edited=coral, posted=green.

**Step 5: Commit**

```bash
git add src/app/dashboard/library src/components/library src/components/ui && git commit -m "feat: add library page with card view, filters, and editor drawer"
```

---

### Task 11: Teleprompter Page

**Files:**
- Create: `src/app/teleprompter/page.tsx`

**Step 1: Build teleprompter**

Full-screen mode:
- Large text (Syne, 28-36px, white on black)
- Auto-scroll with adjustable speed (slider 1-10)
- Tap to pause/resume
- Mirror mode toggle (CSS `transform: scaleX(-1)`)
- Font size +/- controls
- Scroll position % bar at top
- "Done" button to exit
- Loads from `?postId=` query param or manual paste mode

**Step 2: Add service worker for offline support**

Register service worker that caches the teleprompter page and its assets.

**Step 3: Commit**

```bash
git add src/app/teleprompter && git commit -m "feat: add teleprompter with auto-scroll, mirror mode, and offline support"
```

---

## Phase 5: Calendar + Story Bank + Ideas (Tasks 12-14)

### Task 12: Calendar Page

**Files:**
- Create: `src/app/dashboard/calendar/page.tsx`
- Create: `src/components/calendar/month-view.tsx`
- Create: `src/components/calendar/week-view.tsx`
- Create: `src/components/calendar/backlog-sidebar.tsx`

**Step 1: Build month view**

Monthly grid. Posts with `scheduled_date` shown as colored chips (pillar color). Click date to see/add posts. Empty dates show "Schedule a post" action.

**Step 2: Build week view toggle**

7-column week layout, same chip display.

**Step 3: Build backlog sidebar**

Unscheduled posts in sidebar. Draggable onto calendar dates using @hello-pangea/dnd.

**Step 4: Build "Fill This Week" button**

AI call that takes backlog posts + pillar balance rules and suggests scheduling.

**Step 5: Commit**

```bash
git add src/app/dashboard/calendar src/components/calendar && git commit -m "feat: add calendar with month/week views and drag-from-backlog"
```

---

### Task 13: Story Bank Page

**Files:**
- Create: `src/app/dashboard/story-bank/page.tsx`
- Create: `src/components/story-bank/story-card.tsx`

**Step 1: Build story bank page**

Grid of Story Mine entries. Card shows: raw memory (100 chars), mined angle, pillar badge, used/unused toggle. Filter: all/unused/used. Click to expand. "Convert to Post" and "Re-mine" buttons. Delete.

**Step 2: Commit**

```bash
git add src/app/dashboard/story-bank src/components/story-bank && git commit -m "feat: add story bank page"
```

---

### Task 14: Ideas Page

**Files:**
- Create: `src/app/dashboard/ideas/page.tsx`

**Step 1: Build ideas page**

Top: input + pillar dropdown + priority selector + Enter to save. List sorted by priority then date. "Convert to Script" calls pillar AI. Inline edit, delete, toggle converted.

**Step 2: Commit**

```bash
git add src/app/dashboard/ideas && git commit -m "feat: add ideas page with quick capture"
```

---

## Phase 6: Series + Analytics + Settings (Tasks 15-17)

### Task 15: Series Page

**Files:**
- Create: `src/app/dashboard/series/page.tsx`
- Create: `src/components/series/series-detail.tsx`

**Step 1: Build series page**

Series list: name, pillar, total parts, assigned count. Click series: see posts in order with status. "Create Series" links to generate tab 8. Drag to reorder. Progress bar.

**Step 2: Commit**

```bash
git add src/app/dashboard/series src/components/series && git commit -m "feat: add series management page"
```

---

### Task 16: Analytics Page

**Files:**
- Create: `src/app/dashboard/analytics/page.tsx`
- Create: `src/components/analytics/performance-log.tsx`
- Create: `src/components/analytics/charts.tsx`
- Create: `src/components/analytics/weekly-review.tsx`
- Create: `src/components/analytics/hashtag-vault.tsx`

**Step 1: Build performance log section**

Dropdown of posted posts. Fields: views, likes, saves, comments, shares, follows_gained. Save updates post record.

**Step 2: Build charts section**

Using Recharts:
- Bar chart: views by post (last 30)
- Bar chart: saves by post
- Line chart: follows_gained over time
- Pillar breakdown: avg views per pillar
- Top 5 posts by saves

**Step 3: Build weekly review section**

Fields matching `weekly_reviews` schema. "Analyze My Week" AI button with exact prompt from PRD.

**Step 4: Build hashtag vault**

List saved sets with copy, use in post, create/edit/delete. "Analyze" AI button for tag optimization.

**Step 5: Commit**

```bash
git add src/app/dashboard/analytics src/components/analytics && git commit -m "feat: add analytics with charts, weekly review, and hashtag vault"
```

---

### Task 17: Settings Page

**Files:**
- Create: `src/app/dashboard/settings/page.tsx`

**Step 1: Build settings page**

5 sections:
1. Context Editor: textarea for personal context additions, saved to `user_settings`
2. Pillar Weights: sliders (1-7) per pillar for weekly frequency
3. Weekly Schedule Template: day-of-week pillar assignment dropdowns
4. Platform Defaults: default platform selector, cross-post reminder toggle
5. Profile Bio Generator: "Generate Platform Bios" button, AI generates 4 bios with char counts and copy buttons

**Step 2: Commit**

```bash
git add src/app/dashboard/settings && git commit -m "feat: add settings page with context editor and bio generator"
```

---

## Phase 7: Polish + Ship (Task 18)

### Task 18: Final Polish

**Files:**
- Modify: all files as needed

**Step 1: Em dash sweep**

Search entire codebase for em dashes (—) and remove/replace all.

**Step 2: Mobile responsiveness audit**

Test all pages at mobile viewport. Fix any layout breaks.

**Step 3: Loading states**

Ensure all AI calls show skeleton loading.

**Step 4: Error handling**

All forms display user-visible error messages.

**Step 5: Create README.md**

Per PRD: setup instructions for Supabase, env vars, install, dev, deploy.

**Step 6: Final commit**

```bash
git add -A && git commit -m "feat: final polish - mobile fixes, loading states, error handling, README"
```

---

## Summary

| Phase | Tasks | What It Delivers |
|-------|-------|-----------------|
| 1: Foundation | 1-5 | Project scaffold, DB schema, auth, API |
| 2: Layout + Dashboard | 6-7 | Navigation, dashboard with AI prompt |
| 3: Generate | 8-9 | All 8 AI generation tabs |
| 4: Library + Teleprompter | 10-11 | Content CRM, recording tool |
| 5: Calendar + Story Bank + Ideas | 12-14 | Scheduling, memory mining, idea capture |
| 6: Series + Analytics + Settings | 15-17 | Series mgmt, charts, config |
| 7: Polish | 18 | Mobile, loading, errors, README |

**Total: 18 tasks across 7 phases.**
