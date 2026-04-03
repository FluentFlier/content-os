# Daily-Use Upgrade Design
**Date**: 2026-04-02
**Goal**: Make Content OS usable every day -- image uploads, platform constraints, quick publish, better comment replies, performance tracking.

## 1. Image Upload System
- **Storage**: InsForge Storage bucket `post-media`
- **API**: `POST /api/upload` -- accepts multipart form data, stores to InsForge, returns public URL
- **UI**: `ImageUpload` component with drag-drop + click, preview, delete
- **Schema**: Add `image_url text` column to `posts` table
- **Integration**: PostEditorDrawer gets image upload section. GenerateOutput gets optional image attach.
- **Instagram fix**: publish route passes `image_url` to Instagram client, unblocking text+image posts

## 2. Platform Constraints (inline)
- **Component**: `PlatformConstraints` -- reads selected platform, shows rules
- **Live char counter**: Below caption/script textareas. Green < 80%, yellow 80-100%, red > 100%
- **Platform rules**:
  - Twitter: 280 chars/tweet, threads via delimiter, 4 images max, 5MB/image
  - LinkedIn: 3000 chars, 1 image, 10MB, first line is hook before "see more"
  - Instagram: 2200 chars caption, image required, 1:1 or 4:5 ratio, 30 hashtags max
  - Threads: 500 chars, 1 image optional, no hashtags
- **Image validation**: Warn if Instagram selected + no image attached

## 3. Quick Publish from Generate
- After generating, show "Publish Now" button in GenerateOutput
- Opens inline platform selector (checkboxes for connected platforms)
- One-click publish without saving to library first
- Creates a post record behind the scenes with status='posted'

## 4. Comment Replies Upgrade
- Show original comment paired with generated reply (side-by-side)
- Platform selector: dropdown for Instagram/Twitter/LinkedIn/Threads
- Prompt adapts per platform (Instagram = casual, LinkedIn = professional, Twitter = punchy)

## 5. Performance Tracking
- Posts table already has views/likes/saves/comments/shares/follows_gained columns
- Add "Log Performance" expandable section in PostEditorDrawer for posted content
- Number inputs for each metric + save button
- Library page: show mini perf badge on posted cards (total engagement number)

## Files to create
1. `src/app/api/upload/route.ts`
2. `src/components/ui/ImageUpload.tsx`
3. `src/components/ui/PlatformConstraints.tsx`
4. `src/components/ui/CharCount.tsx`

## Files to modify
1. `src/components/library/PostEditorDrawer.tsx` -- image upload, constraints, perf tracking
2. `src/components/generate/GenerateOutput.tsx` -- quick publish button
3. `src/components/generate/CommentReplies.tsx` -- paired display, platform selector
4. `src/app/api/publish/route.ts` -- pass image_url to Instagram
5. `db/schema.sql` -- add image_url to posts
