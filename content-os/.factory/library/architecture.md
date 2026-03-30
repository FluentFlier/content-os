# Architecture

## System Overview

Dispatch is a Next.js 14 App Router application using InsForge as a backend-as-a-service (PostgreSQL + Auth + Storage + AI). It is a content creation and management platform for individual creators.

## Tech Stack

- **Framework**: Next.js 14.2.21 with App Router, TypeScript strict mode
- **Styling**: Tailwind CSS 3.4 (DO NOT upgrade to v4), custom design tokens
- **Backend**: InsForge SDK (`@insforge/sdk`) for auth, database, storage, AI
- **AI**: Claude Sonnet via InsForge AI gateway (NOT direct Anthropic SDK)
- **Fonts**: Syne (headings/display), Space Grotesk (body)
- **Charts**: recharts (dynamic import)
- **DnD**: @hello-pangea/dnd (for calendar drag-and-drop)
- **Validation**: Zod
- **Video**: Remotion + @remotion/player (video composition and preview)
- **Social**: twitter-api-v2 (Twitter), REST APIs for LinkedIn/Instagram/Threads

## Directory Structure

```
src/
  app/
    page.tsx                    # Landing page (public)
    layout.tsx                  # Root layout (fonts, metadata)
    globals.css                 # CSS custom properties, base styles
    (auth)/
      login/page.tsx            # Login + signup
      layout.tsx                # Centered auth layout
    (dashboard)/
      layout.tsx                # Dashboard shell (sidebar, bottom bar, auth check)
      dashboard/page.tsx        # Home dashboard
      generate/page.tsx         # 8 AI generation tools (tabs)
      library/page.tsx          # Post CRUD with filters, editor drawer
      calendar/page.tsx         # Month/week calendar with scheduling
      story-bank/page.tsx       # Memory mining and management
      ideas/page.tsx            # Quick idea capture
      series/page.tsx           # Multi-part content series
      analytics/page.tsx        # Performance logging, charts, weekly review
      settings/page.tsx         # User profile, pillars, platform connections
      teleprompter/page.tsx     # Full-screen script reader
      onboarding/page.tsx       # New user setup flow
      video-studio/page.tsx     # Video editing (Remotion-based)
    api/
      generate/route.ts         # AI content generation
      posts/route.ts            # Post CRUD
      posts/[id]/route.ts       # Single post operations
      publish/route.ts          # Social media publishing
      social-accounts/          # OAuth connect/callback/management
      (other CRUD routes)
  components/
    ui/                         # Reusable primitives (Button, Badge, Modal, etc.)
    nav/                        # Sidebar + BottomBar
    generate/                   # 8 AI tool tab components
    library/                    # Post cards, editor drawer, publish panel
    calendar/                   # Calendar grid, backlog
    analytics/                  # Charts, forms
    teleprompter/               # Full-screen reader
    story-bank/                 # Story cards
    ideas/                      # Idea rows/forms
    series/                     # Series cards, post lists
    video-studio/               # Video editor, player, templates
  lib/
    insforge/
      client.ts                 # Browser-side InsForge client (auth only)
      server.ts                 # Server-side InsForge client (DB, auth check)
    claude.ts                   # AI generation via InsForge AI gateway
    constants.ts                # Pillars, statuses, platforms, colors
    types.ts                    # TypeScript interfaces
    utils.ts                    # cn(), date formatting, helpers
    platforms/                  # Social platform publish/profile clients
  types/
    database.ts                 # Extended types, creator profile
  middleware.ts                 # Route protection (cookie-based)
db/
  schema.sql                    # Full PostgreSQL DDL
```

## Data Flow

### Authentication
1. User logs in via InsForge Auth (email/password or OAuth)
2. `dispatch-token` cookie is set (httpOnly)
3. Middleware checks cookie on all protected routes
4. `getAuthenticatedUser()` validates token server-side
5. All API routes verify auth as first operation

### Content Generation
1. Client calls POST /api/generate with prompt
2. API route verifies auth, loads user's context_additions + content_pillars
3. Builds personalized system prompt dynamically
4. Calls Claude via InsForge AI gateway
5. Returns generated text to client

### Content Pipeline
Posts move through: idea -> scripted -> filmed -> edited -> posted
Each status change updates the post record via PATCH /api/posts/[id]

### Social Publishing
1. Users connect accounts via OAuth (or manual key entry)
2. Tokens stored in social_accounts table (encrypted)
3. Publish from PostEditorDrawer calls POST /api/publish
4. Route loads token, calls platform-specific publish function
5. On success, updates post status to "posted"

## Key Invariants

- All DB operations go through API routes (never direct client-side DB calls)
- API keys/secrets only accessed in server-side code (API routes, server components)
- User data scoped by user_id in all queries
- No em dashes anywhere in code, comments, UI copy, or AI prompts
- Tailwind CSS 3.4 only (no v4)
- Brand guide: light theme, warm backgrounds (#FAFAF8), Syne headings, Space Grotesk body
