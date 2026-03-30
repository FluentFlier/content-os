# Dispatch Brand Guide
### Version 1.0 — March 2026

---

## What Dispatch Is

Dispatch is a private content command center for Anirudh Manjesh. It is not a social media tool. It is not a scheduling app. It is the place where raw ideas become real content -- from the first rough memory to a scripted, filmed, edited, posted piece of work.

The name earns its meaning twice. Dispatch as in sending something out into the world. Dispatch as in speed and efficiency -- getting things done without ceremony.

Everything about Dispatch's brand should reinforce that. No decoration for decoration's sake. Every design decision exists to make the work faster and the output better.

---

## Brand Personality

**Productive.** Dispatch is a tool you work in, not a dashboard you look at. It should feel like a well-organized workspace, not a portfolio.

**Earned.** Anirudh has 36 hackathons, 3 years of neuroscience research, TackBraille deployed across three African countries, and an AI startup at 250 signups with zero ad spend. The brand reflects that credibility. Nothing is generic. Nothing is vague.

**Direct.** No filler copy. No onboarding tips. No "Welcome back!" No em dashes. If a label can be shorter, make it shorter. If a heading can be more specific, make it specific.

**Alive.** The content pipeline is always moving. The brand should feel like something is actively happening -- posts in progress, ideas queuing up, performance coming in. Not static.

---

## Logo and Wordmark

**Primary wordmark:** DISPATCH in all caps, Syne 800, letter-spacing 0.16em.

**Usage:**
- Top of sidebar, always in `--text-primary`
- Never stretched, rotated, or recolored
- Never placed on a dark background in the main UI -- sidebar background is always light

**Subtext below wordmark:** "Anirudh / tryada.app" in Space Grotesk 400, 11px, `--text-tertiary`. This grounds the app as a personal tool, not a product.

**No logomark.** Dispatch does not have an icon or symbol. The wordmark is the identity.

---

## Color System

### Backgrounds

| Name | Hex | Usage |
|------|-----|-------|
| Background Primary | `#FAFAF8` | Main content area, card surfaces |
| Background Secondary | `#F4F2EF` | Sidebar, input fields, muted surfaces |
| Background Tertiary | `#EDECEA` | Hover states, very subtle separation |

Backgrounds are warm, not cold. `#FAFAF8` reads as near-white with a slight cream warmth. This is intentional -- it reduces eye strain during long sessions and makes the coral accent feel warmer and more intentional.

Never use pure white (`#FFFFFF`) or pure black (`#000000`) anywhere in the UI.

### Text

| Name | Hex | Usage |
|------|-----|-------|
| Text Primary | `#1A1714` | Headings, post titles, key labels |
| Text Secondary | `#4A4540` | Body copy, descriptions, nav labels |
| Text Tertiary | `#8C857D` | Timestamps, helper text, placeholder copy |

Text follows a strict three-level hierarchy. If you are unsure which level to use, ask: is this information the user is looking for, information that supports what they are looking for, or information that is only relevant in context? Primary, secondary, or tertiary.

### Borders

| Name | Hex | Alpha | Usage |
|------|-----|-------|-------|
| Border Default | `#1A1714` | 12% | All dividers, card edges, input outlines |
| Border Hover | `#1A1714` | 25% | Hover state borders |
| Border Active | `#1A1714` | 40% | Focused input, active state |

All borders are `0.5px`. Never `1px` except for the single exception below.

**Exception:** Featured or "most important" cards in a group use `1.5px` on the left accent bar only. Everywhere else is `0.5px`.

### Accent -- Coral

| Name | Hex | Usage |
|------|-----|-------|
| Coral | `#EB5E55` | Primary CTA buttons, active nav item, streak numbers, pillar accent bars |
| Coral Light | `#FAECE7` | Badge backgrounds, hover fills on coral elements |
| Coral Dark | `#993C1D` | Badge text on coral light backgrounds |

Coral is the only strong accent in the entire UI. It does not compete with anything. Every other color is either neutral or a pillar color. When coral appears, it means: "this is the most important action on this screen" or "this is your active state."

Never use coral for decorative purposes. It earns its place by always meaning something.

### Pillar Colors

Each content pillar has its own color identity. These are used as left-edge accent bars on cards, colored dots in lists, and badge fill/text pairs. They are never used for anything other than pillar identification.

| Pillar | Bar / Dot | Badge Background | Badge Text |
|--------|-----------|-----------------|------------|
| Hot Take | `#EB5E55` | `#FAECE7` | `#993C1D` |
| Hackathon | `#F5C842` | `#FAEEDA` | `#854F0B` |
| Founder | `#4D96FF` | `#E6F1FB` | `#185FA5` |
| Explainer | `#C77DFF` | `#EEEDFE` | `#534AB7` |
| Origin | `#5CB85C` | `#EAF3DE` | `#3B6D11` |
| Research | `#F5C842` | `#FAEEDA` | `#854F0B` |

Hackathon and Research share yellow because both are about proving something through hard evidence -- one in competition, one in a lab. They are distinct enough in label that the shared color causes no confusion.

### Status Colors

Status badges follow the content pipeline: idea, scripted, filmed, edited, posted.

| Status | Background | Text |
|--------|-----------|------|
| Idea | `#F4F2EF` | `#8C857D` |
| Scripted | `#E6F1FB` | `#185FA5` |
| Filmed | `#FAEEDA` | `#854F0B` |
| Edited | `#FAECE7` | `#993C1D` |
| Posted | `#EAF3DE` | `#3B6D11` |

The pipeline reads warm to cool as work progresses -- muted gray at idea stage, warm amber at filmed, green at posted. This is intentional. Posted should feel like an achievement.

---

## Typography

### Typefaces

**Syne** -- headings, wordmark, sidebar name, teleprompter text.
- Weight used: 700 and 800 only
- Used for: page headings, card titles in featured contexts, the DISPATCH wordmark, teleprompter script text
- Letter spacing: `0em` for headings, `0.16em` for the wordmark only
- Never use Syne for body copy, labels, or anything under 16px

**Space Grotesk** -- all body text, labels, badges, inputs, navigation.
- Weight used: 400 (regular) and 500 (medium) only
- 600 and 700 are never used -- they read as too heavy against the warm backgrounds
- Used for: nav items, card body copy, badges, form labels, timestamps, helper text

### Type Scale

| Role | Font | Size | Weight | Letter Spacing |
|------|------|------|--------|---------------|
| Page heading | Syne | 20-22px | 800 | -0.02em |
| Section heading | Syne | 16-18px | 700 | 0 |
| Card title | Space Grotesk | 13px | 500 | 0 |
| Body copy | Space Grotesk | 13px | 400 | 0 |
| Labels, badges | Space Grotesk | 10-11px | 500 | 0.05-0.10em |
| Helper text | Space Grotesk | 11-12px | 400 | 0 |
| Timestamps | Space Grotesk | 11px | 400 | 0 |
| Section divider labels | Space Grotesk | 10px | 500 | 0.10em, uppercase |

Section divider labels (the uppercase muted labels like "UP NEXT" or "QUICK ACTIONS") are the only uppercase text in the UI. Everything else is sentence case. Always.

### Line Height

- Headings: 1.2
- Card titles: 1.3
- Body copy: 1.55
- Teleprompter script: 1.7 (optimized for reading aloud)

---

## Spacing

Dispatch uses an 8px base unit. All spacing values are multiples of 4px minimum, 8px preferred.

| Context | Value |
|---------|-------|
| Section padding (main content) | 24px 28px |
| Sidebar padding | 18px |
| Card padding | 13px 14px |
| Stat block padding | 18px 28px |
| Gap between badges | 4-6px |
| Gap between list items (inner) | 8px |
| Gap between cards in grid | 10-12px |

---

## Borders and Radius

**Border weight:** `0.5px` everywhere. This is not a typo. Half-pixel borders are the right weight for a tool this dense -- 1px borders make everything feel heavier and more rigid than it needs to be. Most modern displays render 0.5px correctly.

**Border radius:**

| Context | Value |
|---------|-------|
| Cards, large surfaces | 12px (`border-radius-lg`) |
| Buttons, inputs, dropdowns, badges | 6-8px (`border-radius-md`) |
| Pill badges (pillar, status) | 3px |
| Pillar pills in Generate (selector) | 20px (full pill) |
| Circular elements (dots, avatars) | 50% |

Left-edge accent bars on cards and list items: `border-radius: 2px`. Never rounded on the left edge -- it clips into the card. Always a flat edge where it touches the card border.

---

## Component Patterns

### Cards

Every card in the Library uses the same structure:

```
[3px accent bar in pillar color] [card body]
  Title (Space Grotesk 500, 13px)
  Badge row: [Pillar badge] [Status badge]
  Preview text (2 lines max, clipped)
  Footer: [Scheduled date] [Performance stats if posted]
```

Cards never have drop shadows. The `0.5px` border is the only separation from the background. On hover, border opacity increases to 25%. That is the only hover state for cards.

### Badges

Badges are used for two things: pillar identity and post status. They are never used for anything else.

- Font: Space Grotesk 500, 10px, letter-spacing 0.01em
- Padding: `2px 7px`
- Border radius: `3px`
- No border -- background color alone provides the badge shape

Never mix pillar badge colors with status badge colors in the same pill. They are separate elements in the same row.

### Buttons

**Primary (coral):** The most important action on any given screen. Used for "Generate Script", "Mine It", "Save to Library". Background `#EB5E55`, white text, no border.

**Secondary:** Supporting actions. Background `--bg-secondary`, border `0.5px --border-default`, text `--text-primary`.

**Ghost:** Tertiary actions. No background, `0.5px` border, `--text-secondary`. Used for "Refresh", "Cancel", inline quick actions.

**Yellow:** Used exclusively for the Story Mine "Mine It" button. Background `#F5C842`, black text. This is the one place the yellow pillar color is used for a button -- because Story Mine is the most important and distinctive feature in Generate.

Button padding: `10px 20px` for primary, `7px 14px` for secondary and ghost.

Never use rounded pill-shaped buttons except for the pillar selector in Generate. All other buttons use `border-radius-md` (6-8px).

### Navigation

Active nav item: `border-left: 2px solid #EB5E55`, text `#EB5E55`, background `--bg-primary`, font-weight 500.

Inactive: no left border, text `--text-secondary`, transparent background.

Hover: text `--text-primary`, background `--bg-primary`. No border on hover.

The colored dot next to each nav label matches the item's color state -- muted at 50% opacity when inactive, full opacity when active. The dot is 6x6px, border-radius 50%.

### Section Divider Labels

Used throughout the dashboard and sidebar to label groups of content. Always:
- Space Grotesk 500
- 10px
- Letter-spacing 0.10em
- All caps
- Color: `--text-tertiary`
- Margin-bottom: 12px

These labels are the only all-caps text in the entire UI.

### Left-Edge Accent Bars

The 3px colored left border on cards and list items is the primary way pillar identity is communicated at a glance. After a week of use, users stop reading badges and just read bars.

- Width: 3px
- Border-radius: 2px on the right edges, 0 on the left (flush with card edge)
- Color: pillar color, always full opacity, never muted
- Height: stretches full height of the card or list item content

---

## Motion and Interaction

Dispatch is a tool, not an experience. Animations are used sparingly and only where they reduce confusion or signal state.

**Allowed:**
- Nav item transitions: `transition: all 0.1s` -- fast enough to feel instant
- Button hover: opacity change `0.9` on coral buttons
- Card hover: border color change, `0.1s`
- Pillar pill selection: `border-color transition 0.1s`
- Skeleton loading: animated pulse on placeholder blocks during AI generation

**Not allowed:**
- Page transition animations
- Slide-in effects on page load
- Confetti or celebration animations
- Spinning loaders (use skeleton screens instead)
- Any animation over 200ms

The teleprompter is the one exception to all motion rules. Auto-scroll speed is the core interaction and is fully controllable by the user.

---

## Copy Guidelines

**Voice:** Direct, specific, Anirudh's actual voice. Copy in this app is not for a general audience -- it is written for one person who knows exactly who they are and what they are doing.

**Rules:**

- No em dashes anywhere. Use a hyphen or rewrite the sentence.
- No exclamation marks in UI copy. Ever.
- No "Welcome back!" or any greeting that performs enthusiasm.
- Greeting on dashboard: "What are we building today?" -- not "Good morning" or "Hi Anirudh."
- Labels are lowercase except for section divider caps and the DISPATCH wordmark.
- Placeholder text in textareas should describe the actual use case, not just say "Enter text here."
- Timestamps are relative ("2h ago", "Yesterday", "3 days ago") until they are more than a week old, then they show the date ("Mar 20").
- Post status always uses these exact words: Idea, Scripted, Filmed, Edited, Posted. Never abbreviated, never synonymized.
- Ada is always "an AI secretary." Never "assistant," "tool," "bot," or "app" in any copy that describes what Ada is.
- Content pillars always use their exact names: Hot Take, Hackathon, Founder, Explainer, Origin, Research. Never shortened or paraphrased.

**Error messages:**
- Short and specific. "Generation failed -- try again." Not "Something went wrong."
- Never blame the user.
- Always give a next action.

**Empty states:**
- Library empty: "Nothing scripted yet. Generate a script or convert an idea."
- Story Bank empty: "Mine your first memory. The best content comes from real moments."
- Ideas empty: "Nothing queued. Add an idea before you forget it."

---

## What Dispatch Is Not

To keep the brand consistent, it helps to know what to avoid:

- Not a social media scheduler. Dispatch does not auto-post. It helps you plan and create. You post manually.
- Not a public product. There is no marketing page, no pricing, no signup flow. The login screen is the entire public surface.
- Not generic. Every AI output, every piece of copy, every placeholder should be specific to Anirudh's actual background and content pillars. Generic outputs are a bug, not a feature.
- Not dark. The light theme is not optional. It is the brand.
- Not precious. This is a working tool. If a feature does not make the content better or faster, it does not belong.

---

## File References

| File | What it controls |
|------|-----------------|
| `tailwind.config.ts` | All color tokens, font family definitions |
| `app/globals.css` | CSS custom properties, scrollbar, base resets |
| `lib/constants.ts` | Pillar colors, status colors, badge classes |
| `components/ui/Badge.tsx` | Badge rendering for pillar and status |
| `components/ui/Button.tsx` | All button variants |
| `components/nav/Sidebar.tsx` | Navigation, wordmark, user footer |

Any change to color, typography, or spacing should start in `tailwind.config.ts` and `globals.css`. Do not hardcode hex values in component files -- always reference a token.

---

*Dispatch Brand Guide — Anirudh Manjesh — March 2026*