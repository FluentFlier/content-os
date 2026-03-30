# User Testing

Testing surface, required tools, and resource cost classification.

---

## Validation Surface

### Primary: Browser (agent-browser)
- **Dev server**: Next.js on port 3000 (`npm run dev`)
- **Pages to test**: Landing (/), Login (/login), Onboarding (/onboarding), Dashboard (/dashboard), Generate (/generate), Library (/library), Calendar (/calendar), Story Bank (/story-bank), Ideas (/ideas), Series (/series), Analytics (/analytics), Settings (/settings), Teleprompter (/teleprompter), Video Studio (/video-studio)
- **Auth flow**: Signup at /login?mode=signup, then onboarding at /onboarding
- **Mobile testing**: 390x844 viewport for responsive checks
- **Brand compliance**: Syne headings, Space Grotesk body, warm light theme (#FAFAF8)

### Secondary: curl
- **API routes**: All /api/* endpoints
- **Auth testing**: Unauthenticated requests should return 401
- **Validation testing**: Invalid inputs should return 400

## Validation Concurrency

### agent-browser
- **Machine**: 16GB RAM, 8 CPU cores
- **Baseline utilization**: ~77% CPU, ~3.6GB memory headroom
- **Per-validator cost**: ~500MB-1GB (dev server + headless browser)
- **Max concurrent validators**: **2**
- **Rationale**: Conservative limit due to moderate memory pressure and high CPU baseline. System shows significant swap activity. Sharing a single dev server helps.

## Testing Notes

- InsForge credentials must be in `.env.local` for any server-side functionality to work
- Landing page (/) and login (/login) work without credentials (static rendering)
- Dashboard and protected pages require valid auth token
- Social publishing tests require connected accounts with valid tokens
- Video studio tests require remotion and @remotion/player to be installed
