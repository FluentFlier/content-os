# DISPATCH FIX-EVERYTHING + SHIP MISSION
# ========================================
# This mission fixes all backend issues, wires up direct publishing,
# and adds automatic multi-platform content optimization.
# Execute phases in order. Fix failures in place and continue.
# Do not skip phases. Run `npm run build` after every phase.

---

## RULES
1. Never use em dashes anywhere -- code, comments, UI copy, AI prompts, strings.
2. All API routes: getAuthenticatedUser() first line, 401 if null.
3. Never expose API keys or secrets client-side.
4. Use InsForge SDK for all DB operations. No raw SQL from the client.
5. Tailwind CSS 3.4 only. No component libraries.
6. Read every file before editing it.
7. Run `npm run build` after every phase to verify no regressions.
8. Keep files under 500 lines. Split large components.
9. Match existing code patterns. Dark theme UI (#09090B, #18181B). Syne + Space Grotesk fonts.
10. All tokens encrypted at rest with AES-256-GCM. Never log plaintext tokens.

---

## PHASE 1: BACKEND FIXES -- GET THE FOUNDATION SOLID

### 1.1 Fix InsForge client initialization
- In `src/lib/insforge/client.ts`, the fallback creates a client with
  `baseUrl: 'https://placeholder.insforge.app'` and `anonKey: 'placeholder'`.
  This silently fails. If env vars are missing, throw an explicit error
  in development mode. In production, log a warning and return a noop client
  that surfaces errors on use.
- Verify `src/lib/insforge/server.ts` properly reads the `dispatch-token`
  cookie and passes it to `getServerClient()`. Check that `getAuthenticatedUser()`
  works end-to-end.

### 1.2 Fix database schema drift
- There are two schema files: `db/schema.sql` (6KB) and `lib/schema.sql` (12KB).
  Consolidate into one authoritative `db/schema.sql`.
- Ensure `social_accounts` table exists with columns:
  id, user_id, platform, account_name, account_id, access_token,
  refresh_token, token_expires_at, platform_user_id, connected_at.
- Ensure `creator_profile` table includes: voice_description, voice_rules,
  onboarding_complete, platform_config (jsonb for BYOK credentials).
- Remove the hardcoded CHECK constraint on `posts.pillar` so custom pillars work.
- Delete the duplicate `lib/schema.sql` after consolidation.

### 1.3 Fix all API route auth consistency
- Audit EVERY route in `src/app/api/`. Every single one must:
  1. Call `getAuthenticatedUser()` as the first line
  2. Return 401 if null
  3. Scope all DB queries with `.eq('user_id', user.id)`
- Fix any routes that skip auth or don't scope by user_id.

### 1.4 Fix the publish route type issues
- In `src/app/api/publish/route.ts`, the `ensureFreshToken` function takes
  `client` typed as `ReturnType<typeof getServerClient>`, but `getServerClient()`
  is a sync function that returns the client directly (not a promise).
  Fix the typing. Ensure `client.database.from(...)` calls match the actual
  InsForge SDK API (it may be `client.database` not `client.db`).
- Add proper error handling for the case where token decryption fails (e.g.
  key rotation or corrupted token).

### 1.5 Fix OAuth callback routes
- Verify all four callback routes actually work end-to-end:
  - `api/social-accounts/callback/twitter/route.ts`
  - `api/social-accounts/callback/linkedin/route.ts`
  - `api/social-accounts/callback/instagram/route.ts`
  - `api/social-accounts/callback/threads/route.ts`
- Each callback must:
  1. Validate the `state` param against the httpOnly cookie
  2. Exchange the authorization code for tokens
  3. Encrypt tokens before storage
  4. Store in `social_accounts` table
  5. Clear OAuth cookies
  6. Redirect to `/settings?connected={platform}`
- For Instagram: exchange short-lived token for long-lived token (60 days).
- For Threads: same long-lived token exchange.

### 1.6 Fix video auto-edit stub
- The route at `src/app/api/video/auto-edit/route.ts` is a placeholder
  returning fake data. Either:
  (a) Remove the route and remove the "Auto Edit" button from video studio UI, OR
  (b) Connect it to a real service.
  Option (a) is fine for now. Leave the upload/preview functionality intact.
  Update the UI to remove buttons that call non-functional endpoints.

### 1.7 Fix TodaysPrompt caching on dashboard
- In the dashboard page, the AI prompt fires on every page load.
- Add localStorage caching: store the prompt with a date key.
  Only regenerate if no cached prompt for today, or user clicks refresh.

### 1.8 Fix font-heading vs font-display inconsistency
- Search entire codebase for `font-heading`. If the class is used but not
  defined in tailwind.config.ts, either:
  (a) Add `heading: ['Syne', 'system-ui', 'sans-serif']` to fontFamily, OR
  (b) Replace all `font-heading` with `font-display` (which IS defined)
- Pick whichever approach touches fewer files.

### 1.9 Add Zod validation to ALL remaining API routes
- Check every POST/PATCH route. Many already have Zod validation (publish does).
  Add it to any that are missing: posts, ideas, series, story-bank,
  hashtag-sets, weekly-reviews, settings.
- Validate all incoming fields. Reject unknown fields. Return 400 with
  clear error messages on validation failure.

### 1.10 Fix middleware
- Current middleware only sets `x-pathname` header.
- It should also check for `dispatch-token` cookie on protected routes
  and redirect to `/login` if missing.
- Protected routes: /dashboard, /generate, /library, /calendar,
  /story-bank, /ideas, /series, /analytics, /settings, /teleprompter,
  /video-studio, /onboarding.
- If user IS authenticated and hits `/login`, redirect to `/dashboard`.

---

## PHASE 2: DIRECT POSTING WITH CREDENTIALS (BYOK)

This feature lets users who want to skip OAuth just paste their API keys
or login credentials directly. The app stores them encrypted and uses
them for publishing.

### 2.1 Add platform_config to creator_profile
- If not already present, add a `platform_config` JSONB column to
  `creator_profile`. This stores BYOK credentials per platform.
- Structure:
```json
{
  "twitter": {
    "method": "api_key",
    "api_key": "encrypted...",
    "api_secret": "encrypted...",
    "access_token": "encrypted...",
    "access_token_secret": "encrypted..."
  },
  "linkedin": {
    "method": "oauth",
    "note": "Uses connected OAuth account"
  },
  "instagram": {
    "method": "api_key",
    "access_token": "encrypted..."
  },
  "threads": {
    "method": "api_key",
    "access_token": "encrypted..."
  }
}
```

### 2.2 Create API route for BYOK credential storage
- `POST /api/social-accounts/byok` -- accepts platform + credentials
- Validates input with Zod
- Encrypts all credential values with AES-256-GCM before storage
- Stores in `social_accounts` table with `connection_method: 'byok'`
- Returns success/failure

### 2.3 Update Settings UI for BYOK
- In the PlatformConnections component (`src/components/settings/PlatformConnections.tsx`):
- For each platform, show TWO connection methods:
  1. "Connect with OAuth" (existing button) -- redirects to OAuth flow
  2. "Use API Keys" (new section) -- expandable form with:
     - Platform-specific fields (e.g. Twitter needs 4 keys, Instagram needs 1 token)
     - All inputs are `type="password"` with a show/hide toggle
     - "Save Keys" button that calls POST /api/social-accounts/byok
     - "Test Connection" button that verifies the credentials work
       (calls a test endpoint that tries to fetch the user profile)
     - Clear indicator of which method is currently active
- Show a connected status badge when either method has valid credentials

### 2.4 Update publish flow to support BYOK
- In `src/app/api/publish/route.ts`, when looking up the social account:
  1. First check `social_accounts` for an OAuth-connected account
  2. If none found, check for a BYOK entry
  3. If BYOK, decrypt the credentials and use them
- For Twitter BYOK: use `twitter-api-v2` with OAuth 1.0a app+user tokens
  (api_key + api_secret + access_token + access_token_secret)
- For LinkedIn BYOK: use the access token directly
- For Instagram/Threads BYOK: use the long-lived access token

### 2.5 Add credential validation endpoint
- `POST /api/social-accounts/test` -- accepts platform + credentials
- Does NOT store anything. Just tests if the credentials are valid.
- For Twitter: calls `v2.me()` to verify
- For LinkedIn: calls `/v2/me` to verify
- For Instagram: calls Graph API `/me` to verify
- For Threads: calls Threads API `/me` to verify
- Returns { valid: true, profile: { name, username } } or { valid: false, error: "..." }

---

## PHASE 3: AUTO-OPTIMIZE + MULTI-PLATFORM VARIANT GENERATION

When a user writes/generates a post, the system should automatically
optimize it and generate platform-specific variants for all platforms
they've connected (or all platforms they select).

### 3.1 Create the multi-platform optimization API
- New route: `POST /api/optimize`
- Input:
```json
{
  "content": "The original post content (script, caption, or raw text)",
  "sourcePlatform": "instagram",
  "targetPlatforms": ["twitter", "linkedin", "threads"],
  "postId": "uuid (optional, to link variants)",
  "optimizationLevel": "light" | "full"
}
```
- For each target platform, call `generateContent()` with a platform-specific
  optimization prompt:

**Optimization prompt template:**
```
You are optimizing content for {targetPlatform}.

ORIGINAL CONTENT ({sourcePlatform}):
{content}

PLATFORM RULES:
- twitter: Max 280 chars per tweet. If content is long, create a thread (max 10 tweets). Numbered. Each tweet stands alone but flows. Hook tweet is everything. No hashtags in tweets (put in reply).
- linkedin: Professional but human. Can be longer (up to 3000 chars). First line is the hook (shown before "see more"). Use line breaks for readability. 3-5 relevant hashtags at the end. Add a question at the end to drive comments.
- instagram: Caption format. First line is the hook before "...more". Raw and personal. 20-25 hashtags at the end. End with a question or CTA. Under 2200 chars.
- threads: Conversational. Like texting a smart friend. Short. Under 500 chars. No hashtags. Can be a single punchy take or a short thread (max 3 posts).

OPTIMIZATION RULES:
- Keep every specific detail from the original. Never genericize.
- Adapt the FORMAT and LENGTH, not the substance.
- Match the creator's voice exactly.
- No em dashes. Ever.
- If "light" optimization: minimal changes, mostly formatting. If "full": rewrite for the platform while keeping the core message.

Return ONLY the optimized content. No labels, no explanations.
For Twitter threads: separate tweets with ---TWEET--- delimiter.
```

- Return:
```json
{
  "variants": [
    {
      "platform": "twitter",
      "content": "...",
      "characterCount": 240,
      "isThread": false,
      "threadParts": null
    },
    {
      "platform": "linkedin",
      "content": "...",
      "characterCount": 1800,
      "isThread": false,
      "threadParts": null
    }
  ]
}
```

### 3.2 Add auto-optimization to the Generate flow
- In `src/components/generate/GenerateOutput.tsx`, after content is generated:
  1. Show the generated content as before
  2. Below it, add an "Optimize for All Platforms" button
  3. Also add individual platform buttons: [Twitter] [LinkedIn] [Instagram] [Threads]
     -- only show platforms that user has connected (fetch from /api/social-accounts)
  4. When clicked, call POST /api/optimize with the generated content
  5. Show a tabbed view of all platform variants below the original
  6. Each variant tab shows:
     - Platform icon + name
     - Character count + limit indicator (green if under, coral if over)
     - The optimized content
     - "Copy" button
     - "Save as Post" button (creates a new post with this platform set)
     - "Publish Now" button (if account is connected)

### 3.3 Add auto-optimization to PostEditorDrawer
- In `src/components/library/PostEditorDrawer.tsx`:
  1. Add a "Generate Variants" section below the existing fields
  2. Button: "Create All Platform Variants" -- calls /api/optimize
     with the post's script or caption as source content
  3. Shows variant cards for each platform with:
     - Preview of optimized content
     - "Save as Separate Post" -- creates a new post linked via notes
     - "Replace Caption" -- replaces the current post's caption with this variant
     - "Publish" -- direct publish to that platform

### 3.4 Auto-generate on save (optional toggle)
- In Settings, add a toggle: "Auto-generate platform variants when saving a post"
- Store as user_setting key='auto_optimize_on_save'
- When enabled, any time a post is created or its script/caption is updated
  (via POST or PATCH /api/posts), automatically trigger optimization for
  all connected platforms in the background.
- Store variants as separate posts linked by a `variant_group_id` field.
- Add `variant_group_id` UUID column to posts table.
- Add `source_platform` column to posts table to track which platform
  the content was originally written for.

### 3.5 Bulk publish flow
- New component: `src/components/library/BulkPublishPanel.tsx`
- Triggered from PostEditorDrawer's "Publish" section OR from a "Publish All"
  button in the Library page.
- Shows all connected platforms as toggleable cards
- For each selected platform:
  1. Shows the optimized variant (auto-generates if not yet created)
  2. Character count validation
  3. Preview of how it will look
- "Publish to Selected Platforms" button
- Calls POST /api/publish for each platform sequentially
- Shows real-time status: [Pending] -> [Publishing...] -> [Published] or [Failed]
- On completion, shows summary with links to published posts

---

## PHASE 4: CONTENT PIPELINE POLISH

### 4.1 Fix "Save to Library" flow in Generate
- When user clicks "Save to Library" in GenerateOutput, the modal should:
  1. Pre-fill title from the first line of generated content
  2. Pre-fill script with the full generated content
  3. Auto-detect pillar from the generation context
  4. Default status to 'scripted'
  5. Show platform selector (defaults to user's default_platform setting)
  6. Show "Save + Generate Variants" option that saves AND triggers optimization

### 4.2 Fix Story Mine "Convert to Post" flow
- In `src/components/generate/StoryMine.tsx`, the "Convert to Post" button
  must have an onClick handler that:
  1. Creates a new post via POST /api/posts with mined script, pillar, hook
  2. Redirects to /library with the editor open on the new post
  3. Marks the story bank entry as used

### 4.3 Fix Ideas "Convert to Script" flow
- In `src/app/(dashboard)/ideas/page.tsx` and generate page:
  1. Read `result` and `topic` query params from URL
  2. Pre-populate the active ScriptGenerator tab with the idea text
  3. After generation, offer to mark the idea as converted

### 4.4 Fix Series page link
- In `src/app/(dashboard)/series/page.tsx`, change `/generate?tab=series-planner`
  to `/generate?tab=series` to match the actual tab ID.

### 4.5 Add proper empty states
- Every list page (Library, Ideas, Story Bank, Series, Calendar) should show
  a helpful empty state when there are no items:
  - Icon + "No posts yet" heading
  - One-sentence description of what this page does
  - CTA button to create the first item (e.g. "Generate Your First Script")
  - Match the dark theme. Muted colors. Subtle.

### 4.6 Fix loading states
- Every page that fetches data should show skeleton states while loading.
- Check: Dashboard, Library, Calendar, Story Bank, Ideas, Series, Analytics.
- Use the existing Skeleton component from `src/components/ui/Skeleton.tsx`.

---

## PHASE 5: MAKE PUBLISHING ACTUALLY WORK END-TO-END

### 5.1 Add PublishPanel to PostEditorDrawer
- If not already present, create `src/components/library/PublishPanel.tsx`:
  1. Fetches connected accounts from GET /api/social-accounts
  2. Shows each connected platform as a toggleable card
  3. Shows the content that will be published (caption or script)
  4. Shows character count per platform with limit warnings
  5. "Publish Now" button calls POST /api/publish for each selected platform
  6. Shows per-platform status during publish
  7. On success: updates post status to 'posted', sets posted_date
  8. On failure: shows error message with retry option
- Integrate this into PostEditorDrawer below the existing fields.

### 5.2 Add scheduled publishing
- Add `scheduled_publish_at` timestamp column to posts table (datetime, not just date).
- In PostEditorDrawer, add a datetime-local input for scheduling.
- Create `src/app/api/cron/publish/route.ts`:
  1. This is a Vercel cron endpoint (or can be called manually)
  2. Queries posts where `scheduled_publish_at <= now()` AND `status != 'posted'`
  3. For each, determines which platform(s) to publish to
  4. Calls the publish logic for each
  5. Updates post status
- Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/publish",
      "schedule": "*/5 * * * *"
    }
  ]
}
```
- Protect the cron route with a `CRON_SECRET` env var check.

### 5.3 Fix platform-specific publishing edge cases
- **Instagram**: Requires an image URL. If no image is attached to the post,
  show a clear message: "Instagram requires an image. Upload one to publish."
  Add image upload via InsForge Storage before publishing.
- **Twitter threads**: If content is >280 chars and platform is twitter,
  auto-split into a thread using the ---TWEET--- delimiter from optimization.
- **LinkedIn**: Verify the Posts API (v202601) payload format is correct.
  The `author` field must use the correct person URN format.

---

## PHASE 6: TESTING AND VERIFICATION

### 6.1 Build verification
```bash
npm run build
npm run lint
```
Fix ALL errors and warnings. Zero tolerance.

### 6.2 Test every critical flow
1. **Auth**: Login -> dashboard loads -> logout -> redirect to login
2. **Generate**: Each of the 8 tabs produces output. Save to Library works.
3. **Optimize**: Generate content -> "Optimize for All Platforms" -> variants appear
4. **Library**: Create post -> edit -> change status -> filter -> search
5. **Publish**: Connect account (OAuth or BYOK) -> publish from editor -> verify status updates
6. **Bulk Publish**: Select multiple platforms -> publish -> check all succeed
7. **Calendar**: View posts on calendar -> schedule a post
8. **Settings**: Save profile -> save pillars -> connect/disconnect accounts -> BYOK flow

### 6.3 Verify no hardcoded personal data
- Search for: Anirudh, Ada, tryada, ISRO, TackBraille, honeybee,
  ASU, Barrett, Smith-Lei, AAAS, Bangalore, Mysore, Cisek
- All should be in user-specific context (creator_profile), not hardcoded.
- The DEFAULT_SYSTEM_PROMPT_TEMPLATE in claude.ts should be generic.
  Verify it IS generic (it was already updated to be dynamic).

### 6.4 Verify security
- No API keys in client-side code
- All tokens encrypted at rest
- CSRF state validation on all OAuth callbacks
- Rate limiting on /api/generate (already implemented, verify it works)
- All API routes auth-gated
- No dangerouslySetInnerHTML with AI-generated content

---

## PHASE 7: FINAL POLISH

### 7.1 Mobile responsiveness check
- Test every page at 390px width
- Fix: horizontal overflow, small tap targets, stacking issues
- Calendar should show list view on mobile
- PostEditorDrawer should be full-screen on mobile
- PublishPanel should stack vertically on mobile

### 7.2 Error handling
- Every API call in every component should have error handling
- Show user-friendly error messages (not raw API errors)
- Network failures should show retry options
- OAuth failures should show clear "try again" messaging

### 7.3 Performance
- Dashboard AI prompt should be cached (Phase 1.7)
- Library page should paginate (not load all posts at once)
- Large lists should use virtual scrolling or pagination
- Images in posts should be lazy-loaded

### 7.4 Final build
```bash
npm run build
npm run lint
```
Zero errors. Zero warnings. Ship it.

---

## SUMMARY OF NEW FILES TO CREATE

1. `src/app/api/optimize/route.ts` -- multi-platform content optimization
2. `src/app/api/social-accounts/byok/route.ts` -- BYOK credential storage
3. `src/app/api/social-accounts/test/route.ts` -- credential validation
4. `src/app/api/cron/publish/route.ts` -- scheduled publishing cron
5. `src/components/library/BulkPublishPanel.tsx` -- multi-platform publish UI
6. `vercel.json` -- cron configuration

## SUMMARY OF KEY FILES TO MODIFY

1. `src/app/api/publish/route.ts` -- support BYOK credentials
2. `src/components/generate/GenerateOutput.tsx` -- add optimization UI
3. `src/components/library/PostEditorDrawer.tsx` -- add variants + publish
4. `src/components/settings/PlatformConnections.tsx` -- add BYOK UI
5. `src/lib/insforge/client.ts` -- fix placeholder fallback
6. `src/middleware.ts` -- add auth redirect logic
7. `db/schema.sql` -- add variant_group_id, source_platform, scheduled_publish_at
8. `src/lib/claude.ts` -- verify dynamic prompt is working (it is)
