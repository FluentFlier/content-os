"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Save,
  Trash2,
  RefreshCw,
  ArrowRight,
  Monitor,
  Repeat2,
} from "lucide-react";
import { getInsforge } from "@/lib/insforge/client";
import MediaUpload from "@/components/MediaUpload";
import type { Post, Pillar, Platform, PostStatus, Series } from "@/types/database";
import {
  ALL_PILLARS,
  ALL_PLATFORMS,
  ALL_STATUSES,
  PILLAR_LABELS,
  STATUS_COLORS,
} from "@/types/database";

interface PostEditorProps {
  post: Post;
  userId: string;
  series: Series[];
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
}

export default function PostEditor({
  post,
  userId,
  series,
  onClose,
  onSave,
  onDelete,
}: PostEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [regenerating, setRegenerating] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState(post.title);
  const [pillar, setPillar] = useState<Pillar>(post.pillar);
  const [platform, setPlatform] = useState<Platform>(post.platform);
  const [status, setStatus] = useState<PostStatus>(post.status);
  const [scheduledDate, setScheduledDate] = useState(post.scheduled_date ?? "");
  const [postedDate, setPostedDate] = useState(post.posted_date ?? "");
  const [hook, setHook] = useState(post.hook ?? "");
  const [script, setScript] = useState(post.script ?? "");
  const [caption, setCaption] = useState(post.caption ?? "");
  const [hashtags, setHashtags] = useState(post.hashtags ?? "");
  const [notes, setNotes] = useState(post.notes ?? "");
  const [seriesId, setSeriesId] = useState(post.series_id ?? "");
  const [views, setViews] = useState(post.views ?? 0);
  const [likes, setLikes] = useState(post.likes ?? 0);
  const [saves, setSaves] = useState(post.saves ?? 0);
  const [comments, setComments] = useState(post.comments ?? 0);
  const [shares, setShares] = useState(post.shares ?? 0);
  const [followsGained, setFollowsGained] = useState(post.follows_gained ?? 0);

  // Sync when post changes
  useEffect(() => {
    setTitle(post.title);
    setPillar(post.pillar);
    setPlatform(post.platform);
    setStatus(post.status);
    setScheduledDate(post.scheduled_date ?? "");
    setPostedDate(post.posted_date ?? "");
    setHook(post.hook ?? "");
    setScript(post.script ?? "");
    setCaption(post.caption ?? "");
    setHashtags(post.hashtags ?? "");
    setNotes(post.notes ?? "");
    setSeriesId(post.series_id ?? "");
    setViews(post.views ?? 0);
    setLikes(post.likes ?? 0);
    setSaves(post.saves ?? 0);
    setComments(post.comments ?? 0);
    setShares(post.shares ?? 0);
    setFollowsGained(post.follows_gained ?? 0);
  }, [post]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const insforge = getInsforge();
      await insforge.database
        .from("posts")
        .update({
          title,
          pillar,
          platform,
          status,
          script: script || null,
          caption: caption || null,
          hashtags: hashtags || null,
          hook: hook || null,
          notes: notes || null,
          scheduled_date: scheduledDate || null,
          posted_date: postedDate || null,
          views: views || null,
          likes: likes || null,
          saves: saves || null,
          comments: comments || null,
          shares: shares || null,
          follows_gained: followsGained || null,
          series_id: seriesId || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", post.id)
        .eq("user_id", userId);
      onSave();
    } catch (err) {
      console.error("Failed to save post", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const insforge = getInsforge();
      await insforge.database
        .from("posts")
        .delete()
        .eq("id", post.id)
        .eq("user_id", userId);
      onDelete();
    } catch (err) {
      console.error("Failed to delete post", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleRegenerate = async (field: "caption" | "hook") => {
    setRegenerating(field);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: field,
          pillar,
          platform,
          script,
          title,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (field === "caption") setCaption(data.result ?? data.caption ?? "");
        if (field === "hook") setHook(data.result ?? data.hook ?? "");
      }
    } catch (err) {
      console.error(`Failed to regenerate ${field}`, err);
    } finally {
      setRegenerating(null);
    }
  };

  const advanceStatus = () => {
    const idx = ALL_STATUSES.indexOf(status);
    if (idx < ALL_STATUSES.length - 1) {
      setStatus(ALL_STATUSES[idx + 1]);
    }
  };

  const statusIdx = ALL_STATUSES.indexOf(status);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:bg-black/30"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full md:w-[480px] bg-surface border-l border-border z-50 flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="font-heading text-lg font-bold text-text-primary truncate">
            {title || "Untitled"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-bg text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Status pipeline */}
          <div className="space-y-2">
            <label className="text-xs text-text-muted font-medium uppercase tracking-wide">
              Status Pipeline
            </label>
            <div className="flex items-center gap-1">
              {ALL_STATUSES.map((s, i) => {
                const color = STATUS_COLORS[s];
                const isActive = i <= statusIdx;
                const isCurrent = s === status;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-full h-2 rounded-full transition-colors"
                      style={{
                        backgroundColor: isActive ? color : `${color}25`,
                      }}
                    />
                    <span
                      className="text-[10px] capitalize"
                      style={{
                        color: isCurrent ? color : "var(--text-muted, #5A5047)",
                        fontWeight: isCurrent ? 600 : 400,
                      }}
                    >
                      {s}
                    </span>
                  </button>
                );
              })}
            </div>
            {statusIdx < ALL_STATUSES.length - 1 && (
              <button
                onClick={advanceStatus}
                className="flex items-center gap-1 text-xs text-coral hover:opacity-80 mt-1"
              >
                Advance to {ALL_STATUSES[statusIdx + 1]}
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="h-px bg-border" />

          {/* Title */}
          <FieldGroup label="Title">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-coral"
            />
          </FieldGroup>

          {/* Pillar + Platform + Series row */}
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Pillar">
              <select
                value={pillar}
                onChange={(e) => setPillar(e.target.value as Pillar)}
                className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-coral"
              >
                {ALL_PILLARS.map((p) => (
                  <option key={p} value={p}>
                    {PILLAR_LABELS[p]}
                  </option>
                ))}
              </select>
            </FieldGroup>
            <FieldGroup label="Platform">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
                className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-coral"
              >
                {ALL_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </FieldGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Scheduled Date">
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-coral"
              />
            </FieldGroup>
            <FieldGroup label="Series">
              <select
                value={seriesId}
                onChange={(e) => setSeriesId(e.target.value)}
                className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-coral"
              >
                <option value="">None</option>
                {series.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </FieldGroup>
          </div>

          <div className="h-px bg-border" />

          {/* Hook */}
          <FieldGroup
            label="Hook"
            action={
              <button
                onClick={() => handleRegenerate("hook")}
                disabled={regenerating === "hook"}
                className="flex items-center gap-1 text-[11px] text-coral hover:opacity-80 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${regenerating === "hook" ? "animate-spin" : ""}`} />
                Regenerate
              </button>
            }
          >
            <textarea
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              rows={2}
              className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-coral resize-none"
            />
          </FieldGroup>

          {/* Script */}
          <FieldGroup label="Script">
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={8}
              className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-coral resize-y"
            />
          </FieldGroup>

          {/* Caption */}
          <FieldGroup
            label="Caption"
            action={
              <button
                onClick={() => handleRegenerate("caption")}
                disabled={regenerating === "caption"}
                className="flex items-center gap-1 text-[11px] text-coral hover:opacity-80 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${regenerating === "caption" ? "animate-spin" : ""}`} />
                Regenerate
              </button>
            }
          >
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-coral resize-none"
            />
          </FieldGroup>

          {/* Hashtags */}
          <FieldGroup label="Hashtags">
            <textarea
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              rows={2}
              className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-coral resize-none"
              placeholder="#content #creator"
            />
          </FieldGroup>

          {/* Notes */}
          <FieldGroup label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-coral resize-none"
            />
          </FieldGroup>

          <div className="h-px bg-border" />

          {/* Media */}
          <FieldGroup label="Media">
            <MediaUpload userId={userId} postId={post.id} />
          </FieldGroup>

          {/* Performance stats (shown when posted) */}
          {status === "posted" && (
            <>
              <div className="h-px bg-border" />
              <label className="text-xs text-text-muted font-medium uppercase tracking-wide">
                Performance
              </label>
              <FieldGroup label="Posted Date">
                <input
                  type="date"
                  value={postedDate}
                  onChange={(e) => setPostedDate(e.target.value)}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-coral"
                />
              </FieldGroup>
              <div className="grid grid-cols-3 gap-3">
                <NumberField label="Views" value={views} onChange={setViews} />
                <NumberField label="Likes" value={likes} onChange={setLikes} />
                <NumberField label="Saves" value={saves} onChange={setSaves} />
                <NumberField label="Comments" value={comments} onChange={setComments} />
                <NumberField label="Shares" value={shares} onChange={setShares} />
                <NumberField label="Follows" value={followsGained} onChange={setFollowsGained} />
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-border px-5 py-3 flex flex-wrap gap-2 shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-coral text-white text-sm font-medium px-4 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => router.push(`/generate?tab=repurpose&postId=${post.id}`)}
            className="flex items-center gap-1.5 border border-border text-text-primary text-sm px-3 py-2 rounded hover:bg-bg transition-colors"
          >
            <Repeat2 className="w-4 h-4" />
            Repurpose
          </button>
          <button
            onClick={() => router.push(`/teleprompter?postId=${post.id}`)}
            className="flex items-center gap-1.5 border border-border text-text-primary text-sm px-3 py-2 rounded hover:bg-bg transition-colors"
          >
            <Monitor className="w-4 h-4" />
            Teleprompter
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 border border-red-900 text-red-400 text-sm px-3 py-2 rounded hover:bg-red-950/30 transition-colors ml-auto disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ---- Helper components ---- */

function FieldGroup({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs text-text-muted font-medium">{label}</label>
        {action}
      </div>
      {children}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] text-text-muted">{label}</label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-full bg-bg border border-border rounded px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-coral"
      />
    </div>
  );
}
