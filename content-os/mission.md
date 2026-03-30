
   MISSION PROMPT: Dispatch Public Launch Readiness

     # DISPATCH PUBLIC LAUNCH MISSION
     # ===============================
     # This mission transforms Dispatch from a single-user personal tool into a
     # multi-user public SaaS content command center. Execute phases in order.
     # Do not skip phases. Fix failures in place and continue.

     ---

     ## RULES
     1. Never use em dashes anywhere -- code, comments, UI copy, AI prompts, strings.
     2. Follow the Dispatch Brand Guide (light theme, Syne + Space Grotesk, warm colors).
     3. All API routes: getAuthenticatedUser() first line, 401 if null.
     4. Never expose API keys or secrets client-side.
     5. Use InsForge SDK for all DB operations.
     6. Tailwind CSS 3.4 only. No component libraries.
     7. Read every file before editing it.
     8. Run `npm run build` after every phase to verify no regressions.
     9. Keep files under 500 lines. Split large components.

     ---

     ## PHASE 1: CRITICAL BUG FIXES (Do these first)

     ### 1.1 Fix missing `creator_profile` table
     - Add to `db/schema.sql`:
     ```sql
     create table if not exists creator_profile (
       id uuid primary key default gen_random_uuid(),
       user_id uuid not null unique,
       display_name text,
       bio text,
       content_pillars jsonb default '[]'::jsonb,
       platform_config jsonb default '{}'::jsonb,
       created_at timestamptz default now() not null,
       updated_at timestamptz default now() not null
     );
     create trigger creator_profile_updated_at
       before update on creator_profile
       for each row execute function update_updated_at();

   1.2 Fix login page not consuming `?mode=signup` query param
   •  In src/app/(auth)/login/page.tsx, read searchParams.get('mode') in useEffect
     and set mode state to 'signup' if param is present.

   1.3 Fix Series page broken link
   •  In src/app/(dashboard)/series/page.tsx, change /generate?tab=series-planner
     to /generate?tab=series to match the actual tab ID in Generate page.

   1.4 Fix Ideas "Convert to Script" losing data
   •  In src/app/(dashboard)/generate/page.tsx, read result and topic query
     params from URL and pre-populate the active tab's output/input when present.

   1.5 Fix StoryMine "Convert to Post" dead button
   •  In src/components/generate/StoryMine.tsx, add onClick handler to the
     "Convert to Post" button in GenerateOutput children.

   1.6 Fix mobile nav missing pages
   •  In src/components/nav/BottomBar.tsx, add a "More" menu (drawer or expandable)
     that includes Story Bank, Ideas, Series, and Analytics.

   1.7 Fix `font-heading` Tailwind class not defined
   •  In tailwind.config.ts, add heading: ['Syne', 'system-ui', 'sans-serif']
     to fontFamily extend. OR do a find-replace of font-heading to font-display
     across all files (since font-display is already defined).

   1.8 Fix hardcoded pillar CHECK constraint in DB
   •  Remove the CHECK constraint on posts.pillar so custom pillars work:
     ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_pillar_check;
     Also update schema.sql to remove the hardcoded check.

   1.9 Add input validation to POST/PATCH /api/posts
   •  Add Zod schemas for post creation and update in the API routes.
     Validate all incoming fields. Reject unknown fields.

   1.10 Fix inconsistent data access in Library page
   •  Move bulk delete/status operations from direct InsForge client calls to
     use API routes instead. All mutations should go through API routes.

   ──────────────────────────────────────────

   PHASE 2: MULTI-USER / PUBLIC ACCESS CHANGES

   2.1 Generalize the system prompt
   •  In src/lib/claude.ts, replace the hardcoded Anirudh-specific BASE_SYSTEM_PROMPT
     with a dynamic one that reads from the user's creator_profile and
     user_settings.context_additions. The base prompt should be generic:
     "You are a content strategist for {display_name}. Here is their context: {context_additions}.
     Their content pillars are: {pillars}. Voice guidelines: {voice_notes}."
   •  Keep the current prompt as a TEMPLATE/DEFAULT that seeds new user profiles.

   2.2 Add onboarding flow for new users
   •  Expand src/app/(dashboard)/onboarding/page.tsx to a multi-step flow:
     Step 1: Display name, bio
     Step 2: Define content pillars (add/remove/name/color)
     Step 3: Voice description (how they talk, what to avoid)
     Step 4: Context/background (paste bio, achievements, etc.)
   •  On complete: create creator_profile row + seed user_settings.
   •  Dashboard layout should redirect to /onboarding if no creator_profile exists.

   2.3 Make pillar system fully dynamic
   •  Everywhere pillars are used (constants, badges, colors, generate prompts),
     read from creator_profile.content_pillars first, fall back to defaults.
   •  ScriptGenerator should build prompts dynamically from user's pillar definitions.
   •  Remove hardcoded PILLAR_PROMPTS or keep as starter templates only.

   2.4 Update middleware for public signup
   •  Currently checks for dispatch-token cookie. Verify this works with
     InsForge's signup flow. New users need to be able to register.

   2.5 Remove/update all hardcoded "Anirudh" references
   •  Search entire codebase for "Anirudh", "Ada", "tryada", "hackathon",
     "ISRO", "TackBraille", "honeybee" and replace with dynamic references
     from the user's profile, or remove entirely from default UI copy.

   ──────────────────────────────────────────

   PHASE 3: LANDING PAGE

   3.1 Build a proper public landing page at `src/app/page.tsx`
   •  The current page.tsx has a basic landing page. Rebuild it following the
     Dispatch Brand Guide (light theme, warm backgrounds, Syne headings).

   Design sections:
   1. Hero: "Your content, dispatched." Syne 800, large. Subtext explaining
      the value prop in 1-2 sentences. Two CTAs: "Get Started" (coral, links to
      /login?mode=signup) and "See How It Works" (ghost, scrolls to features).

   2. Problem/Solution: 3-column grid. Icons + short copy.
      "Stop context-switching between 5 apps."
      "AI that knows YOUR voice, not generic copy."
      "From idea to posted in one place."

   3. Features Showcase: Card grid showing key features:
     •  8 AI Writing Tools (script, hooks, captions, story mining, repurpose, etc.)
     •  Content Library with pipeline tracking (idea -> scripted -> filmed -> edited -> posted)
     •  Smart Calendar with AI scheduling
     •  Video Editing Studio (auto-captions, silence removal, AI compositions)
     •  Social Publishing (connect accounts, publish directly)
     •  Analytics and Weekly Reviews
     •  Mobile Teleprompter
      Each card: icon + title + 1-sentence description.

   4. How It Works: 3 steps with illustrations/mockups.
      Step 1: Set up your profile and content pillars
      Step 2: Generate, organize, and schedule content
      Step 3: Publish everywhere and track performance

   5. Social Proof / Stats: "Built for creators who ship."
      Show platform stats or feature counts.

   6. CTA Section: "Start creating." Email input + "Get Started" button.
      Or just a big coral button to /login?mode=signup.

   7. Footer: Minimal. Dispatch wordmark + copyright.

   •  Make it fully responsive (mobile-first).
   •  Add smooth scroll behavior.
   •  Add subtle animations (fade-in on scroll, not over 200ms).

   ──────────────────────────────────────────

   PHASE 4: SOCIAL MEDIA INTEGRATIONS

   4.1 Fix existing platform integrations
   •  Twitter/X: Already has twitter-api-v2. Verify OAuth flow works end-to-end.
     Test: connect account in Settings, publish a post, verify it appears on X.
   •  LinkedIn: Update from legacy /v2/ugcPosts to current Posts API.
     Verify OAuth scopes are correct (w_member_social).
   •  Threads: Verify Threads Publishing API integration. Text posts should work.
   •  Instagram: Instagram Graph API requires image URL. Add image upload support
     (upload to InsForge Storage, get URL, then publish). For now, mark Instagram
     as "Image required" in the UI with clear messaging.

   4.2 Add publish flow to Library
   •  In PostEditorDrawer, add a "Publish" section that:
     1. Shows connected accounts as toggleable buttons
     2. Shows platform-specific character limits and warnings
     3. Has a "Publish Now" button that calls POST /api/publish
     4. Shows success/failure per platform
     5. Updates post status to "posted" and sets posted_date on success

   4.3 Fix OAuth callback routes
   •  The callback routes at api/social-accounts/callback/{platform} are currently
     static (returning empty responses). Implement proper OAuth code exchange:
   1. Receive callback with authorization code
   2. Exchange code for access token
   3. Store token in social_accounts table (encrypted)
   4. Redirect back to /settings with success message

   4.4 Add token refresh logic
   •  LinkedIn and Instagram tokens expire. Add refresh logic in the publish flow.
   •  Before publishing, check token_expires_at. If expired, attempt refresh.
     If refresh fails, prompt user to reconnect.

   4.5 Publish scheduling
   •  Add ability to schedule a publish time (not just a date).
   •  Store as scheduled_publish_at timestamp on the post.
   •  Add a cron job or Vercel cron that checks for posts due to publish
     and auto-publishes them. (Vercel cron via vercel.json or API route.)

   ──────────────────────────────────────────

   PHASE 5: VIDEO EDITING STUDIO

   5.1 Install dependencies

   bash
     npm install remotion @remotion/player @remotion/renderer

   5.2 Create Video Studio page
   •  Add new route: src/app/(dashboard)/video-studio/page.tsx
   •  Add to nav (Sidebar + BottomBar): "Video Studio" with a film icon.
   •  Add to middleware PROTECTED paths.

   5.3 Video Upload + Processing
   •  Add file upload UI (drag-and-drop zone + file picker).
   •  Upload video to InsForge Storage (or use presigned URL pattern).
   •  Display uploaded video in a player.

   5.4 AI Auto-Edit Features (via ZapCap API or similar)
   •  Create API route src/app/api/video/auto-edit/route.ts:
     •  Accepts video URL + editing options
     •  Calls ZapCap API (or equivalent) for:
       •  Auto-captioning (generates animated subtitles)
       •  Silence removal (trims dead air)
       •  Smart cuts (removes filler words)
     •  Returns processed video URL
     •  Shows progress/status while processing

   5.5 Remotion Video Compositions
   •  Create src/components/video-studio/ directory with:
     •  VideoEditor.tsx - Main editor interface
     •  VideoPlayer.tsx - Remotion <Player> wrapper for preview
     •  CaptionOverlay.tsx - Remotion composition for caption styling
     •  TemplateSelector.tsx - Pre-built video templates
     •  ExportPanel.tsx - Rendering options and export

   5.6 AI-Powered Video Generation
   •  Create API route src/app/api/video/generate/route.ts:
     •  Takes a text prompt describing desired video
     •  Uses Claude to generate Remotion composition code
     •  Renders via Remotion renderer
     •  Returns rendered video URL

   5.7 Video Templates
   •  Create 3-5 starter templates:
     1. "Talking Head with Captions" - caption overlay styling
     2. "Hook + Content" - animated text intro + video content
     3. "Story Highlights" - multi-clip compilation with transitions
     4. "Stats/Data" - animated statistics overlay
     5. "Before/After" - split screen comparison

   5.8 Integration with Content Pipeline
   •  From Library PostEditorDrawer, add "Edit Video" button that opens
     Video Studio with the post context pre-loaded.
   •  Generated/edited videos can be attached to posts.
   •  Video thumbnails shown in Library cards.

   ──────────────────────────────────────────

   PHASE 6: REMAINING BUG FIXES AND POLISH

   6.1 Fix TodaysPrompt firing on every dashboard load
   •  Add caching: store today's prompt in localStorage with date key.
     Only regenerate if no cached prompt for today, or user clicks refresh.

   6.2 Fix recharts @ts-ignore comments
   •  Properly type the recharts dynamic imports instead of suppressing errors.

   6.3 Fix dead dependencies
   •  Remove unused packages: @anthropic-ai/sdk, @hello-pangea/dnd, @insforge/nextjs
     (verify they are truly unused first -- @hello-pangea/dnd should be used by Calendar
      drag-and-drop. If not implemented yet, implement it or remove the dep.)

   6.4 Fix Settings page (split into sub-components)
   •  Break settings/page.tsx (700+ lines) into:
     •  ContextEditor.tsx
     •  PillarWeights.tsx
     •  WeeklySchedule.tsx
     •  PlatformDefaults.tsx
     •  BioGenerator.tsx
     •  PlatformConnections.tsx
     •  ProfileEditor.tsx

   6.5 Add drag-and-drop to Calendar
   •  Implement @hello-pangea/dnd for dragging unscheduled posts to calendar days.
     This was in the PRD but never implemented.

   6.6 Add proper error boundaries
   •  Create an ErrorBoundary component.
   •  Wrap each dashboard page section with it.
   •  Show friendly error UI instead of white screen on failures.

   6.7 Fix font class inconsistencies
   •  Do a global pass: replace all inline style={{fontFamily:...}} and
     font-['Syne'] / font-['Space_Grotesk'] with Tailwind font-display
     and font-body classes.

   6.8 Add loading states everywhere
   •  Ensure every page has proper skeleton/loading states while data fetches.
   •  Use the existing Skeleton component from ui/.

   6.9 Add empty states
   •  Every list/grid page (Library, Ideas, Story Bank, Series) should show
     helpful empty states per the Brand Guide copy guidelines.

   6.10 Mobile responsiveness pass
   •  Test every page at 390px width.
   •  Fix: horizontal overflow, tap targets < 44px, stacking issues.
   •  Calendar should show list view on mobile, not grid.

   ──────────────────────────────────────────

   PHASE 7: SECURITY HARDENING

   7.1 Encrypt stored OAuth tokens
   •  Social account access tokens in the DB should be encrypted at rest.
     Use AES-256-GCM with a server-side encryption key from env vars.

   7.2 Add rate limiting
   •  Add rate limiting to /api/generate (prevent abuse of AI credits).
     Use a simple in-memory or InsForge-backed counter: max 50 generations/hour/user.

   7.3 Add CSRF protection
   •  OAuth connect routes need state parameter for CSRF prevention.
     Generate random state, store in httpOnly cookie, verify on callback.

   7.4 Validate all API inputs
   •  Add Zod validation to EVERY API route (posts, ideas, series, story-bank,
     hashtag-sets, weekly-reviews, settings, publish, video endpoints).

   7.5 Sanitize AI outputs
   •  Before rendering AI-generated content in the UI, sanitize for XSS.
     Use a simple HTML escape or ensure React's JSX escaping is sufficient
     (it is, as long as we never use dangerouslySetInnerHTML with AI output).

   ──────────────────────────────────────────

   PHASE 8: FINAL VERIFICATION

   8.1 Full build verification

   bash
     npm run build
     npm run lint

   Fix all errors and warnings.

   8.2 Test every user flow
   1. New user: Landing page -> Sign up -> Onboarding -> Dashboard
   2. Generate: All 8 tabs produce output, save to library works
   3. Library: CRUD, filters, search, status pipeline, editor drawer
   4. Calendar: View, schedule, drag-and-drop, AI fill week
   5. Story Bank: Mine, re-mine, convert to post
   6. Ideas: Add, edit, convert to script, delete
   7. Series: Create, add parts, reorder, delete
   8. Analytics: Log performance, view charts, weekly review, hashtag vault
   9. Teleprompter: Load script, manual paste, controls
   10. Settings: All sections save and load correctly
   11. Social publish: Connect account, publish post
   12. Video Studio: Upload, auto-edit, template preview, export

   8.3 Verify no hardcoded personal data remains
   •  Search for: Anirudh, Ada, tryada, ISRO, TackBraille, honeybee,
     ASU, Barrett, Smith-Lei, AAAS, Bangalore, Mysore, Cisek
   •  All should be in user-specific context, not hardcoded in app code.


     ---/enter