# Architecture - Dispatch Content OS

## Overview
Dispatch is a Next.js 14 App Router application (TypeScript, Tailwind CSS 3.4) that serves as a content command center for creators. It uses InsForge as BaaS (database, auth, AI, storage).

## Core Components

### Authentication
- Google OAuth via InsForge SDK (`client.auth.signInWithOAuth`)
- Session token synced to `dispatch-token` httpOnly cookie via POST /api/auth
- Server-side auth: `getServerClient()` reads cookie, passes as `edgeFunctionToken`
- `getAuthenticatedUser()` helper used in all API routes for auth check
- Middleware at `src/middleware.ts` checks cookie on protected routes

### Database (via InsForge SDK)
- All DB operations go through InsForge SDK (`client.database.from('table')`)
- 9 tables: creator_profile, posts, series, story_bank, content_ideas, hashtag_sets, weekly_reviews, user_settings, social_accounts
- All tables scoped by user_id with row-level security
- Schema defined in `db/schema.sql`

### AI Generation
- Uses InsForge AI proxy: `client.ai.chat.completions.create()` with model `anthropic/claude-sonnet-4.5`
- `buildSystemPrompt()` in `src/lib/claude.ts` personalizes prompts from creator_profile
- Rate limited: 50 req/hr/user via in-memory store

### Social Media Integration
- 4 platforms: Twitter, LinkedIn, Instagram, Threads
- OAuth connect routes: `/api/social-accounts/connect/{platform}`
- OAuth callback routes: `/api/social-accounts/callback/{platform}`
- Platform clients: `src/lib/platforms/{twitter,linkedin,instagram,threads}.ts`
- Token encryption: AES-256-GCM via `src/lib/crypto.ts`
- Unified publish endpoint: `POST /api/publish`

### Content Pipeline
- Posts move through status pipeline: idea -> scripted -> filmed -> edited -> posted
- 8 AI generation tabs in /generate page
- Story Bank for raw memories that get mined for content angles
- Ideas backlog with priority and convert-to-script flow
- Series manager for multi-part content

## Directory Structure
```
src/
  app/
    (auth)/login/           -- Google OAuth login
    (dashboard)/            -- Protected layout (sidebar + bottombar)
      dashboard/            -- Stats, up next, AI prompt
      generate/             -- 8 AI generation tabs
      library/              -- Post CRUD with editor drawer
      calendar/             -- Month/week views with DnD
      story-bank/           -- Story mining
      ideas/                -- Idea backlog
      series/               -- Multi-part series
      analytics/            -- Performance charts
      settings/             -- Profile, pillars, connections
      teleprompter/         -- Full-screen script reader
      video-studio/         -- Video upload/preview
      onboarding/           -- 4-step new user setup
    api/                    -- 27+ API route files
  components/               -- Organized by feature area
  lib/
    insforge/client.ts      -- Browser SDK client
    insforge/server.ts      -- Server SDK client
    claude.ts               -- AI generation + prompt builder
    crypto.ts               -- AES-256-GCM token encrypt/decrypt
    platforms/              -- Platform-specific publish clients
    rate-limit.ts           -- In-memory rate limiter
    constants.ts            -- Pillars, statuses, platforms
    types.ts                -- TypeScript interfaces
```

## Key Patterns
- All API routes: `getAuthenticatedUser()` first, 401 if null, scope by user_id
- InsForge SDK returns `{data, error}` for all operations
- Database inserts use array format: `[{...}]`
- Styling: dark theme (#09090B, #18181B), Plus Jakarta Sans for display/headings, Inter for body
- No em dashes anywhere in code, UI, or AI prompts
- Components use lucide-react for icons
