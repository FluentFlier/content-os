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

## Required Skills

- `agent-browser` - For verifying UI changes, responsive layouts, and user flows. Invoke when the feature involves any visible UI change to verify it renders correctly.

## Work Procedure

1. **Read the feature description** thoroughly. Understand preconditions, expected behavior, and verification steps.

2. **Read ALL files you will modify** before making any changes. Understand existing patterns.

3. **Write tests first (when applicable)**:
   - For API routes: write curl-testable assertions or integration test cases
   - For components: verify behavior via agent-browser after implementation
   - For schema changes: verify via API route tests

4. **Implement the feature**:
   - Follow AGENTS.md coding conventions strictly
   - Match existing code patterns in surrounding files
   - Use InsForge SDK patterns from lib/insforge/
   - All API routes: `getAuthenticatedUser()` first, Zod validation, user_id scoping
   - All styling: Tailwind classes only, follow Brand Guide (light theme, Syne/Space Grotesk)
   - No em dashes anywhere
   - Files under 500 lines

5. **Verify with build**:
   - Run `npm run build` -- must pass with zero errors
   - Run `npm run lint` -- fix any issues
   - If typecheck errors exist, fix them

6. **Manual verification**:
   - Start dev server: `PORT=3000 npm run dev`
   - For UI features: use `agent-browser` to navigate to the page, take screenshots, verify layout
   - For API features: use curl to test endpoints with valid/invalid inputs
   - For responsive features: test at 390px viewport width
   - Stop dev server when done

7. **Check for regressions**:
   - If modifying shared components (nav, layout, utils), verify 2-3 pages that use them still work
   - If modifying API routes, verify the pages that call them still render

8. **Commit** with a descriptive message.

## Example Handoff

```json
{
  "salientSummary": "Fixed mobile nav to include Story Bank, Ideas, Series, Analytics via a 'More' slide-up drawer. Built MoreMenu.tsx component with 4 additional nav items. Verified at 390x844 viewport with agent-browser -- all pages reachable. npm run build passes.",
  "whatWasImplemented": "Added MoreMenu component to BottomBar.tsx that renders a slide-up drawer with Story Bank, Ideas, Series, and Analytics links. Trigger is a '...' icon in the 5th BottomBar slot. Drawer uses existing Modal pattern with portal. Added /story-bank, /ideas, /series, /analytics nav items with correct icons and active state detection.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      { "command": "npm run build", "exitCode": 0, "observation": "Compiled successfully, no errors" },
      { "command": "npm run lint", "exitCode": 0, "observation": "No warnings" }
    ],
    "interactiveChecks": [
      { "action": "Opened /dashboard at 390px width via agent-browser", "observed": "BottomBar visible with 5 items including '...' More button. Sidebar hidden." },
      { "action": "Clicked More button", "observed": "Drawer slides up showing Story Bank, Ideas, Series, Analytics links" },
      { "action": "Clicked Story Bank link in More menu", "observed": "Navigated to /story-bank, page renders correctly at 390px" },
      { "action": "Checked /analytics at 390px", "observed": "Page renders, charts scroll horizontally, no overflow" }
    ]
  },
  "tests": {
    "added": []
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- Feature depends on an API endpoint, table, or component that doesn't exist yet
- InsForge SDK method doesn't match expected API (check actual SDK types)
- Requirements conflict with existing code patterns
- Build fails due to issues outside the feature's scope
- .env.local is missing and server-side functionality can't be tested
