---
name: social-worker
description: Worker for social media OAuth integrations, publishing flows, and platform API work in Dispatch.
---

# Social Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Features that involve:
- OAuth connect/callback routes for Twitter, LinkedIn, Instagram, Threads
- Social publishing (POST /api/publish and platform clients)
- Token storage, encryption, and refresh
- Manual API key entry (BYOK) in Settings
- Publish UI in PostEditorDrawer

## Required Skills

- `agent-browser` - For verifying Settings UI (platform connections, publish panel). Invoke when implementing UI-facing changes.

## Work Procedure

1. **Read the feature description** and identify which platforms are affected.

2. **Read existing platform code**:
   - `src/lib/platforms/twitter.ts` - Twitter API v2 client
   - `src/lib/platforms/linkedin.ts` - LinkedIn REST API
   - `src/lib/platforms/instagram.ts` - Instagram Graph API
   - `src/lib/platforms/threads.ts` - Threads Publishing API
   - `src/app/api/social-accounts/` - All OAuth and management routes
   - `src/app/api/publish/route.ts` - Publishing endpoint
   - `src/components/library/PublishPanel.tsx` - Publish UI

3. **For OAuth routes**:
   - Connect: Generate crypto.randomUUID() state, store in httpOnly cookie (sameSite=lax, maxAge=600)
   - Include state in redirect URL to platform
   - Callback: Validate state from cookie matches query param
   - Exchange authorization code for tokens
   - For Instagram: exchange short-lived for long-lived token
   - Store tokens via internal API (POST /api/social-accounts)
   - Clear OAuth cookies (maxAge=0) after callback
   - Redirect to /settings?connected={platform} on success
   - Redirect to /settings?error={message} on failure

4. **For token encryption** (if feature requires):
   - Create encrypt/decrypt utility using AES-256-GCM
   - Encryption key from process.env.TOKEN_ENCRYPTION_KEY
   - Encrypt before storage, decrypt before use
   - Never log or expose plaintext tokens

5. **For publishing**:
   - Check token expiry (token_expires_at) before publish
   - If expired and refresh_token exists, attempt refresh
   - Call platform-specific publish function
   - Update post status to 'posted' on success
   - Return clear error messages on failure

6. **For BYOK UI**:
   - Password-masked input fields (type="password" with toggle)
   - Store in creator_profile.platform_config JSONB
   - Never log credentials to console

7. **Verify**:
   - `npm run build` must pass
   - Test OAuth connect routes via curl (verify redirect URL and cookies)
   - Test callback with invalid state (should error)
   - Test publish route with/without auth
   - For UI changes: verify with agent-browser

## Example Handoff

```json
{
  "salientSummary": "Implemented Twitter OAuth connect/callback with PKCE, state validation via httpOnly cookies, and token persistence. Tested connect route returns correct redirect URL with PKCE params. Callback validates state and exchanges code. npm run build passes.",
  "whatWasImplemented": "Updated api/social-accounts/connect/twitter/route.ts with PKCE code challenge, crypto.randomUUID state, httpOnly cookie storage. Updated callback to validate state, exchange code via twitter-api-v2 loginWithOAuth2, persist tokens to social_accounts table, clear cookies, redirect to /settings.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      { "command": "npm run build", "exitCode": 0, "observation": "No errors" },
      { "command": "curl -v http://localhost:3000/api/social-accounts/connect/twitter", "exitCode": 0, "observation": "302 redirect to twitter.com/i/oauth2/authorize with code_challenge param, Set-Cookie headers for state and verifier" }
    ],
    "interactiveChecks": [
      { "action": "Checked callback with invalid state via curl", "observed": "Redirects to /settings?error=Invalid+OAuth+state" }
    ]
  },
  "tests": { "added": [] },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- Platform API has changed and docs are needed
- OAuth credentials not configured in .env.local
- InsForge storage not accessible for image uploads (Instagram)
- Token encryption key not in environment
