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
- Ensure `NEXT_PUBLIC_INSFORGE_URL` and `NEXT_PUBLIC_INSFORGE_ANON_KEY` are present in the active dev-server environment before browser validation. Missing either causes runtime boot errors and blocks UI flows.
- If `.env.local` is missing, `/login` can render a Next.js runtime error state (`Missing NEXT_PUBLIC_INSFORGE_URL or NEXT_PUBLIC_INSFORGE_ANON_KEY`) instead of a testable auth form.
- Landing page (/) and login (/login) work without credentials (static rendering)
- Dashboard and protected pages require valid auth token
- API assertions for protected routes (for example `/api/posts`) require a real authenticated InsForge session cookie. Dummy/local auth cookie attempts are insufficient.
- Social publishing tests require connected accounts with valid tokens
- Video studio tests require remotion and @remotion/player to be installed
- Current branch observation (2026-03-30): unauthenticated `/video-studio` returned `404` instead of redirecting to `/login` during contract check `VAL-CROSS-006`.

## Flow Validator Guidance: agent-browser

- Base URL is `http://localhost:3000`
- Use isolated test user accounts per validator run. Do not reuse accounts across concurrent browser validators.
- Stay within assigned assertion list and only touch data needed for those checks.
- Avoid global destructive actions (such as broad bulk-delete) unless explicitly required by the assigned assertion.
- Capture screenshots for each assertion outcome and include exact route URLs and observed UI text in the flow report.
- For mobile checks, use `390x844` viewport and verify both visibility and navigability.

## Flow Validator Guidance: curl

- Use only `http://localhost:3000` API endpoints and keep requests scoped to assigned assertions.
- Prefer dedicated test records created during the validator run and cleanly track created IDs in the report.
- Include full request method/path, status code, and relevant response body excerpts as evidence.
- Do not call external third-party APIs directly; only verify local app routes and behavior.
- For build validation assertions, run commands from the repo root and capture exit code plus key output lines.
