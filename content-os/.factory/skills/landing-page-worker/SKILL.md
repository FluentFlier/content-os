---
name: landing-page-worker
description: Specialized worker for building and polishing the Dispatch public landing page following the Brand Guide.
---

# Landing Page Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Features that involve:
- Building or redesigning the public landing page at src/app/page.tsx
- Landing page sections (hero, features, how-it-works, CTA, footer)
- Marketing copy and brand compliance
- Responsive layout for the landing page

## Required Skills

- `agent-browser` - MUST use to verify every section renders correctly, responsive at 390px, and brand fonts load. Invoke after implementation to take full-page screenshots.

## Work Procedure

1. **Read the Brand Guide** at `/Users/anirudhmanjesh/hackathons/content-os/Dispatch Brand Guide.md`. This is the authoritative source for colors, typography, spacing, and copy guidelines.

2. **Read the current landing page** at `src/app/page.tsx` and `src/app/globals.css` and `tailwind.config.ts` to understand existing styles.

3. **Plan the sections**:
   - Hero: Value prop headline (Syne 800), subtext (Space Grotesk), two CTAs
   - Problem/Solution: 3-column grid with icons
   - Features Showcase: Card grid (6+ feature cards)
   - How It Works: 3 steps
   - CTA Section: Final signup push
   - Footer: Minimal

4. **Implement following Brand Guide strictly**:
   - Background: #FAFAF8 (warm near-white), NOT pure white or dark
   - Text: #1A1714 (primary), #4A4540 (secondary), #8C857D (tertiary)
   - Accent: #EB5E55 (coral) for CTAs only
   - Headings: Syne 700/800, font-display Tailwind class
   - Body: Space Grotesk 400/500, font-body Tailwind class
   - Borders: 0.5px, #1A1714 at 12% opacity
   - Border radius: 12px cards, 6-8px buttons
   - No em dashes in any copy
   - No exclamation marks in UI copy
   - CTAs: "Get Started" links to /login?mode=signup, "Sign In" links to /login
   - All icons: inline SVG, 20x20, no icon library
   - Animations: fade-in on scroll only, max 200ms

5. **Make it responsive**:
   - Mobile-first design
   - Test at 390px width
   - Cards stack to single column on mobile
   - Min 44px tap targets
   - No horizontal scroll

6. **Verify with agent-browser**:
   - Full-page screenshot at desktop width
   - Full-page screenshot at 390px width
   - Verify all links navigate correctly
   - Check computed font-family on headings (should be Syne)
   - Check background color is warm, not pure white

7. **Build verification**:
   - `npm run build` must pass
   - `npm run lint` must pass

## Example Handoff

```json
{
  "salientSummary": "Rebuilt landing page following Dispatch Brand Guide. Six sections: hero with value prop + dual CTAs, 3-col problem/solution, 8 feature cards, 3-step how-it-works, CTA with signup button, minimal footer. Fully responsive at 390px. Brand fonts verified via agent-browser.",
  "whatWasImplemented": "Complete landing page at src/app/page.tsx with hero (Syne 800 headline, coral CTA to /login?mode=signup), problem grid, features showcase (8 cards with inline SVG icons), how-it-works steps, final CTA, and footer. Uses #FAFAF8 background, all Tailwind classes (no inline styles). Added IntersectionObserver-based fade-in for sections.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      { "command": "npm run build", "exitCode": 0, "observation": "Landing page compiled successfully" },
      { "command": "npm run lint", "exitCode": 0, "observation": "No issues" }
    ],
    "interactiveChecks": [
      { "action": "Opened / at 1280px via agent-browser", "observed": "Hero renders with Syne heading, coral CTA visible, warm background" },
      { "action": "Scrolled through all sections", "observed": "Features grid shows 8 cards, how-it-works has 3 steps, footer minimal" },
      { "action": "Clicked 'Get Started'", "observed": "Navigated to /login?mode=signup" },
      { "action": "Set viewport to 390x844", "observed": "Cards stack, no horizontal scroll, CTAs tappable at 44px+" },
      { "action": "Checked getComputedStyle on h1", "observed": "fontFamily starts with 'Syne'" }
    ]
  },
  "tests": { "added": [] },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- Brand Guide has conflicting guidance with existing tailwind config
- Google Fonts not loading (network issue)
- Existing page.tsx structure conflicts with auth redirect logic
