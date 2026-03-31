# User Testing

## Validation Surface

### Web Browser (Primary)
- **URL:** http://localhost:3000
- **Tool:** agent-browser
- **Setup:** Start dev server with `PORT=3000 npm run dev`, wait for compilation
- **Auth:** Login via Google OAuth at /login, or set dispatch-token cookie manually

### API Endpoints
- **URL:** http://localhost:3000/api/*
- **Tool:** curl
- **Auth:** Include `Cookie: dispatch-token=<valid-token>` header
- **Setup:** Same dev server as above

## Validation Concurrency

### agent-browser
- Machine: 16 GB RAM, 8 CPU cores
- Baseline usage: ~6 GB
- Dev server: ~530 MB
- Per agent-browser instance: ~300 MB
- Usable headroom (70%): (16 - 6) * 0.7 = 7 GB
- **Max concurrent validators: 5**
- Rationale: 5 instances * 300 MB = 1.5 GB + 530 MB dev server = 2.03 GB, well within 7 GB headroom

## Testing Notes

- The project has NO test suite (no unit/integration tests). Validation is through build + lint + manual verification.
- Build command: `npm run build` (must pass with exit code 0)
- Lint command: `npm run lint`
- Dev server starts in ~1.7s, first page load takes ~2.6s (includes compilation)
- OAuth testing requires real credentials in .env.local
- BYOK testing can use any valid API keys for the target platforms
- Scheduled publishing cron testing: call /api/cron/publish with CRON_SECRET header

## Auth Bootstrap for Testing

1. Navigate to http://localhost:3000/login
2. Click "Sign in with Google" (requires InsForge OAuth configured)
3. Complete Google OAuth flow
4. dispatch-token cookie is set automatically
5. User is redirected to /dashboard (or /onboarding if new user)

Alternative: Set dispatch-token cookie manually via browser devtools or curl header for API testing.
