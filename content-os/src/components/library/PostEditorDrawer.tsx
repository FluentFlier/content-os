'use client';

import { useCallback, useEffect, useState } from 'react';
import { X, Wand2, Copy, MonitorPlay, Trash2 } from 'lucide-react';
import type { Post, Series } from '@/lib/types';
import type { Status } from '@/lib/constants';
import { PLATFORMS, STATUSES, STATUS_LABELS } from '@/lib/constants';
import { usePillars } from '@/hooks/usePillars';
import StatusPipeline from '@/components/library/StatusPipeline';
import PerformanceModal from '@/components/library/PerformanceModal';
import PublishPanel from '@/components/library/PublishPanel';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';

interface PostEditorDrawerProps {
  post: Post;
  series: Series[];
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
}

export default function PostEditorDrawer({ post, series, onClose, onSave, onDelete }: PostEditorDrawerProps) {
  const { toast } = useToast();
  const { pillars: pillarList } = usePillars();
  const [form, setForm] = useState({
    title: post.title,
    pillar: post.pillar,
    platform: post.platform,
    status: post.status,
    scheduled_date: post.scheduled_date ?? '',
    hook: post.hook ?? '',
    script: post.script ?? '',
    caption: post.caption ?? '',
    hashtags: post.hashtags ?? '',
    notes: post.notes ?? '',
    series_id: post.series_id ?? '',
    series_position: post.series_position ?? 1,
  });
  const [showPerfModal, setShowPerfModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Auto-save on blur
  const autoSave = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          series_id: form.series_id || null,
          scheduled_date: form.scheduled_date || null,
          updated_at: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        toast('Saved');
        onSave();
      }
    } catch {
      toast('Save failed', 'error');
    }
  }, [form, post.id, onSave, toast]);

  const handleStatusChange = async (status: Status) => {
    if (status === 'posted' && form.status !== 'posted') {
      setForm((f) => ({ ...f, status }));
      setShowPerfModal(true);
      return;
    }
    setForm((f) => ({ ...f, status }));
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
      });
      if (res.ok) {
        toast('Status updated');
        onSave();
      }
    } catch {
      toast('Update failed', 'error');
    }
  };

  const handlePerfSave = async (data: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast('Performance logged');
        setShowPerfModal(false);
        onSave();
      }
    } catch {
      toast('Save failed', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    setDeleting(true);
    try {
      await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      toast('Post deleted');
      onDelete();
    } catch {
      toast('Delete failed', 'error');
      setDeleting(false);
    }
  };

  const handleRegenerate = async (field: 'caption' | 'hook') => {
    const prompt = field === 'caption'
      ? `Write a social media caption for this script. Be concise, punchy, no em dashes:\n\n${form.script}`
      : `Write a strong hook (first line) for this content. No em dashes:\n\n${form.script}`;
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) {
        const data = await res.json();
        setForm((f) => ({ ...f, [field]: data.text }));
        toast(`${field === 'caption' ? 'Caption' : 'Hook'} regenerated`);
      }
    } catch {
      toast('Generation failed', 'error');
    }
  };

  function update(key: string, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const inputClass = "w-full bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] px-3 py-2 text-[13px] text-[#FAFAFA] focus:outline-none focus:border-[#FAFAFA]/40 transition-colors";
  const labelClass = "text-[11px] text-[#71717A] mb-1 block font-medium tracking-[0.05em]";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 z-[65] w-full sm:w-[480px] bg-[#09090B] border-l-[0.5px] border-[#FAFAFA]/12 overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-[0.5px] border-[#FAFAFA]/12 shrink-0">
          <h2 className="font-heading text-[18px] font-[700] text-[#FAFAFA]">Edit Post</h2>
          <button onClick={onClose} className="text-[#71717A] hover:text-[#FAFAFA] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title */}
          <label className="block">
            <span className={labelClass}>Title</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              onBlur={autoSave}
              className={inputClass}
            />
          </label>

          {/* Selects row */}
          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className={labelClass}>Pillar</span>
              <select
                value={form.pillar}
                onChange={(e) => { update('pillar', e.target.value); }}
                onBlur={autoSave}
                className={inputClass}
              >
                {pillarList.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Platform</span>
              <select
                value={form.platform}
                onChange={(e) => { update('platform', e.target.value); }}
                onBlur={autoSave}
                className={inputClass}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Status</span>
              <select
                value={form.status}
                onChange={(e) => handleStatusChange(e.target.value as Status)}
                className={inputClass}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Scheduled date */}
          <label className="block">
            <span className={labelClass}>Scheduled Date</span>
            <input
              type="date"
              value={form.scheduled_date}
              onChange={(e) => update('scheduled_date', e.target.value)}
              onBlur={autoSave}
              className={inputClass}
            />
          </label>

          {/* Hook */}
          <label className="block">
            <span className={labelClass}>Hook</span>
            <textarea
              rows={3}
              value={form.hook}
              onChange={(e) => update('hook', e.target.value)}
              onBlur={autoSave}
              className={`${inputClass} resize-none`}
            />
          </label>

          {/* Script */}
          <label className="block">
            <span className={labelClass}>Script</span>
            <textarea
              rows={10}
              value={form.script}
              onChange={(e) => update('script', e.target.value)}
              onBlur={autoSave}
              className={`${inputClass} resize-none`}
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            />
          </label>

          {/* Caption */}
          <label className="block">
            <span className={labelClass}>Caption</span>
            <textarea
              rows={5}
              value={form.caption}
              onChange={(e) => update('caption', e.target.value)}
              onBlur={autoSave}
              className={`${inputClass} resize-none`}
            />
          </label>

          {/* Hashtags */}
          <label className="block">
            <span className={labelClass}>Hashtags</span>
            <textarea
              rows={3}
              value={form.hashtags}
              onChange={(e) => update('hashtags', e.target.value)}
              onBlur={autoSave}
              className={`${inputClass} resize-none`}
            />
          </label>

          {/* Notes */}
          <label className="block">
            <span className={labelClass}>Notes</span>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              onBlur={autoSave}
              className={`${inputClass} resize-none`}
            />
          </label>

          {/* Series */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelClass}>Series</span>
              <select
                value={form.series_id}
                onChange={(e) => update('series_id', e.target.value)}
                onBlur={autoSave}
                className={inputClass}
              >
                <option value="">None</option>
                {series.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
            {form.series_id && (
              <label className="block">
                <span className={labelClass}>Position</span>
                <input
                  type="number"
                  min={1}
                  value={form.series_position}
                  onChange={(e) => update('series_position', parseInt(e.target.value) || 1)}
                  onBlur={autoSave}
                  className={inputClass}
                />
              </label>
            )}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleRegenerate('caption')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] text-[#FAFAFA] bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] hover:border-[#FAFAFA]/25 transition-colors"
            >
              <Wand2 size={14} /> Regenerate Caption
            </button>
            <button
              type="button"
              onClick={() => handleRegenerate('hook')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] text-[#FAFAFA] bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] hover:border-[#FAFAFA]/25 transition-colors"
            >
              <Wand2 size={14} /> Regenerate Hook
            </button>
            <button
              type="button"
              onClick={() => {
                if (form.script) {
                  navigator.clipboard.writeText(form.script);
                  toast('Script copied for repurpose');
                }
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] text-[#FAFAFA] bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] hover:border-[#FAFAFA]/25 transition-colors"
            >
              <Copy size={14} /> Repurpose
            </button>
            <Link
              href={`/teleprompter?postId=${post.id}`}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] text-[#FAFAFA] bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] hover:border-[#FAFAFA]/25 transition-colors"
            >
              <MonitorPlay size={14} /> Open Teleprompter
            </Link>
          </div>

          {/* Publish section divider */}
          <div className="pt-3">
            <span className="text-[10px] font-medium tracking-[0.10em] uppercase text-[#71717A]">
              PUBLISH
            </span>
          </div>

          {/* Publish Panel */}
          <PublishPanel
            postId={post.id}
            content={form.script || form.hook || form.title}
            caption={form.caption}
            onPublishSuccess={() => {
              setForm((f) => ({ ...f, status: 'posted' }));
              toast('Published! Post status updated.');
              onSave();
            }}
          />

          {/* Delete */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 text-[11px] text-[#6366F1] hover:opacity-80 transition-opacity mt-2"
          >
            <Trash2 size={14} /> Delete Post
          </button>
        </div>

        {/* Status pipeline bar at bottom */}
        <div className="shrink-0 border-t-[0.5px] border-[#FAFAFA]/12 p-4">
          <StatusPipeline current={form.status} onChange={handleStatusChange} />
        </div>
      </div>

      {/* Performance Modal */}
      {showPerfModal && (
        <PerformanceModal
          post={post}
          onSave={handlePerfSave}
          onClose={() => setShowPerfModal(false)}
        />
      )}
    </>
  );
}
