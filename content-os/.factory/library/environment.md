# Environment

Environment variables, external dependencies, and setup notes.

**What belongs here:** Required env vars, external API keys/services, dependency quirks, platform-specific notes.
**What does NOT belong here:** Service ports/commands (use `.factory/services.yaml`).

---

## Required Environment Variables

### InsForge (required for all functionality)
- `NEXT_PUBLIC_INSFORGE_URL` - InsForge backend URL (e.g. https://your-app.region.insforge.app)
- `NEXT_PUBLIC_INSFORGE_ANON_KEY` - InsForge anonymous key for browser client

### Social Media OAuth (required for OAuth connect flows)
- `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET`
- `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET`
- `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET`
- `THREADS_APP_ID` / `THREADS_APP_SECRET`

### Security
- `TOKEN_ENCRYPTION_KEY` - 32-byte hex key for AES-256-GCM token encryption (generate: `openssl rand -hex 32`)

### App
- `NEXT_PUBLIC_APP_URL` - App base URL (default: http://localhost:3000)
- `CRON_SECRET` - Secret for protecting cron endpoints

## File Locations
- `.env.local` - Local credentials (gitignored)
- `.env.example` - Template with variable names

## Dependencies
- `@insforge/sdk` - BaaS SDK
- `twitter-api-v2` - Twitter/X API client
- `zod` - Runtime validation
- `date-fns` - Date formatting
- `recharts` - Charting
- `@hello-pangea/dnd` - Drag and drop for calendar
- `lucide-react` - Icons

## Repository Topology
- Git root is `/Users/anirudhmanjesh/hackathons` (the `content-os` project is a subdirectory).
- For scoped commits from this project, prefer path-scoped staging (for example `git add content-os/<path>`) and review staged scope with `git diff --cached -- content-os/` before commit.
