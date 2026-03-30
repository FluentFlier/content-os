---
name: video-worker
description: Worker for building the Remotion-based video editing studio in Dispatch.
---

# Video Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Features that involve:
- Video Studio page and navigation
- Remotion Player integration
- Video upload and storage
- AI-powered video composition
- Video templates
- Content pipeline integration for video

## Required Skills

- `agent-browser` - For verifying Video Studio UI renders, Remotion Player loads, templates display. Invoke after implementation.

## Work Procedure

1. **Read the feature description** and understand which video capability is being built.

2. **Check Remotion is installed**:
   - Verify `remotion` and `@remotion/player` are in package.json
   - If not, install: `npm install remotion @remotion/player`

3. **For Video Studio page**:
   - Create `src/app/(dashboard)/video-studio/page.tsx`
   - Add route to middleware PROTECTED list
   - Add nav item to Sidebar.tsx and BottomBar.tsx
   - Follow Brand Guide for styling (light theme)

4. **For Remotion Player**:
   - Import `Player` from `@remotion/player` in a client component
   - Wrap in "use client" directive
   - Player needs: component, durationInFrames, fps, compositionWidth/Height
   - Create video composition components in `src/components/video-studio/`

5. **For video upload**:
   - Create drag-and-drop zone with onDragOver/onDrop handlers
   - Accept video/* MIME types (.mp4, .mov, .webm)
   - Upload to InsForge Storage bucket
   - Display file metadata (name, size) after upload
   - Show upload progress

6. **For AI composition**:
   - Create API route: `src/app/api/video/generate/route.ts`
   - Takes text prompt describing desired video
   - Uses generateContent() with a system prompt that instructs Claude to output Remotion JSX
   - Parse and validate the returned code
   - Render in Remotion Player

7. **For templates**:
   - Create template components under `src/components/video-studio/templates/`
   - Each template: React component with configurable props (text, colors, timing)
   - Minimum 3 templates: CaptionOverlay, HookContent, TalkingPoints
   - Template selector UI with preview thumbnails

8. **Verify**:
   - `npm run build` must pass (Remotion components must compile)
   - Use agent-browser to verify Player renders with controls
   - Verify template gallery shows 3+ templates
   - Test API route for video generation

## Example Handoff

```json
{
  "salientSummary": "Built Video Studio page with Remotion Player, drag-and-drop upload zone, and 3 starter templates. Page accessible from sidebar nav. Player renders compositions with play/pause/seek controls. npm run build passes.",
  "whatWasImplemented": "Created /video-studio page with VideoEditor component containing: upload drop zone (accepts mp4/mov/webm), Remotion Player wrapper for preview, template gallery with CaptionOverlay, HookContent, and TalkingPoints templates. Each template has customizable text/color/timing props. Added Video Studio to sidebar and bottom bar nav.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      { "command": "npm run build", "exitCode": 0, "observation": "Compiled with Remotion components" }
    ],
    "interactiveChecks": [
      { "action": "Opened /video-studio via agent-browser", "observed": "Page renders with upload zone and template gallery" },
      { "action": "Selected CaptionOverlay template", "observed": "Remotion Player loads with caption composition, controls visible" },
      { "action": "Checked sidebar nav", "observed": "Video Studio link present with film icon, highlights when active" }
    ]
  },
  "tests": { "added": [] },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- Remotion has breaking changes or version conflicts
- InsForge Storage not accessible for uploads
- Remotion rendering requires server-side infrastructure not set up
- AI-generated composition code fails to parse/render consistently
