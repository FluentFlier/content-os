Build me a full-stack personal content OS called "Content OS" — a private, login-protected web app I use to plan, generate, track, and optimize my Instagram content (with cross-posting to LinkedIn, X, and Threads). I'm Anirudh Manjesh — CS founder, researcher, and hackathon competitor building a personal brand around AI, startups, and hackathons.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Next.js 14 (App Router)
- Supabase (auth + postgres)
- Anthropic Claude API (claude-sonnet-4-20250514) for all AI generation
- Tailwind CSS
- Vercel deployment
- No extra UI component libraries

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Supabase email/password auth
- Single user app — no public registration
- All routes behind /dashboard require auth
- / redirects based on session state

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BRAND + VISUAL IDENTITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Background: #0C0A09
- Surface: #13100E
- Border: #2A2218
- Text primary: #FAF6F1
- Text muted: #5A5047
- Coral accent: #EB5E55 (primary)
- Yellow accent: #F5C842
- Green accent: #5CB85C
- Purple accent: #C77DFF
- Blue accent: #4D96FF
- Fonts: Syne (700/800 headings) + Space Grotesk (body) via Google Fonts
- No em dashes anywhere in UI copy or AI outputs. Ever.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GLOBAL AI SYSTEM PROMPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every Claude API call includes this system prompt as a base. It can be extended with user-edited context from /settings.

---
You are a content strategist for Anirudh Manjesh. Here is who he actually is:

FACTS:
- CS senior at ASU Barrett Honors College, graduating May 2026. GPA 3.62.
- Solo founder of Ada (tryada.app). Ada is an AI secretary (never "assistant") that lives in the iOS share button. Positioned for busy people broadly, not just founders. 250+ organic waitlist signups, zero ad spend.
- 36 hackathons. 15 wins. $30,000+ in prizes.
- CRA Outstanding Undergraduate Researcher Award (Honorable Mention). Presented at AAAS 2025.
- Undergraduate researcher in the Smith-Lei Neurobiology Lab: built ML systems for honeybee sleep analysis, 3+ years. First-author manuscript submitted to Journal of Comparative Physiology A: "The Insect Brain as a Tractable Model for Understanding Sleep Mechanisms and Function."
- Rebuilt TackBraille: cut Braille display cost from $4,000 to $450. Deployed across South Africa, Kenya, Equatorial Guinea.
- SWE intern at Cisek Inspection Solutions (Aug-Dec 2025): built computer vision models for food inspection.
- Interned at ISRO (Indian Space Research Organisation).
- Originally from Bangalore. Attended Sri Ramakrishna Vidyashala boarding school in Mysore, grades 8-10.
- Moving to San Francisco post-graduation. Already embedded in SF tech/startup ecosystem.

VOICE: Raw, honest, direct. No fluff. Talks like he's telling a friend something real. Contrarian but earned — he has the receipts. Short punchy sentences. Talks TO the viewer, not AT them. Never sounds scripted.

RULES:
- No em dashes anywhere. Ever.
- No corporate speak or influencer fluff
- Never genericize a specific detail
- Ada is always a "secretary," never an "assistant"
- If a 16 year old cannot follow an explanation, simplify more

CONTENT PILLARS:
1. Hot Takes — job market myths, AI hype vs reality, why CS students play it safe, hackathon culture vs interview culture
2. Hackathon Stories — 36 hackathons = 36 real stories. Raw, specific, dramatic moments.
3. Founder in Public — honest Ada/startup updates. Tuesday at 11pm energy, not success theater.
4. Concept Explainers — AI/startup/research concepts in under 60 seconds. Zero jargon.
5. Origin/Arc — Bangalore boarding school to ISRO to 36 hackathons to AI founder moving to SF. The non-linear path.
6. Research Unlocked — honeybee sleep ML, AAAS, what doing real CS research actually looks like. Most people have no idea this world exists.
---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATABASE SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

posts
- id uuid PK
- user_id uuid → auth.users
- title text (internal name)
- pillar text (hot-take | hackathon | founder | explainer | origin | research)
- platform text (instagram | linkedin | twitter | threads)
- status text (idea | scripted | filmed | edited | posted)
- script text
- caption text
- hashtags text
- hook text
- notes text
- scheduled_date date nullable
- posted_date date nullable
- views int nullable
- likes int nullable
- saves int nullable
- comments int nullable
- shares int nullable
- follows_gained int nullable
- series_id uuid nullable → series(id)
- series_position int nullable
- created_at timestamptz default now()
- updated_at timestamptz default now()

story_bank
- id uuid PK
- user_id uuid → auth.users
- raw_memory text
- mined_angle text
- mined_hook text
- mined_script text
- mined_caption_line text
- pillar text
- used boolean default false
- used_post_id uuid nullable → posts(id)
- created_at timestamptz default now()

content_ideas
- id uuid PK
- user_id uuid → auth.users
- idea text
- pillar text
- priority text (low | medium | high)
- notes text
- converted boolean default false
- created_at timestamptz default now()

series
- id uuid PK
- user_id uuid → auth.users
- name text
- description text
- pillar text
- total_parts int
- created_at timestamptz default now()

hashtag_sets
- id uuid PK
- user_id uuid → auth.users
- name text
- tags text (space-separated)
- pillar text nullable
- use_count int default 0
- created_at timestamptz default now()

weekly_reviews
- id uuid PK
- user_id uuid → auth.users
- week_start date
- posts_published int
- total_views int
- total_followers_gained int
- top_post_id uuid nullable → posts(id)
- what_worked text
- what_to_double_down text
- what_to_cut text
- next_week_focus text
- created_at timestamptz default now()

user_settings
- id uuid PK
- user_id uuid → auth.users
- key text
- value text
- updated_at timestamptz default now()

Enable Row Level Security on all tables. All policies: user can only access rows where user_id = auth.uid().

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NAVIGATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Left sidebar on desktop, bottom bar on mobile.
Items:
- Dashboard (home)
- Generate (wand)
- Library (grid)
- Calendar (calendar)
- Story Bank (archive)
- Ideas (lightbulb)
- Series (layers)
- Analytics (bar chart)
- Settings (gear)

Active item = coral #EB5E55. Sidebar shows "CONTENT OS" in Syne at top, small "Anirudh / tryada.app" below it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE: /dashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Greeting: "What are we building today?" in Syne
- Stats row: Posts this week / In pipeline / Total posted / Streak (consecutive days with posted content)
- "Up Next" card: next 3 scheduled posts with date, pillar color, status
- "Today's Prompt": AI-generated single content idea based on what's missing from this week's schedule. Calls Claude with the current week's post plan and asks what pillar/angle is missing. Refreshes on button click.
- "Backlog" preview: top 3 ideas by priority
- Quick actions: Generate Script / Mine a Story / Log a Post / Add Idea
- Recent activity: last 5 posts modified with status badges

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE: /generate
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8-tab interface. All outputs: formatted box + Copy button + Save to Library button (modal: title, platform, status default=scripted).

TAB 1 — SCRIPT GENERATOR
Pillar selector (pill buttons, pillar colors):
Hot Take | Hackathon | Founder | Explainer | Origin | Research

Optional topic input. "Generate Script" button.

Pillar prompts:

HOT TAKE:
"Generate a hot take Reel script.
HOOK: One bold controversial sentence. Stop-scrolling.
ARGUMENT: The actual claim, one sentence.
EVIDENCE: Specific proof or real example, one sentence.
FLIP: What they should do/think instead, one sentence.
CTA: One direct question.
Under 60 seconds. No em dashes."

HACKATHON:
"Generate a hackathon story Reel script. Anirudh has 36 hackathons. Pick a specific, realistic, dramatic story.
HOOK: Drop into the most intense moment. No setup.
SETUP: 2 bullets — challenge, stakes.
TURN: 1 bullet — what changed under pressure.
LESSON: 1 bullet — what this teaches about building.
CTA: Ask viewers about their own experience."

FOUNDER:
"Generate a founder-in-public script about building Ada (tryada.app). Ada is an AI secretary (not assistant) in the iOS share button.
HOOK: One honest vulnerable sentence. Real energy, no spin.
REALITY: 2 bullets — what was hard or went wrong.
PROGRESS: 1 bullet — one thing that moved.
LESSON: 1 bullet — what this is teaching about startups.
CTA: Invite builders to share their week.
Sound like Tuesday at 11pm, not a success story."

EXPLAINER:
"Generate a concept explainer about AI or startups. Under 60 seconds.
HOOK: A question that makes them feel dumb for not knowing.
SIMPLE VERSION: 2 bullets, zero jargon. 16-year-old readable.
WHY IT MATTERS: 1 bullet.
MISCONCEPTION: 1 bullet.
CTA: Ask what to explain next."

ORIGIN:
"Generate an origin/arc video script.
Backstory: Bangalore born. Boarding school in Mysore. Interned at ISRO. Ended up at an honors CS program in Arizona. 36 hackathons. Built TackBraille and deployed it across Africa. Now founding an AI startup and moving to SF.
HOOK: One specific detail that makes someone lean in.
THE PATH: 2 bullets — the unexpected parts.
THROUGH LINE: 1 bullet — what actually connects it all.
NOW: 1 bullet — where it's heading.
CTA: Invite non-linear paths in comments."

RESEARCH:
"Generate a 'research unlocked' video script that makes ML/neuroscience research feel accessible and interesting.
Anirudh's research: built ML systems to analyze honeybee sleep in the Smith-Lei Neurobiology Lab. Used V-JEPA models. First-author paper submitted to Journal of Comparative Physiology A. Presented at AAAS 2025. The angle: most CS people have never done real research, and most people have no idea what it actually looks like day-to-day.
HOOK: One line that makes someone who hates science want to keep watching.
THE WEIRD PART: 2 bullets — what's genuinely surprising about the research.
WHY IT MATTERS: 1 bullet — real-world stakes.
THE META LESSON: 1 bullet — what doing research teaches you that classes don't.
CTA: Ask if they knew this kind of research existed."

TAB 2 — STORY MINE
The most important feature.
Large textarea: "Describe any memory or experience."
Helper text (muted, small): "A hackathon moment. Something that happened while building Ada. The day you almost quit. What deploying TackBraille in Africa actually looked like. Anything that felt real."

"Mine It" button (yellow).

AI prompt:
"Mine this memory for the strongest Instagram content angle.
MEMORY: [input]
Return exactly:
PILLAR: (hot-take / hackathon / founder / explainer / origin / research)
ANGLE: One sentence — what makes this interesting to a stranger.
HOOK: Exact first line to say on camera. No setup. Drop in.
SCRIPT:
- (beat 1)
- (beat 2)
- (beat 3)
- (beat 4)
CTA: Closing question.
CAPTION LINE: Just the first line of the Instagram caption (before 'more').
PLATFORM FIT: Best platform for this specific story and why (one sentence).

Use every specific detail from the memory. Never genericize."

Save to Story Bank. "Convert to Post" pre-fills script tab.

TAB 3 — CAPTION + HASHTAGS
Textarea for script/video idea.
Toggle: use saved hashtag set / generate fresh.
If using saved set: dropdown of hashtag_sets table.

AI prompt:
"Write an Instagram caption and hashtag set.
VIDEO: [input]
CAPTION: 2-4 sentences. First line is the hook shown before 'more'. Raw, honest, Anirudh's voice. No em dashes. Direct question at the end to drive comments.
HASHTAGS: 20-25 hashtags. Mix niche (hackathons, startups, AI, founder, research, accessibility), personal brand, and broad reach. One line, space-separated.
No labels. Just caption, blank line, hashtags."

Option to save hashtag set with a name.

TAB 4 — HOOK GENERATOR
Optional topic. "Generate 8 Hooks."
Each hook has its own copy button.
"Save as Hook" saves to the post currently being edited if one is open.

AI prompt:
"Generate 8 Instagram hooks for: [topic or 'hackathons, AI, startups, building, research'].
One sentence each. First word must stop the scroll.
Mix styles:
- Stat-based: 'I've won 15 hackathons. Here's the one thing that never changes.'
- Contrarian: 'The job market isn't broken. You are.'
- Story-drop: 'At 3am during my 20th hackathon I realized I'd been building wrong.'
- Challenge: 'You're not struggling to get hired because of AI.'
- Curiosity: 'Nobody told me undergrad research would feel like this.'
- Vulnerability: 'I shipped Ada to 250 people and almost shut it down the same week.'
Numbered 1-8. One per line. No explanation. No em dashes."

TAB 5 — REPURPOSE
Textarea: paste script.
From platform / To platform selectors (instagram, linkedin, twitter, threads).
"Repurpose" button.

AI adapts length, format, tone, CTA style, and structure for target platform. LinkedIn gets longer, more reflective. Twitter/X gets punchy and thread-structured. Threads gets conversational.

TAB 6 — TREND CATCHER
Textarea: paste or describe a trending topic/moment in tech or culture.
"Find My Angle" button.

AI prompt:
"A trend or topic is happening: [input].
Find Anirudh's specific, earned angle on it. He has receipts — 36 hackathons, research at a neurobiology lab, founding an AI startup, ISRO intern, built accessibility tech for Africa. He should not comment on trends without a personal connection.
Return:
ANGLE: His specific POV on this (one sentence)
CONNECTION: What from his actual experience gives him the right to speak on this
HOOK: First line on camera
SCRIPT OUTLINE:
- (beat 1)
- (beat 2)
- (beat 3)
CTA: Closing question
AVOID: What would make this feel generic or unearned"

TAB 7 — COMMENT REPLIES
Textarea: paste 5-10 recent comments from a post.
"Generate Replies" button.

AI prompt:
"Write replies to these Instagram comments in Anirudh's voice. Raw, direct, like texting a friend. Short. Engage genuinely. Ask a follow-up question when natural. No em dashes. Never sound like a brand.
COMMENTS: [input]
Return each reply labeled Comment 1 Reply, Comment 2 Reply, etc."

Each reply has its own copy button.

TAB 8 — SERIES PLANNER
Input: series concept/theme.
Number of parts (2-10).
"Plan Series" button.

AI prompt:
"Plan a [n]-part Instagram content series on: [concept].
For each part:
PART [n]:
TITLE: (punchy episode title)
HOOK: (first line on camera)
CORE POINT: (what this part establishes — one sentence)
CLIFFHANGER/BRIDGE: (how this part makes them want the next one)

Series rules: each part works standalone but rewards watching all. Part 1 must be the strongest hook. Build toward a payoff. Anirudh's voice throughout — no em dashes."

Save series to database. Posts in the series link to it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE: /library
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Content CRM. Card view default, table view toggle.

Filters: pillar / platform / status / series / date range
Search: title and script content

Post card shows: title, pillar color dot, platform badge, status badge, scheduled date, first 120 chars of script, performance stats if logged (views/saves as small numbers).

Click card: full editor drawer/modal.
Editor fields: title, pillar, platform, status, scheduled date, hook, script, caption, hashtags, notes, series assignment.
Action buttons: Regenerate Caption / Regenerate Hook / Repurpose to Another Platform / Open Teleprompter.
Status pipeline: idea → scripted → filmed → edited → posted. Clicking advances to next status.
When status set to "posted": prompt to enter posted_date and performance stats.

Status badge colors: idea=muted, scripted=blue, filmed=yellow, edited=coral, posted=green.

"New Post" button.
Bulk actions: delete selected, change status of selected, schedule selected.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE: /teleprompter
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Full-screen mode optimized for mobile recording.

Features:
- Takes script text (from a saved post or freeform paste)
- Large, high-contrast, readable text (white on black, Syne font, 28-36px depending on script length)
- Auto-scrolling: adjustable speed (slider at bottom, 1-10 scale)
- Tap to pause / resume scroll
- Mirror mode toggle (flip horizontally for recording with a mirror setup)
- Font size controls (increase/decrease)
- Scroll position indicator (% bar at top)
- "Done" to exit

Accessible at /teleprompter?postId=[id] (loads post script) or /teleprompter (manual paste mode).
Link to this from every post in the library.
Works offline once loaded (critical — you're often recording in places without great signal).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE: /calendar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Monthly calendar view.

Posts with scheduled_date show as colored chips on their date, colored by pillar.
Click date: see all posts that day, click any to open editor.
Empty date: "Schedule a post" quick action.
Unscheduled posts in a sidebar "Backlog" column, draggable onto dates.
Week view toggle.
"Fill This Week" button: AI suggests which of the unscheduled backlog posts to put on which days based on pillar balance (one AI call with the backlog list + pillar schedule rules).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE: /story-bank
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Grid of all Story Mine entries.

Card shows: raw memory (truncated 100 chars), mined angle (full), pillar badge, "Used" or "Unused" toggle.
Filter: all / unused / used
Click: expand full mined output.
"Convert to Post" on each card.
"Re-mine" button: re-runs the AI on the same raw memory (outputs new angle, useful if first one missed).
Delete button.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE: /ideas
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Quick idea capture. Fast and frictionless.

Top: input field + pillar dropdown + priority selector + Enter to save.
List below sorted by priority then created_at.
"Convert to Script" on each idea: calls the appropriate pillar AI and opens result in /generate.
Inline edit. Delete. Toggle converted.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE: /series
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Manage multi-part series.

Series list: name, pillar, total parts, how many parts have posts assigned.
Click series: see all posts in it in order, status of each.
"Create Series" → opens Series Planner (same as /generate tab 8).
Drag to reorder parts.
Progress bar per series: parts complete / total.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE: /analytics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Manual performance logging + AI analysis. (No third-party API — you log stats yourself when you check your phone.)

SECTION 1 — LOG PERFORMANCE
Dropdown to select a posted post. Fields: views, likes, saves, comments, shares, follows_gained. Save updates the post record.

SECTION 2 — PERFORMANCE OVERVIEW
Bar chart: views by post (last 30 posts, labeled by title)
Bar chart: saves by post
Line chart: follows_gained over time
Pillar breakdown: avg views per pillar (shows which content type performs best)
Best performers: top 5 posts by saves (saves = algorithm signal for Instagram)

SECTION 3 — WEEKLY REVIEW
Every Monday: prompt to fill out weekly_reviews record.
Fields: posts published, total views, followers gained, top post (dropdown), what worked, what to double down, what to cut, next week focus.
AI summary button: "Analyze My Week" — AI reads the week's performance data and gives 3 specific, honest recommendations. Prompt:
"Here is Anirudh's content performance data for the past week: [data].
Give 3 specific, blunt recommendations. Not generic advice. Based on what the numbers actually show.
What pillar is underperforming and why it might be.
What to post more of based on saves specifically.
One thing to cut or change.
No fluff. No encouragement. Just what the data says."

SECTION 4 — HASHTAG VAULT
Saved hashtag sets from hashtag_sets table.
Each set: name, tags, use count, last used.
"Copy" button, "Use in Post" dropdown.
Create/edit/delete sets.
"Analyze" button: AI suggests which tags to keep and cut based on niche and specificity.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE: /settings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1 — CONTEXT EDITOR
Large textarea: "Personal context additions."
This text is appended to the base system prompt on every AI call.
Helper: "Update this when Ada hits a milestone, when you move to SF, when you launch, when something big changes. This keeps the AI current."
Save stored in user_settings with key="context_additions".

SECTION 2 — PILLAR WEIGHTS
Sliders: how many times per week to post each pillar (1-7).
These weights inform the "Fill This Week" calendar feature and the "Today's Prompt" on the dashboard.

SECTION 3 — WEEKLY SCHEDULE TEMPLATE
Days of the week, each with a dropdown: which pillar to post that day.
Editable. This drives the /calendar default layout.

SECTION 4 — PLATFORM DEFAULTS
Which platform to default to on new posts (instagram default).
Toggle: cross-post reminders on/off.

SECTION 5 — PROFILE BIO GENERATOR
Button: "Generate Platform Bios."
AI generates tailored bios for Instagram, LinkedIn, X, and Threads in Anirudh's voice, within character limits.
Output: all 4 bios with character counts and copy buttons.
AI prompt:
"Write optimized profile bios for Anirudh Manjesh for Instagram, LinkedIn, X (Twitter), and Threads. Character limits: Instagram 150, LinkedIn 220, X 160, Threads 150.
Bio must convey: CS founder + researcher + 36 hackathons + Ada (tryada.app) + heading to SF.
Voice: punchy, specific, no fluff, no em dashes. No generic phrases like 'passionate about' or 'building the future.'
Return each labeled with platform and character count."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
API ROUTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
All Claude calls through Next.js API routes (API key never in client):

POST /api/generate
Body: { prompt: string, systemOverride?: string }
Server: verify Supabase session, fetch user's context_additions from user_settings, build full system prompt (base + context_additions), call Claude, return { text: string }

All routes return 401 if no valid session.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENV VARS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUALITY REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Full mobile responsiveness — this app is used on a phone
- All AI calls have loading states with skeleton screens
- All outputs have copy buttons
- All forms have error handling with visible user messages
- Optimistic UI on status changes
- No em dashes in any UI copy anywhere in the codebase. Search and remove any before finishing.
- RLS enabled and tested on all Supabase tables
- Teleprompter page works offline once loaded
- Charts on /analytics use a lightweight library (recharts or similar)
- Draggable calendar backlog uses react-beautiful-dnd or similar

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
README
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Include README.md:
1. Create Supabase project
2. Run SQL schema (include full schema as a supabase/schema.sql file)
3. Add env vars to .env.local
4. npm install && npm run dev
5. Seed first user via Supabase dashboard
6. Deploy to Vercel (env vars needed)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUILD ORDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. supabase/schema.sql (all tables + RLS policies)
2. lib/supabase.ts and lib/claude.ts (API clients)
3. /api/generate route
4. Layout, navigation, auth middleware
5. /login
6. /dashboard
7. /generate (all 8 tabs)
8. /library + editor drawer
9. /teleprompter
10. /calendar
11. /story-bank
12. /ideas
13. /series
14. /analytics
15. /settings
16. README.md