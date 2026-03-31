---
name: social-worker
description: Worker for social media OAuth integrations, publishing flows, BYOK credentials, and platform API work in Dispatch.
---

# Social Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Features that involve:
- OAuth connect/callback routes for Twitter, LinkedIn, Instagram, Threads
- Social publishing (POST /api/publish and platform clients)
- Token storage, encryption, and refresh
- BYOK (Bring Your Own Keys) credential management
- Publish UI (PublishPanel, BulkPublishPanel)
- Multi-platform optimization API
- Scheduled publishing

## Required Skills

- `agent-browser` - For verifying Settings UI (platform connections, BYOK inputs, publish panel). Invoke when implementing UI-facing changes.

## Work Procedure

1. **Read the feature description** and identify which platforms are affected.

2. **Read existing platform code**:
   - `src/lib/platforms/twitter.ts` - Twitter API v2 client
   - `src/lib/platforms/linkedin.ts` - LinkedIn REST API
   - `src/lib/platforms/instagram.ts` - Instagram Graph API
   - `src/lib/platforms/threads.ts` - Threads Publishing API
   - `src/app/api/social-accounts/` - All OAuth and management routes
   - `src/app/api/publish/route.ts` - Publishing endpoint
   - `src/lib/crypto.ts` - AES-256-GCM encryption

3. **For OAuth routes**:
   - Connect: `getAuthenticatedUser()` first (401 if not authed)
   - Generate crypto.randomUUID() state, store in httpOnly cookie
   - Callback: Validate state from cookie matches query param
   - Exchange authorization code for tokens
   - Store tokens DIRECTLY via `getServerClient().database` (NO self-fetch to own API)
   - Encrypt tokens with `encryptToken()` before storage
   - Clear OAuth cookies after callback
   - Redirect to /settings?connected={platform}

4. **For BYOK**:
   - POST /api/social-accounts/byok: Zod validation, encrypt all credentials, store in social_accounts with connection_method='byok'
   - POST /api/social-accounts/test: Validate credentials against platform API WITHOUT storing
   - Settings UI: password-masked inputs (type="password" with Eye/EyeOff toggle)
   - Twitter BYOK needs 4 keys; LinkedIn/Instagram/Threads need 1 token each

5. **For publishing**:
   - Check for OAuth account first, then BYOK as fallback
   - Twitter BYOK: use OAuth 1.0a (4-key) via twitter-api-v2
   - Others: use bearer token
   - Check token expiry before publish, attempt refresh if expired
   - Update post status to 'posted' on success
   - Return clear error messages on failure
   - Never log or expose plaintext tokens

6. **For optimization API**:
   - POST /api/optimize: auth check, Zod validation
   - Call generateContent() with platform-specific optimization prompts
   - Return variants array with: platform, content, characterCount, isThread, threadParts
   - Twitter: auto-thread if >280 chars
   - Instagram: note image requirement

7. **Verify**:
   - `npm run build` must pass
   - Test routes via curl (valid auth, invalid auth, invalid input)
   - For UI changes: verify with agent-browser
   - Stop dev server when done

## Example Handoff

```json
{
  "salientSummary": "Implemented BYOK credential storage API with AES-256-GCM encryption. POST /api/social-accounts/byok validates per-platform fields via Zod, encrypts all values, stores in social_accounts. Test endpoint validates without storing. Verified all 4 platforms with curl. npm run build passes.",
  "whatWasImplemented": "Created src/app/api/social-accounts/byok/route.ts with Zod schema (Twitter: 4 keys, others: 1 token). Created src/app/api/social-accounts/test/route.ts that calls platform profile APIs to validate. Updated publish route to check BYOK as fallback when no OAuth account exists. Twitter BYOK uses OAuth 1.0a auth method.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      { "command": "npm run build", "exitCode": 0, "observation": "No errors" },
      { "command": "curl -X POST /api/social-accounts/byok -H 'Cookie: dispatch-token=...' -d '{\"platform\":\"twitter\",\"credentials\":{\"api_key\":\"test\"}}'", "exitCode": 0, "observation": "400 - missing required fields for Twitter" },
      { "command": "curl -X POST /api/social-accounts/test -d '{\"platform\":\"twitter\",\"credentials\":{...}}'", "exitCode": 0, "observation": "Returns {valid:false} for invalid keys" }
    ],
    "interactiveChecks": [
      { "action": "Checked Settings BYOK UI via agent-browser", "observed": "Password-masked inputs visible, eye toggle works, save triggers API call" }
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
- InsForge SDK method names differ from expected
