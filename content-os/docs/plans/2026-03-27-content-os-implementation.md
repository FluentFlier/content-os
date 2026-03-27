# Content OS Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-stack personal content OS for founder-led marketing with AI content generation, cross-platform distribution (X, LinkedIn, Instagram), media storage, and analytics.

**Architecture:** Next.js 14 App Router with InsForge (auth, postgres, storage), Anthropic Claude API for AI, twitter-api-v2 for X posting, raw fetch for LinkedIn API. Dynamic AI system prompt built from creator_profile table. Mobile-first responsive with sidebar/bottom-bar navigation.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, InsForge SDK, Anthropic SDK, twitter-api-v2, recharts, @hello-pangea/dnd, lucide-react

---

## Phase 1: Foundation (Database + Auth + Layout)

### Task 1: SQL Schema
Create `src/lib/schema.sql` with all tables + RLS policies.

### Task 2: Auth System
- Login page at `/login`
- Auth middleware for route protection
- Session management with InsForge cookies

### Task 3: App Shell + Navigation
- Sidebar (desktop) + bottom bar (mobile)
- Layout with auth guard
- Navigation items with icons

### Task 4: Onboarding Wizard
- `/onboarding` -- multi-step form
- Steps: identity, voice, pillars, platforms
- Generates dynamic AI system prompt from config
- Stores in creator_profile table

## Phase 2: Core Content Loop

### Task 5: Dashboard
- Stats row, up next, today's prompt, backlog, quick actions, recent activity

### Task 6: Generate Page (8 tabs)
- Script generator, story mine, caption+hashtags, hook generator
- Repurpose, trend catcher, comment replies, series planner

### Task 7: Library + Post Editor
- Card/table view, filters, search
- Full editor drawer with all fields
- Status pipeline advancement

### Task 8: Ideas Page
- Quick capture, priority, convert to script

## Phase 3: Content Management

### Task 9: Story Bank
- Grid view, mine/re-mine, convert to post

### Task 10: Series Management
- Series list, parts tracking, progress bars

### Task 11: Calendar
- Month/week view, drag-drop scheduling, AI fill week

### Task 12: Teleprompter
- Full-screen, auto-scroll, mirror mode, offline via service worker

## Phase 4: Cross-Platform Distribution

### Task 13: Platform Integration (X + LinkedIn)
- X API client (twitter-api-v2)
- LinkedIn API client (raw fetch)
- Platform connection UI in settings

### Task 14: Distribute Panel
- Auto-optimize content per platform via AI
- Post/schedule to X and LinkedIn
- Copy-to-clipboard for Instagram
- post_distributions tracking

## Phase 5: Analytics + Settings

### Task 15: Analytics Page
- Performance logging, charts (recharts), weekly review, hashtag vault

### Task 16: Settings Page
- Context editor, pillar weights, schedule template, platform config, bio generator

### Task 17: Media Storage
- InsForge Storage buckets
- Upload UI on post editor
- Thumbnail display in library

## Phase 6: Polish + Deploy

### Task 18: Final polish
- Mobile responsiveness pass
- Em dash enforcement
- Loading states, error handling
- README for open source
