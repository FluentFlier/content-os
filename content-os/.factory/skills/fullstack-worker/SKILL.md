---
name: fullstack-worker
description: Full-stack Next.js worker for bug fixes, features, and UI work in the Dispatch content platform.
---

# Fullstack Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Features that involve:
- Bug fixes across pages, API routes, and components
- New pages or page sections
- API route creation or modification
- Component creation or modification
- Database schema changes
- UI/UX improvements (empty states, loading states, responsive fixes)
- Multi-user generalization (removing hardcoded references, dynamic pillars)
- Content pipeline fixes (StoryMine, Ideas, Series flows)

## Required Skills

- `agent-browser` - For verifying UI changes, responsive layouts, and user flows. Invoke when the feature involves any visible UI change.

## Work Procedure

1. **Read the feature description** thoroughly. Understand preconditions, expected behavior, and verification steps.

2. **Read ALL files you will modify** before making any changes. Understand existing patterns.

3. **Implement the feature**:
   - Follow AGENTS.md coding conventions strictly
   - Match existing code patterns in surrounding files
   - Use InsForge SDK patterns from lib/insforge/
   - All API routes: `getAuthenticatedUser()` first, Zod validation for POST/PATCH, user_id scoping
   - All styling: Tailwind classes only, dark theme (#09090B, #18181B, Syne/Space Grotesk)
   - No em dashes anywhere
   - Files under 500 lines
   - For schema changes: update db/schema.sql only (single source of truth)

4. **Verify with build**:
   - Run `npm run build` - must pass with zero errors
   - Run `npm run lint` - fix any issues

5. **Manual verification**:
   - Start dev server: `PORT=3000 npm run dev &` (background)
   - For UI features: use `agent-browser` to navigate, take screenshots, verify layout
   - For API features: use curl with valid auth cookie to test endpoints
   - For responsive features: test at 390px viewport width with agent-browser
   - Stop dev server when done: `lsof -ti :3000 | xargs kill -9 2>/dev/null || true`

6. **Check for regressions**:
   - If modifying shared components (nav, layout, utils), verify 2-3 pages that use them
   - If modifying API routes, verify pages that call them still render

7. **Commit** with a descriptive message.

## Example Handoff

```json
{
  "salientSummary": "Added middleware auth enforcement for all protected routes. Unauthenticated requests to /dashboard, /settings, etc. now redirect to /login via 307. Verified with curl (no cookie -> 307) and agent-browser (redirect works in browser). npm run build passes.",
  "whatWasImplemented": "Updated src/middleware.ts to check for dispatch-token cookie on 12 protected route prefixes. Returns NextResponse.redirect to /login when cookie absent. Also redirects authenticated users from /login to /dashboard. Added /onboarding to protected routes list.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      { "command": "npm run build", "exitCode": 0, "observation": "Compiled successfully" },
      { "command": "npm run lint", "exitCode": 0, "observation": "No warnings" },
      { "command": "curl -v http://localhost:3000/dashboard", "exitCode": 0, "observation": "307 redirect to /login" },
      { "command": "curl -v http://localhost:3000/settings", "exitCode": 0, "observation": "307 redirect to /login" }
    ],
    "interactiveChecks": [
      { "action": "Opened /dashboard without auth via agent-browser", "observed": "Redirected to /login page" },
      { "action": "Opened /login with valid session", "observed": "Redirected to /dashboard" }
    ]
  },
  "tests": { "added": [] },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- Feature depends on an API endpoint, table, or component that doesn't exist yet
- InsForge SDK method doesn't match expected API (check actual SDK types)
- Requirements conflict with existing code patterns
- Build fails due to issues outside the feature's scope
- .env.local is missing and server-side functionality can't be tested
