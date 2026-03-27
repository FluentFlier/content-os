# Content OS -- Design Document

**Date:** 2026-03-27
**Status:** Approved

## Summary

Full-stack personal content OS for founder-led marketing. Create once, auto-optimize for Instagram (manual post), LinkedIn (API auto-post), and X/Twitter (API auto-post). InsForge for auth, database, and media storage. Claude API for all AI generation. First-time setup wizard for brand voice configuration.

## Architecture

- **Frontend:** Next.js 14 (App Router), Tailwind CSS, Syne + Space Grotesk fonts
- **Backend:** InsForge (auth, postgres, storage buckets)
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Platform APIs:** X API v2 (free tier, auto-post), LinkedIn API (free, auto-post)
- **Instagram:** Manual -- AI generates optimized version, user copies to post
- **Deployment:** Vercel

## Database Schema

### Existing tables (from PRD)
- posts, story_bank, content_ideas, series, hashtag_sets, weekly_reviews, user_settings

### New tables

**creator_profile** -- replaces hardcoded system prompt
- id, user_id, display_name, bio_facts, voice_description, voice_rules
- content_pillars jsonb (array of {name, color, description, promptTemplate})
- platform_config jsonb (enabled platforms, API keys)
- onboarding_complete boolean
- created_at, updated_at

**post_distributions** -- tracks cross-platform publishing
- id, post_id, platform, platform_post_id nullable
- optimized_caption, optimized_hashtags nullable
- status (draft | posted | failed), posted_at nullable
- metrics jsonb nullable
- created_at

**media_attachments** -- files linked to posts
- id, user_id, post_id nullable
- bucket_path, file_name, file_type, file_size
- created_at

## Pages

1. /login -- InsForge email/password auth
2. /onboarding -- Setup wizard (name, facts, voice, pillars, platforms)
3. /dashboard -- Stats, up next, today's prompt, quick actions
4. /generate -- 8 tabs (script, story mine, caption, hooks, repurpose, trend, comments, series planner)
5. /library -- Card/table view, filters, editor drawer with distribute panel
6. /teleprompter -- Full-screen, auto-scroll, mirror mode, offline
7. /calendar -- Month/week, drag-drop backlog, AI fill week
8. /story-bank -- Mined stories grid, convert to post
9. /ideas -- Quick capture, convert to script
10. /series -- Multi-part series management
11. /analytics -- Charts (recharts), weekly review, hashtag vault
12. /settings -- Context, pillar weights, schedule, platform config, bio generator

## Cross-Platform Flow

1. Create content via any generate tab
2. "Distribute" button on post editor
3. AI generates optimized versions for each enabled platform
4. Review/edit each version
5. X + LinkedIn: "Post Now" or "Schedule" (API calls from server)
6. Instagram: "Copy to Clipboard" with formatted output
7. post_distributions table tracks everything

## Key Decisions

- AI system prompt is dynamic, built from creator_profile, not hardcoded
- Platform API keys stored in creator_profile.platform_config
- No em dashes enforced via regex post-processing on all AI outputs
- InsForge Storage: `media` bucket for uploads, `exports` for generated assets
- Mobile-first: sidebar desktop, bottom bar mobile
- Teleprompter: service worker for offline capability
- RLS on all tables: user_id = auth.uid()
