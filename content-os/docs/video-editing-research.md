# AI Video Editing Integration Research

> Research compiled March 2026 for Content OS / Dispatch (Next.js 14 + Tailwind CSS)

---

## Executive Summary

There are **three tiers** of viable video editing integration for Content OS:

1. **Client-side (browser)**: FFmpeg.wasm for basic operations; limited but free
2. **React-native programmatic**: Remotion for building video compositions in React code
3. **Cloud APIs**: Shotstack, Creatomate, ZapCap, JSON2Video, Plainly for server-rendered video

**Top Recommendation**: A hybrid approach using **Remotion** (for in-app preview/composition) + **ZapCap API** (for AI-driven auto-captioning/silence removal) + **FFmpeg.wasm** (for lightweight client-side trims). This maximizes user value while keeping integration manageable.

---

## Detailed Option Comparison

### 1. FFmpeg.wasm (Client-Side)

| Attribute | Details |
|---|---|
| **What it is** | WebAssembly port of FFmpeg that runs entirely in the browser |
| **Runs where** | 100% in-browser (client-side) — no server needed |
| **npm package** | `@ffmpeg/ffmpeg` (+ `@ffmpeg/core`) |
| **Pricing** | Free / open-source (LGPL) |
| **Key features** | Trim/cut, merge, format conversion, add audio, extract frames, resize, apply filters, add watermarks |
| **AI capabilities** | None — purely a video processing tool, no AI features |
| **Auto-editing** | No — manual specification of operations required |
| **Next.js integration** | Moderate difficulty. Must run client-side only (`"use client"`). Known issues with SharedArrayBuffer (requires COOP/COEP headers). Several GitHub issues document Next.js + Vercel deployment challenges. |
| **Limitations** | Large WASM binary (~25MB), memory-constrained (browser tab limits), no GPU acceleration, can be slow for long videos, no multithreading on Safari. "Memory access out of bounds" errors reported with large files. |
| **Best for** | Quick trims, format conversion, thumbnail extraction, basic editing where server costs must be zero |

**Verdict**: ✅ Good as a **lightweight utility layer** for basic in-browser operations (trim, thumbnail generation). Not suitable as the primary editing engine for complex operations.

---

### 2. Remotion (React Video Framework)

| Attribute | Details |
|---|---|
| **What it is** | React framework for creating videos programmatically using JSX components |
| **Runs where** | Preview in-browser via `<Player>` component; rendering server-side (Node.js, AWS Lambda, Vercel Sandbox) |
| **npm packages** | `remotion`, `@remotion/player`, `@remotion/renderer`, `@remotion/lambda` |
| **Pricing** | **Free** for individuals, orgs ≤3 employees, non-profits, and evaluation. **Company license required** for larger orgs (paid, contact for pricing) |
| **Key features** | React component-based video composition, frame-by-frame control, `<Sequence>` for timing, `<Video>` for media import, `interpolate()` for animations, parameterized rendering, timeline building, text overlays, transitions |
| **AI capabilities** | None built-in, but **Claude Code + Remotion** is a proven 2026 pattern — Claude generates Remotion JSX code to produce videos automatically |
| **Auto-editing** | Not natively, but can be orchestrated by AI (Claude/GPT generates the composition code based on instructions) |
| **Next.js integration** | Well-supported. `<Player>` works client-side in Next.js. Server-side rendering via Vercel Sandbox, AWS Lambda, or Cloud Run. Official docs cover Next.js integration. |
| **Rendering options** | Vercel Sandbox (easiest for Next.js), AWS Lambda (~$0.01-0.05/video), Cloud Run, self-hosted Node.js |
| **Limitations** | Rendering is compute-intensive. Cannot edit pre-existing video files in-place (it *creates* new videos from compositions). Needs headless browser + FFmpeg for rendering. |
| **Best for** | Creating branded video content from templates, text-to-video, data-driven videos, social media clips with custom overlays/captions |

**Verdict**: ⭐ **Strongest recommendation for Content OS**. Native React integration, great for creating branded content videos. Combine with Claude AI to auto-generate compositions from user prompts. The `<Player>` component provides in-app preview.

---

### 3. Shotstack (Cloud Video API)

| Attribute | Details |
|---|---|
| **What it is** | Cloud-based video editing API with JSON timeline specification |
| **Runs where** | Server-side (cloud-rendered); API calls from Next.js backend |
| **SDK** | Node.js SDK available (`shotstack`) |
| **Pricing** | Pay-as-you-go: $0.30/min rendered. Subscription plans from ~$49/month. Free trial available. |
| **Key features** | Multi-track timeline (JSON-based), text overlays, transitions, merge clips, trim, add audio, picture-in-picture, speed control, filters, AI-powered templates |
| **AI capabilities** | AI template generation, text-to-video, AI-powered asset selection |
| **Auto-editing** | Partial — supports template-based auto-generation but not intelligent content-aware editing (no auto silence removal, no auto scene detection) |
| **Next.js integration** | Easy — REST API calls from API routes. Node.js SDK available. |
| **Limitations** | Cloud-only (no offline/browser processing), rendering takes time (async webhook-based), costs scale with video minutes |
| **Best for** | Template-based video creation at scale, marketing videos, automated social media content |

**Verdict**: ✅ Good option for **template-driven batch video creation**. Clean API, good Node.js SDK. But lacks the AI-driven auto-editing features (silence removal, auto-captions) that the user specifically wants.

---

### 4. Creatomate (Cloud Video API)

| Attribute | Details |
|---|---|
| **What it is** | Cloud API for automated video/image generation with template system |
| **Runs where** | Server-side (cloud-rendered) |
| **SDK** | Node.js SDK (`creatomate`), REST API |
| **Pricing** | Starts ~$54/month (Essential). Growth and Beyond tiers available. Credit-based system. Free trial with 50 credits. |
| **Key features** | Template editor (drag-and-drop), JSON/API-based rendering, dynamic text/images, transitions, multi-format output, batch rendering |
| **AI capabilities** | Limited — template-driven, not content-aware AI editing |
| **Auto-editing** | Template-based automation only (fill in data → get video). No auto silence removal or intelligent editing. |
| **Next.js integration** | Easy — REST API calls from API routes. Official Node.js SDK. |
| **Limitations** | Template-centric (less flexible for free-form editing), credit system can get expensive at scale |
| **Best for** | Marketing video automation, social media content from templates, data-driven video personalization |

**Verdict**: ✅ Solid for **template-based content generation** (e.g., auto-generating Instagram stories from blog posts). Less useful for editing raw video footage.

---

### 5. ZapCap (AI Video Editing API)

| Attribute | Details |
|---|---|
| **What it is** | AI-powered video editing API specializing in captions, silence removal, and viral content optimization |
| **Runs where** | Server-side (cloud API) |
| **API** | REST API |
| **Pricing** | API: $0.10/minute of video processed. App plans: Free tier, Starter $8/mo, Pro $16/mo, Agency+ custom |
| **Key features** | **Auto captions** (99.9% accuracy, 100+ languages), **silence removal**, B-roll injection, sound effects, transitions, animated subtitles, multiple caption styles |
| **AI capabilities** | ⭐ **Best AI auto-editing**: automatic transcription (Whisper-based), silence detection/removal, content-aware caption styling, viral clip optimization |
| **Auto-editing** | **Yes** — takes raw video and automatically adds captions, removes silences, adds transitions |
| **Next.js integration** | Moderate — REST API calls from API routes. No official SDK but straightforward HTTP integration. |
| **Limitations** | Focused primarily on short-form/social content. Less suitable for long-form cinematic editing. Newer platform. |
| **Best for** | **Auto-captioning, silence removal, short-form social content optimization** — exactly what "automatically edits videos" means for most content creators |

**Verdict**: ⭐ **Strongest recommendation for AI auto-editing**. This is the closest match to "automatically edits videos as required." At $0.10/min, very cost-effective. Perfect complement to Remotion.

---

### 6. JSON2Video (Cloud Video API)

| Attribute | Details |
|---|---|
| **What it is** | Cloud API for creating videos from JSON data |
| **Runs where** | Server-side (cloud) |
| **API** | REST API |
| **Pricing** | Free plan (600 seconds). Basic: $14.95/mo. Cloud plans scale up. Credit-based. |
| **Key features** | JSON-to-video, template-based, text overlays, transitions, multi-scene composition |
| **AI capabilities** | Minimal |
| **Auto-editing** | Template fill only |
| **Next.js integration** | Easy — REST API |
| **Limitations** | Basic feature set, less mature ecosystem than Shotstack/Creatomate |
| **Best for** | Budget-friendly automated video generation from structured data |

**Verdict**: 🟡 Decent budget option but fewer features than alternatives. Consider only if cost is the primary driver.

---

### 7. Plainly (After Effects API)

| Attribute | Details |
|---|---|
| **What it is** | Video generation API that renders After Effects templates in the cloud |
| **Runs where** | Server-side (cloud) |
| **API** | REST API, webhooks |
| **Pricing** | Starts at $69/month (Starter). Higher tiers for volume. |
| **Key features** | After Effects template rendering, dynamic data insertion, batch processing |
| **AI capabilities** | None — template-driven only |
| **Auto-editing** | No |
| **Next.js integration** | Easy — REST API |
| **Limitations** | Requires After Effects templates (design dependency), higher price point, no AI features |
| **Best for** | Teams with existing After Effects workflows who want to automate rendering |

**Verdict**: 🟡 Only relevant if the team already uses After Effects. Not recommended as primary integration for Content OS.

---

## Key Research Questions Answered

### Can FFmpeg.wasm handle video editing in the browser?

**Yes, with significant caveats.** FFmpeg.wasm can perform:
- ✅ Trimming/cutting clips
- ✅ Merging multiple clips
- ✅ Format conversion (mp4, webm, etc.)
- ✅ Adding audio tracks
- ✅ Extracting thumbnails/frames
- ✅ Applying basic filters
- ⚠️ Limited by browser memory (large files will fail)
- ⚠️ No GPU acceleration (slow for HD+ content)
- ⚠️ Requires COOP/COEP headers for SharedArrayBuffer (multi-threading)
- ❌ No AI/intelligent editing
- ❌ Known stability issues with Next.js (memory access errors, loading issues)

**Recommendation**: Use for lightweight operations only (trim, thumbnail). Not suitable as the primary editor.

### What does Remotion offer for programmatic video creation?

Remotion provides a **complete React-based video creation framework**:
- Define video compositions as React components
- Frame-by-frame rendering control via `useCurrentFrame()`
- `<Sequence>` components for timing/ordering scenes
- `<Video>` and `<Audio>` for media import with trimming
- `interpolate()` for smooth animations
- `<Player>` component for in-app preview (embeddable in Next.js)
- Parameterized rendering (pass data → get unique videos)
- Server-side rendering via AWS Lambda (~$0.01-0.05/video) or Vercel Sandbox
- Timeline-based editor building blocks
- Works with any React styling (Tailwind, CSS-in-JS, etc.)

**Key insight**: Claude Code + Remotion is an established 2026 pattern. Users describe their desired video, Claude generates the Remotion composition code, and it renders automatically.

### Are there APIs that take raw video and auto-edit it?

**Yes — ZapCap is the strongest option:**
- Takes raw video → outputs edited video with captions, silence removed, transitions added
- $0.10/minute, REST API
- 99.9% transcription accuracy, 100+ languages
- Automatic silence detection and removal
- Auto-generated animated captions

**Other options for auto-editing:**
- **Vizard.ai** — AI auto-editing for repurposing long videos into clips
- **Opus Clip** — AI-powered clip extraction from long videos
- **Cutback** — AI silence removal and auto-shortening (Premiere Pro plugin, limited API)
- **VEED** — AI subtitles and basic auto-editing (web app, limited API)

---

## Recommended Integration Architecture for Content OS

```
┌─────────────────────────────────────────────────┐
│                 Content OS (Next.js)             │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────┐  ┌────────────────────────┐   │
│  │ FFmpeg.wasm  │  │  Remotion <Player>     │   │
│  │ (client-side)│  │  (in-app preview)      │   │
│  │              │  │                        │   │
│  │ • Quick trim │  │ • Live preview         │   │
│  │ • Thumbnails │  │ • Template selection   │   │
│  │ • Format conv│  │ • Parameter editing    │   │
│  └──────────────┘  └────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │        Next.js API Routes                │   │
│  │                                          │   │
│  │  ┌─────────┐  ┌──────────┐  ┌────────┐ │   │
│  │  │ ZapCap  │  │ Remotion │  │ Claude │ │   │
│  │  │  API    │  │ Lambda/  │  │  AI    │ │   │
│  │  │         │  │ Vercel   │  │        │ │   │
│  │  │• Captions│  │• Render  │  │• Generate│ │  │
│  │  │• Silence │  │  final   │  │ composition│ │ │
│  │  │  removal │  │  video   │  │ code    │ │  │
│  │  └─────────┘  └──────────┘  └────────┘ │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Priority Order for Implementation

| Priority | Tool | Purpose | Effort | Monthly Cost |
|---|---|---|---|---|
| **P0** | Remotion `<Player>` + compositions | In-app video preview & template system | Medium (2-3 days) | Free (individual license) |
| **P0** | Claude AI integration | Generate Remotion compositions from text prompts | Low (1 day, already have AI in app) | Existing AI costs |
| **P1** | ZapCap API | Auto-captions, silence removal on uploaded videos | Low (1 day) | ~$0.10/min processed |
| **P1** | Remotion Lambda/Vercel Sandbox | Server-side final video rendering | Medium (1-2 days) | ~$0.01-0.05/video (AWS) |
| **P2** | FFmpeg.wasm | Client-side quick trim, thumbnail extraction | Medium (1-2 days) | Free |
| **P3** | Shotstack or Creatomate | Template library for marketing videos | Low (1 day) | $49-54/mo |

### Total Estimated Integration Time: 5-8 days
### Total Estimated Monthly Cost: $10-50/mo for moderate usage (scales with video minutes)

---

## Files Referenced / Sources

- Remotion docs: https://remotion.dev/docs
- Remotion + Next.js: https://remotion.dev/docs/miscellaneous/nextjs
- Remotion pricing: https://remotion.dev/docs/license
- Remotion Lambda costs: https://remotion.dev/docs/lambda/cost-example
- FFmpeg.wasm: https://github.com/ffmpegwasm/ffmpeg.wasm
- FFmpeg.wasm + Next.js guide: https://www.blog.brightcoding.dev/2026/01/09/build-a-viral-video-editor-in-your-browser
- Shotstack: https://shotstack.io/pricing/
- Creatomate: https://creatomate.com/pricing
- ZapCap API: https://zapcap.ai/api/
- ZapCap pricing: https://zapcap.ai/pricing/
- JSON2Video: https://json2video.com/pricing/
- Plainly: https://plainlyvideos.com/pricing
- Claude + Remotion pattern: https://medium.com/aimonks/claude-code-remotion-the-2026-developer-stack
- Best video editing APIs 2026: https://www.plainlyvideos.com/blog/best-video-editing-api
