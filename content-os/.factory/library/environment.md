# Environment

Environment variables, external dependencies, and setup notes.

**What belongs here:** Required env vars, external API keys/services, dependency quirks.
**What does NOT belong here:** Service ports/commands (use `.factory/services.yaml`).

---

## Required Environment Variables

### InsForge (Required)
- `NEXT_PUBLIC_INSFORGE_URL` - InsForge project URL
- `NEXT_PUBLIC_INSFORGE_ANON_KEY` - InsForge anonymous key (safe for client)

### App
- `NEXT_PUBLIC_APP_URL` - App base URL for OAuth callbacks (default: http://localhost:3000)

### Social Media OAuth (Optional - for social publishing)
- `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET`
- `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET`
- `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET`
- `THREADS_APP_ID` / `THREADS_APP_SECRET`

### Security
- `TOKEN_ENCRYPTION_KEY` - AES-256 key for encrypting stored OAuth tokens

## External Dependencies

- **InsForge** - Backend-as-a-service (auth, PostgreSQL, storage, AI gateway)
- **Twitter API v2** - Social publishing (via twitter-api-v2 npm package)
- **LinkedIn API** - Social publishing (REST, Posts API)
- **Instagram Graph API** - Social publishing (requires Facebook app, image-only)
- **Threads Publishing API** - Social publishing (text posts)
- **Google Fonts** - Syne + Space Grotesk loaded via link tags

## Dependency Notes

- `@anthropic-ai/sdk` has been removed from package.json - AI calls go through InsForge AI gateway
- `@insforge/nextjs` has been removed from package.json - using @insforge/sdk directly
- `@hello-pangea/dnd` - needed for calendar drag-and-drop (was installed but not used yet)
- `remotion` + `@remotion/player` - needed for video studio (to be installed)
